import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { DEFAULT_ACCESS_TOKEN_TTL_SECONDS } from '../auth/auth-session.constants';
import type { AuthenticatedImpersonation } from '../auth/authenticated-request.type';

const DEFAULT_IMPERSONATION_TTL_MINUTES = 30;
const MIN_IMPERSONATION_TTL_MINUTES = 5;
const MAX_IMPERSONATION_TTL_MINUTES = 60;

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AdminImpersonationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async start(
    adminUserId: string,
    targetUserId: string,
    auditContext: AuditContext,
  ) {
    if (adminUserId === targetUserId) {
      throw new BadRequestException(
        'Impossible d’accéder à votre propre compte en mode admin',
      );
    }

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: adminUserId },
        select: {
          id: true,
          firstName: true,
          email: true,
          role: true,
          isBlocked: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          firstName: true,
          email: true,
          avatarUrl: true,
          role: true,
          isBlocked: true,
        },
      }),
    ]);

    if (!admin || admin.role !== UserRole.ADMIN || admin.isBlocked) {
      throw new ForbiddenException('Accès administrateur requis');
    }

    if (!target) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (target.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'L’accès délégué à un autre administrateur est interdit',
      );
    }

    if (target.isBlocked) {
      throw new ForbiddenException(
        'Impossible d’accéder à un compte utilisateur bloqué',
      );
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + this.getImpersonationTtlSeconds() * 1_000,
    );

    const session = await this.prisma.$transaction(async (transaction) => {
      await transaction.adminImpersonationSession.updateMany({
        where: {
          adminUserId: admin.id,
          endedAt: null,
        },
        data: {
          endedAt: startedAt,
        },
      });

      return transaction.adminImpersonationSession.create({
        data: {
          adminUserId: admin.id,
          targetUserId: target.id,
          adminEmail: admin.email,
          targetEmail: target.email,
          startedAt,
          expiresAt,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        },
      });
    });

    const impersonation: AuthenticatedImpersonation = {
      sessionId: session.id,
      adminId: admin.id,
      adminEmail: admin.email,
      adminFirstName: admin.firstName,
      expiresAt: expiresAt.toISOString(),
    };

    return {
      accessToken: await this.signAccessToken(
        target.id,
        target.email,
        target.role,
        this.getImpersonationTtlSeconds(),
        impersonation,
      ),
      user: {
        id: target.id,
        firstName: target.firstName,
        email: target.email,
        role: target.role,
        avatarUrl: target.avatarUrl,
        impersonation,
      },
    };
  }

  async stop(
    targetUserId: string,
    impersonation?: AuthenticatedImpersonation,
  ) {
    if (!impersonation) {
      throw new BadRequestException('Aucun mode admin actif');
    }

    const session = await this.prisma.adminImpersonationSession.findUnique({
      where: {
        id: impersonation.sessionId,
      },
    });

    if (
      !session ||
      session.endedAt ||
      session.adminUserId !== impersonation.adminId ||
      session.targetUserId !== targetUserId
    ) {
      throw new UnauthorizedException('Session administrateur invalide');
    }

    const admin = await this.prisma.user.findUnique({
      where: {
        id: impersonation.adminId,
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        avatarUrl: true,
        role: true,
        isBlocked: true,
      },
    });

    if (!admin || admin.role !== UserRole.ADMIN || admin.isBlocked) {
      throw new UnauthorizedException('Compte administrateur indisponible');
    }

    await this.prisma.adminImpersonationSession.update({
      where: {
        id: session.id,
      },
      data: {
        endedAt: new Date(),
      },
    });

    return {
      accessToken: await this.signAccessToken(
        admin.id,
        admin.email,
        admin.role,
        this.getAccessTokenTtlSeconds(),
      ),
      user: {
        id: admin.id,
        firstName: admin.firstName,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
      },
    };
  }

  private async signAccessToken(
    userId: string,
    email: string,
    role: UserRole,
    expiresIn: number,
    impersonation?: AuthenticatedImpersonation,
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
        ...(impersonation
          ? {
              impersonating: true,
              actorId: impersonation.adminId,
              actorEmail: impersonation.adminEmail,
              actorFirstName: impersonation.adminFirstName,
              impersonationSessionId: impersonation.sessionId,
              impersonationExpiresAt: impersonation.expiresAt,
            }
          : {}),
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn,
        algorithm: 'HS256',
      },
    );
  }

  private getImpersonationTtlSeconds() {
    const configuredMinutes = Number(
      this.configService.get<string>('ADMIN_IMPERSONATION_TTL_MINUTES') ??
        DEFAULT_IMPERSONATION_TTL_MINUTES,
    );
    const safeMinutes = Number.isFinite(configuredMinutes)
      ? Math.min(
          MAX_IMPERSONATION_TTL_MINUTES,
          Math.max(MIN_IMPERSONATION_TTL_MINUTES, configuredMinutes),
        )
      : DEFAULT_IMPERSONATION_TTL_MINUTES;

    return Math.round(safeMinutes * 60);
  }

  private getAccessTokenTtlSeconds() {
    const configuredTtl = Number(
      this.configService.get<string>('JWT_ACCESS_TOKEN_TTL_SECONDS') ??
        DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    );

    return Number.isFinite(configuredTtl) && configuredTtl > 0
      ? Math.round(configuredTtl)
      : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  }
}
