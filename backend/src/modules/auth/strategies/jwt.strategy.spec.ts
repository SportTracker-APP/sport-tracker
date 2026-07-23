import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

import { JwtStrategy } from './jwt.strategy';

type PrismaMock = {
  adminImpersonationSession: {
    findUnique: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
};

function createStrategy(prisma: PrismaMock) {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-access-secret'),
  };

  return new JwtStrategy(
    configService as unknown as ConfigService,
    prisma as unknown as PrismaService,
  );
}

describe('JwtStrategy impersonation validation', () => {
  it('accepts an active session backed by an active administrator', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1_000);
    const prisma: PrismaMock = {
      adminImpersonationSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-1',
          adminUserId: 'admin-1',
          targetUserId: 'user-1',
          endedAt: null,
          expiresAt,
        }),
      },
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            role: UserRole.ADMIN,
            isBlocked: false,
          })
          .mockResolvedValueOnce({
            email: 'user@example.test',
            role: UserRole.USER,
            isBlocked: false,
          }),
      },
    };

    await expect(
      createStrategy(prisma).validate({
        sub: 'user-1',
        email: 'user@example.test',
        role: UserRole.USER,
        impersonating: true,
        actorId: 'admin-1',
        actorEmail: 'admin@example.test',
        actorFirstName: 'Thibaut',
        impersonationSessionId: 'session-1',
        impersonationExpiresAt: expiresAt.toISOString(),
      }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.test',
      role: UserRole.USER,
      impersonation: {
        sessionId: 'session-1',
        adminId: 'admin-1',
        adminEmail: 'admin@example.test',
        adminFirstName: 'Thibaut',
        expiresAt: expiresAt.toISOString(),
      },
    });
  });

  it('rejects an ended session', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1_000);
    const prisma: PrismaMock = {
      adminImpersonationSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-1',
          adminUserId: 'admin-1',
          targetUserId: 'user-1',
          endedAt: new Date(),
          expiresAt,
        }),
      },
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            role: UserRole.ADMIN,
            isBlocked: false,
          })
          .mockResolvedValueOnce({
            email: 'user@example.test',
            role: UserRole.USER,
            isBlocked: false,
          }),
      },
    };

    await expect(
      createStrategy(prisma).validate({
        sub: 'user-1',
        email: 'user@example.test',
        impersonating: true,
        actorId: 'admin-1',
        actorEmail: 'admin@example.test',
        actorFirstName: 'Thibaut',
        impersonationSessionId: 'session-1',
        impersonationExpiresAt: expiresAt.toISOString(),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
