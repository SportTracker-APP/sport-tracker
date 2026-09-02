import {
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

import { AuthService } from './auth.service';

type UserMock = {
  id: string;
  email: string;
  firstName: string;
  password: string;
  googleSubject: string | null;
  role: 'USER' | 'ADMIN';
  isBlocked: boolean;
  emailVerifiedAt: Date | null;
};

type PasswordResetTokenMock = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: Pick<UserMock, 'id' | 'email' | 'firstName'>;
};

type EmailVerificationTokenMock = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: Pick<
    UserMock,
    'id' | 'email' | 'firstName' | 'role' | 'emailVerifiedAt'
  >;
};

type PrismaMock = {
  user: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  emailVerificationToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  passwordResetToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

type MailMock = {
  sendEmailVerification: jest.Mock;
  sendWelcomeEmail: jest.Mock;
  sendPasswordResetEmail: jest.Mock;
  sendPasswordChangedEmail: jest.Mock;
};

type JwtMock = {
  signAsync: jest.Mock;
  verifyAsync: jest.Mock;
};

const genericForgotPasswordMessage =
  'Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.';
const registerMessage =
  'Compte créé. Vérifiez votre boîte mail pour activer votre compte.';

const user: UserMock = {
  id: 'user-1',
  email: 'camille@example.test',
  firstName: 'Camille',
  password: 'old-hash',
  googleSubject: null,
  role: 'USER',
  isBlocked: false,
  emailVerifiedAt: new Date('2026-06-24T12:00:00.000Z'),
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function makePrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    user: {
      create: jest.fn().mockResolvedValue(user),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn().mockResolvedValue({ id: 'verify-token-1' }),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn().mockResolvedValue({ id: 'reset-token-1' }),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    (callback: (tx: PrismaMock) => Promise<unknown>) => callback(prisma),
  );

  return prisma;
}

function makeMailMock(): MailMock {
  return {
    sendEmailVerification: jest.fn().mockResolvedValue({
      skipped: false,
      resendId: 'email-0',
    }),
    sendWelcomeEmail: jest.fn().mockResolvedValue({
      skipped: false,
      resendId: 'email-welcome',
    }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({
      skipped: false,
      resendId: 'email-1',
    }),
    sendPasswordChangedEmail: jest.fn().mockResolvedValue({
      skipped: false,
      resendId: 'email-2',
    }),
  };
}

function makeJwtMock(): JwtMock {
  return {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: user.id }),
  };
}

function makeService(
  prisma = makePrismaMock(),
  mail = makeMailMock(),
  jwt = makeJwtMock(),
) {
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        APP_BASE_URL: 'http://localhost:3000',
        EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: '1440',
        EMAIL_VERIFICATION_URL: 'http://localhost:3000/verify-email',
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_ACCESS_TOKEN_TTL_SECONDS: '900',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_TOKEN_TTL_SECONDS: '86400',
        PASSWORD_RESET_TOKEN_TTL_MINUTES: '30',
      };

      return values[key];
    }),
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      const value = values[key];

      if (!value) {
        throw new Error(`${key} missing`);
      }

      return value;
    }),
  };

  return {
    prisma,
    mail,
    jwt,
    service: new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      configService as unknown as ConfigService,
      mail as unknown as MailService,
    ),
  };
}

function makeResetToken(
  overrides: Partial<PasswordResetTokenMock> = {},
): PasswordResetTokenMock {
  return {
    id: 'reset-token-1',
    userId: user.id,
    tokenHash: hashToken('valid-token'),
    expiresAt: new Date(Date.now() + 30 * 60_000),
    usedAt: null,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    },
    ...overrides,
  };
}

function makeEmailVerificationToken(
  overrides: Partial<EmailVerificationTokenMock> = {},
): EmailVerificationTokenMock {
  return {
    id: 'verify-token-1',
    userId: user.id,
    tokenHash: hashToken('valid-verification-token'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
    usedAt: null,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      emailVerifiedAt: null,
    },
    ...overrides,
  };
}

