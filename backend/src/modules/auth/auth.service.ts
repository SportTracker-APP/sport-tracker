import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

import { MailService } from '../../mail/mail.service';
import { maskEmailAddress } from '../../mail/providers/resend-mail.provider';
import { PrismaService } from '../../prisma/prisma.service';

import { buildDefaultGoals } from '../goals/default-goals';

import {
  AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  AUTH_RATE_LIMIT_WINDOW_MS,
  BCRYPT_COST,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_RATE_LIMIT_MAX_ATTEMPTS,
} from './auth-security.constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const FORGOT_PASSWORD_MESSAGE =
  'Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.';
const REGISTER_MESSAGE =
  'Compte créé. Vérifiez votre boîte mail pour activer votre compte.';

const SECURE_TOKEN_BYTES = 32;
type ForgotPasswordRequestMeta = {
  ip?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly authRateLimits = new Map<string, RateLimitEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
      },
      {
        secret: this.getRequiredConfig('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
        algorithm: 'HS256',
      },
    );
  }

  private async generateRefreshToken(
    userId: string,
    email: string,
    role: string,
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
      },
      {
        secret: this.getRequiredConfig('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
        algorithm: 'HS256',
      },
    );
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_COST);

    await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);

    this.assertAuthRateLimit(`register:${email}`);

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Inscription impossible avec ces informations',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);

    const { user, verificationToken } = await this.prisma.$transaction(
      async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            firstName: dto.firstName,

            email,

            password: hashedPassword,

            goals: {
              create: buildDefaultGoals(),
            },
          },
        });

        const rawToken = this.generateSecureToken();
        const tokenHash = this.hashToken(rawToken);
        const createdVerificationToken = await tx.emailVerificationToken.create(
          {
            data: {
              userId: createdUser.id,
              tokenHash,
              expiresAt: new Date(
                Date.now() +
                  this.getEmailVerificationTokenTtlMinutes() * 60_000,
              ),
            },
            select: {
              id: true,
            },
          },
        );

        return {
          user: createdUser,
          verificationToken: {
            id: createdVerificationToken.id,
            rawToken,
          },
        };
      },
    );

    try {
      await this.mailService.sendEmailVerification({
        to: user.email,
        userName: user.firstName,
        verifyUrl: this.buildEmailVerificationUrl(verificationToken.rawToken),
        expirationMinutes: this.getEmailVerificationTokenTtlMinutes(),
        businessId: verificationToken.id,
      });
    } catch {
      this.logger.warn({
        emailType: 'auth.verify_email',
        recipient: maskEmailAddress(user.email),
        message: 'Email verification email failed',
      });
    }

    return {
      message: REGISTER_MESSAGE,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    this.assertAuthRateLimit(`verify-email:${dto.token}`);

    const tokenHash = this.hashToken(dto.token);
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              role: true,
              emailVerifiedAt: true,
            },
          },
        },
      });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Lien de vérification invalide ou expiré');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerifiedAt: verificationToken.user.emailVerifiedAt ?? now,
        },
      });

      await tx.emailVerificationToken.updateMany({
        where: {
          userId: verificationToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });
    });

    const accessToken = await this.generateAccessToken(
      verificationToken.user.id,
      verificationToken.user.email,
      verificationToken.user.role,
    );

    const refreshToken = await this.generateRefreshToken(
      verificationToken.user.id,
      verificationToken.user.email,
      verificationToken.user.role,
    );

    await this.updateRefreshToken(verificationToken.user.id, refreshToken);

    try {
      await this.mailService.sendWelcomeEmail({
        to: verificationToken.user.email,
        userName: verificationToken.user.firstName,
        businessId: verificationToken.user.id,
      });
    } catch {
      this.logger.warn({
        emailType: 'auth.welcome',
        recipient: maskEmailAddress(verificationToken.user.email),
        message: 'Welcome email failed',
      });
    }

    return {
      accessToken,

      refreshToken,

      user: {
        id: verificationToken.user.id,

        firstName: verificationToken.user.firstName,

        email: verificationToken.user.email,

        role: verificationToken.user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);

    this.assertAuthRateLimit(`login:${normalizedEmail}`);

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Compte bloqué');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Veuillez vérifier votre adresse email');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    const refreshToken = await this.generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    await this.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,

      refreshToken,

      user: {
        id: user.id,

        firstName: user.firstName,

        email: user.email,

        role: user.role,
      },
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    meta: ForgotPasswordRequestMeta = {},
  ) {
    const email = this.normalizeEmail(dto.email);

    if (this.isForgotPasswordRateLimited(email, meta.ip)) {
      return {
        message: FORGOT_PASSWORD_MESSAGE,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    if (!user) {
      return {
        message: FORGOT_PASSWORD_MESSAGE,
      };
    }

    const rawToken = this.generateSecureToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + this.getResetTokenTtlMinutes() * 60_000,
    );

    const resetToken = await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      return tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
        select: {
          id: true,
        },
      });
    });

    try {
      await this.mailService.sendPasswordResetEmail({
        to: user.email,
        userName: user.firstName,
        resetPasswordUrl: this.buildResetPasswordUrl(rawToken),
        expirationMinutes: this.getResetTokenTtlMinutes(),
        businessId: resetToken.id,
      });
    } catch {
      this.logger.warn({
        emailType: 'auth.reset_password',
        recipient: maskEmailAddress(user.email),
        message: 'Password reset email failed',
      });
    }

    return {
      message: FORGOT_PASSWORD_MESSAGE,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.assertAuthRateLimit(`reset-password:${dto.token}`);

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    this.assertPasswordPolicy(dto.password);

    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Lien invalide ou expiré');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: hashedPassword,
          refreshToken: null,
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });
    });

    try {
      await this.mailService.sendPasswordChangedEmail({
        to: resetToken.user.email,
        userName: resetToken.user.firstName,
        changedAt: now.toISOString(),
        deviceName: 'Appareil non identifié',
        location: 'Localisation non disponible',
        businessId: resetToken.id,
      });
    } catch {
      this.logger.warn({
        emailType: 'auth.password_changed',
        recipient: maskEmailAddress(resetToken.user.email),
        message: 'Password changed email failed',
      });
    }

    return {
      message: 'Mot de passe réinitialisé',
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,

      firstName: user.firstName,

      email: user.email,

      role: user.role,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateSecureToken(): string {
    return randomBytes(SECURE_TOKEN_BYTES).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getResetTokenTtlMinutes(): number {
    const configuredValue = this.configService.get<string>(
      'PASSWORD_RESET_TOKEN_TTL_MINUTES',
    );
    const parsedValue = Number(configuredValue ?? 30);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return 30;
    }

    return parsedValue;
  }

  private getEmailVerificationTokenTtlMinutes(): number {
    const configuredValue = this.configService.get<string>(
      'EMAIL_VERIFICATION_TOKEN_TTL_MINUTES',
    );
    const parsedValue = Number(configuredValue ?? 1440);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return 1440;
    }

    return parsedValue;
  }

  private buildResetPasswordUrl(token: string): string {
    const appBaseUrl =
      this.configService.get<string>('APP_BASE_URL') ?? 'http://localhost:3000';
    const resetUrl = new URL('/reset-password', appBaseUrl);
    resetUrl.searchParams.set('token', token);

    return resetUrl.toString();
  }

  private buildEmailVerificationUrl(token: string): string {
    const configuredUrl = this.configService.get<string>(
      'EMAIL_VERIFICATION_URL',
    );

    if (configuredUrl) {
      const url = new URL(configuredUrl);
      url.searchParams.set('token', token);

      return url.toString();
    }

    const appBaseUrl =
      this.configService.get<string>('APP_BASE_URL') ?? 'http://localhost:3000';
    const verificationUrl = new URL('/verify-email', appBaseUrl);
    verificationUrl.searchParams.set('token', token);

    return verificationUrl.toString();
  }

  private assertPasswordPolicy(password: string) {
    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre',
      );
    }
  }

  private isForgotPasswordRateLimited(email: string, ip?: string): boolean {
    const key = `forgot-password:${email}:${ip ?? 'unknown'}`;
    return this.isRateLimited(key, PASSWORD_RESET_RATE_LIMIT_MAX_ATTEMPTS);
  }

  private assertAuthRateLimit(key: string): void {
    if (this.isRateLimited(key, AUTH_RATE_LIMIT_MAX_ATTEMPTS)) {
      throw new BadRequestException('Trop de tentatives. Réessayez plus tard.');
    }
  }

  private isRateLimited(key: string, maxAttempts: number): boolean {
    const now = Date.now();
    const entry = this.authRateLimits.get(key);

    if (!entry || entry.resetAt <= now) {
      this.authRateLimits.set(key, {
        count: 1,
        resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
      });

      return false;
    }

    entry.count += 1;

    return entry.count > maxAttempts;
  }

  private getRequiredConfig(key: string): string {
    return this.configService.getOrThrow<string>(key);
  }
}
