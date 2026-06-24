import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

import { AuthService } from './auth.service';

type UserMock = {
  id: string;
  email: string;
  firstName: string;
  password: string;
};

type PasswordResetTokenMock = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: Pick<UserMock, 'id' | 'email' | 'firstName'>;
};

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  passwordResetToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

type MailMock = {
  sendPasswordResetEmail: jest.Mock;
  sendPasswordChangedEmail: jest.Mock;
};

const genericForgotPasswordMessage =
  'Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.';

const user: UserMock = {
  id: 'user-1',
  email: 'camille@example.test',
  firstName: 'Camille',
  password: 'old-hash',
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function makePrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

function makeService(prisma = makePrismaMock(), mail = makeMailMock()) {
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        APP_BASE_URL: 'http://localhost:3000',
        PASSWORD_RESET_TOKEN_TTL_MINUTES: '30',
      };

      return values[key];
    }),
  };

  return {
    prisma,
    mail,
    service: new AuthService(
      prisma as unknown as PrismaService,
      {} as unknown as JwtService,
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