describe('AuthService password reset', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a generic response for an unknown email', async () => {
    const { service, prisma, mail } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'unknown@example.test' }),
    ).resolves.toEqual({
      message: genericForgotPasswordMessage,
    });
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('creates an email verification token and sends the verification email on register', async () => {
    const { service, prisma, mail } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      ...user,
      emailVerifiedAt: null,
    });

    await expect(
      service.register({
        firstName: user.firstName,
        email: user.email,
        password: 'Password1',
      }),
    ).resolves.toEqual({
      message: registerMessage,
    });

    expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          tokenHash: expect.not.stringContaining('verify-email'),
        }),
        select: {
          id: true,
        },
      }),
    );
    expect(mail.sendEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        userName: user.firstName,
        verifyUrl: expect.stringMatching(
          /^http:\/\/localhost:3000\/verify-email\?token=/,
        ),
        expirationMinutes: 1440,
        businessId: 'verify-token-1',
      }),
    );
  });

  it('normalizes email before registering a user', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);

    await service.register({
      firstName: user.firstName,
      email: '  CAMILLE@EXAMPLE.TEST ',
      password: 'Password1',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: user.email,
      },
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: user.email,
        }),
      }),
    );
  });

  it('does not fail registration when the verification email fails', async () => {
    const { service, prisma, mail } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      ...user,
      emailVerifiedAt: null,
    });
    mail.sendEmailVerification.mockRejectedValue(new Error('Resend failed'));

    await expect(
      service.register({
        firstName: user.firstName,
        email: user.email,
        password: 'Password1',
      }),
    ).resolves.toEqual({
      message: registerMessage,
    });
  });

  it('marks the email as verified, returns a session, and sends the welcome email with a valid token', async () => {
    const { service, prisma, mail } = makeService();
    prisma.emailVerificationToken.findUnique.mockResolvedValue(
      makeEmailVerificationToken(),
    );

    await expect(
      service.verifyEmail({ token: 'valid-verification-token' }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
      data: {
        emailVerifiedAt: expect.objectContaining({}),
      },
    });
    expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: expect.objectContaining({}),
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: expect.stringMatching(/^\$2[ab]\$/),
        lastLoginAt: expect.any(Date),
      },
    });
    expect(mail.sendWelcomeEmail).toHaveBeenCalledWith({
      to: user.email,
      userName: user.firstName,
      businessId: user.id,
    });
  });

  it('rejects login before email verification', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      emailVerifiedAt: null,
    });

    await expect(service.login(user.email, 'Password1')).rejects.toThrow(
      'Veuillez vérifier votre adresse email',
    );
  });

  it('links Google to an existing account with the same verified email', async () => {
    const { service, prisma } = makeService();
    const linkedUser = {
      ...user,
      googleSubject: 'google-subject-1',
    };
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(user);
    prisma.user.update
      .mockResolvedValueOnce(linkedUser)
      .mockResolvedValueOnce(linkedUser);

    await expect(
      service.loginWithGoogle({
        subject: 'google-subject-1',
        email: '  CAMILLE@EXAMPLE.TEST ',
        firstName: 'Camille',
        lastName: 'Martin',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
      where: {
        id: user.id,
      },
      data: {
        googleSubject: 'google-subject-1',
        emailVerifiedAt: user.emailVerifiedAt,
      },
    });
  });

  it('creates one verified HOVREN account for a new Google identity', async () => {
    const { service, prisma, mail } = makeService();
    const googleUser = {
      ...user,
      googleSubject: 'google-subject-2',
    };
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(googleUser);

    await expect(
      service.loginWithGoogle({
        subject: 'google-subject-2',
        email: user.email,
        firstName: user.firstName,
        lastName: 'Martin',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: user.id,
        email: user.email,
      },
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: user.email,
        emailVerifiedAt: expect.any(Date),
        firstName: user.firstName,
        lastName: 'Martin',
        googleSubject: 'google-subject-2',
        password: expect.stringMatching(/^\$2[ab]\$/),
        goals: {
          create: expect.any(Array),
        },
      }),
    });
    expect(mail.sendWelcomeEmail).toHaveBeenCalledWith({
      to: user.email,
      userName: user.firstName,
      businessId: user.id,
    });
  });

  it('refuses Google authentication for a blocked linked account', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      googleSubject: 'google-subject-blocked',
      isBlocked: true,
    });

    await expect(
      service.loginWithGoogle({
        subject: 'google-subject-blocked',
        email: user.email,
        firstName: user.firstName,
        lastName: null,
      }),
    ).rejects.toThrow('Compte bloqué');
  });

  it('rotates a valid refresh token and returns a fresh session', async () => {
    const { service, prisma, jwt } = makeService();
    const rawRefreshToken = 'valid-session-token';
    const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 4);
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      refreshToken: hashedRefreshToken,
    });

    await expect(service.refreshSession(rawRefreshToken)).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });

    expect(jwt.verifyAsync).toHaveBeenCalledWith(rawRefreshToken, {
      secret: 'test-refresh-secret',
      algorithms: ['HS256'],
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: expect.stringMatching(/^\$2[ab]\$/),
      },
    });
  });

  it('rejects an expired or invalid refresh token', async () => {
    const jwt = makeJwtMock();
    jwt.verifyAsync.mockRejectedValue(new Error('expired'));
    const { service } = makeService(makePrismaMock(), makeMailMock(), jwt);

    await expect(
      service.refreshSession('expired-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a refresh token that no longer matches the stored session', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      refreshToken: await bcrypt.hash('another-session-token', 4),
    });

    await expect(service.refreshSession('stale-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rate limits repeated login attempts for the same email', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(service.login(user.email, 'bad-password')).rejects.toThrow(
        'Email ou mot de passe incorrect',
      );
    }

    await expect(service.login(user.email, 'bad-password')).rejects.toThrow(
      'Trop de tentatives. Réessayez plus tard.',
    );
  });

  it('rejects an expired email verification token', async () => {
    const { service, prisma } = makeService();
    prisma.emailVerificationToken.findUnique.mockResolvedValue(
      makeEmailVerificationToken({
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );

    await expect(
      service.verifyEmail({ token: 'valid-verification-token' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an already used email verification token', async () => {
    const { service, prisma } = makeService();
    prisma.emailVerificationToken.findUnique.mockResolvedValue(
      makeEmailVerificationToken({
        usedAt: new Date(),
      }),
    );

    await expect(
      service.verifyEmail({ token: 'valid-verification-token' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a reset token and sends the reset email for an existing account', async () => {
    const { service, prisma, mail } = makeService();
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      service.forgotPassword({ email: 'Camille@Example.test' }),
    ).resolves.toEqual({
      message: genericForgotPasswordMessage,
    });

    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          tokenHash: expect.not.stringContaining('reset-password'),
        }),
        select: {
          id: true,
        },
      }),
    );
    const createPayload = prisma.passwordResetToken.create.mock
      .calls[0]?.[0] as
      | {
          data?: {
            expiresAt?: unknown;
          };
        }
      | undefined;
    expect(createPayload?.data?.expiresAt).toBeInstanceOf(Date);
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        userName: user.firstName,
        resetPasswordUrl: expect.stringMatching(
          /^http:\/\/localhost:3000\/reset-password\?token=/,
        ),
        expirationMinutes: 30,
        businessId: 'reset-token-1',
      }),
    );
  });

  it('invalidates previous active tokens before creating a new one', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(user);

    await service.forgotPassword({ email: user.email });

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: expect.objectContaining({
          gt: expect.objectContaining({}),
        }),
      },
      data: {
        usedAt: expect.objectContaining({}),
      },
    });
    const updatePayload = prisma.passwordResetToken.updateMany.mock
      .calls[0]?.[0] as
      | {
          where?: {
            expiresAt?: {
              gt?: unknown;
            };
          };
          data?: {
            usedAt?: unknown;
          };
        }
      | undefined;
    expect(updatePayload?.where?.expiresAt?.gt).toBeInstanceOf(Date);
    expect(updatePayload?.data?.usedAt).toBeInstanceOf(Date);
  });

  it('resets the password with a valid token', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(makeResetToken());

    await expect(
      service.resetPassword({
        token: 'valid-token',
        password: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      }),
    ).resolves.toEqual({
      message: 'Mot de passe réinitialisé',
    });

    const updatePayload = prisma.user.update.mock.calls[0]?.[0] as
      | {
          data?: {
            password?: string;
          };
        }
      | undefined;
    expect(updatePayload?.data?.password).toMatch(/^\$2[ab]\$/);
    expect(updatePayload?.data?.password).not.toBe('NewPassword1');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
      data: {
        password: updatePayload?.data?.password,
        refreshToken: null,
      },
    });
  });

  it('rejects an unknown token', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'unknown-token',
        password: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired token', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(
      makeResetToken({
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );

    await expect(
      service.resetPassword({
        token: 'valid-token',
        password: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an already used token', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(
      makeResetToken({
        usedAt: new Date(),
      }),
    );

    await expect(
      service.resetPassword({
        token: 'valid-token',
        password: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a password confirmation mismatch', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.resetPassword({
        token: 'valid-token',
        password: 'NewPassword1',
        confirmPassword: 'OtherPassword1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a weak password', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.resetPassword({
        token: 'valid-token',
        password: 'weakpass',
        confirmPassword: 'weakpass',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it('marks every active reset token as used after password update', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(makeResetToken());

    await service.resetPassword({
      token: 'valid-token',
      password: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    });

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: expect.objectContaining({}),
      },
    });
    const updatePayload = prisma.passwordResetToken.updateMany.mock
      .calls[0]?.[0] as
      | {
          data?: {
            usedAt?: unknown;
          };
        }
      | undefined;
    expect(updatePayload?.data?.usedAt).toBeInstanceOf(Date);
  });

  it('prevents token reuse once marked as used', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(
      makeResetToken({
        usedAt: new Date(),
      }),
    );

    await expect(
      service.resetPassword({
        token: 'valid-token',
        password: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('sends the password changed email after a successful reset', async () => {
    const { service, prisma, mail } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(makeResetToken());

    await service.resetPassword({
      token: 'valid-token',
      password: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    });

    expect(mail.sendPasswordChangedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        userName: user.firstName,
        deviceName: 'Appareil non identifié',
        location: 'Localisation non disponible',
        businessId: 'reset-token-1',
      }),
    );
  });

  it('rejects the old password after reset', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(makeResetToken());

    await service.resetPassword({
      token: 'valid-token',
      password: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    });

    const updatePayload = prisma.user.update.mock.calls[0]?.[0] as
      | {
          data?: {
            password?: string;
          };
        }
      | undefined;

    prisma.user.findUnique.mockResolvedValue({
      ...user,
      password: updatePayload?.data?.password,
    });

    await expect(service.login(user.email, 'OldPassword1')).rejects.toThrow(
      'Email ou mot de passe incorrect',
    );
  });

  it('accepts the new password after reset', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(makeResetToken());

    await service.resetPassword({
      token: 'valid-token',
      password: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    });

    const updatePayload = prisma.user.update.mock.calls[0]?.[0] as
      | {
          data?: {
            password?: string;
          };
        }
      | undefined;

    prisma.user.findUnique.mockResolvedValue({
      ...user,
      password: updatePayload?.data?.password,
    });

    await expect(service.login(user.email, 'NewPassword1')).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
    expect(prisma.user.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: user.id,
        },
        data: expect.objectContaining({
          refreshToken: expect.stringMatching(/^\$2[ab]\$/),
          lastLoginAt: expect.any(Date),
        }),
      }),
    );
  });

  it('does not include the raw token in sanitized logs when email sending fails', async () => {
    const { service, prisma, mail } = makeService();
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    prisma.user.findUnique.mockResolvedValue(user);
    mail.sendPasswordResetEmail.mockRejectedValue(new Error('Resend failed'));

    await service.forgotPassword({ email: user.email });

    const loggedPayload = JSON.stringify(warnSpy.mock.calls);

    expect(loggedPayload).not.toContain('reset-password?token=');
    expect(loggedPayload).not.toContain(user.email);
  });
});
