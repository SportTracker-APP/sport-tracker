import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { AdminImpersonationService } from './admin-impersonation.service';

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
  };
  adminImpersonationSession: {
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

function createFixture() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    adminImpersonationSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-access-token'),
  };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'ADMIN_IMPERSONATION_TTL_MINUTES' ? '30' : '900',
    ),
    getOrThrow: jest.fn().mockReturnValue('test-access-secret'),
  };

  prisma.$transaction.mockImplementation(
    async (callback: (transaction: PrismaMock) => Promise<unknown>) =>
      callback(prisma),
  );

  return {
    prisma,
    jwtService,
    service: new AdminImpersonationService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    ),
  };
}

describe('AdminImpersonationService', () => {
  it('creates an auditable short-lived access session for a user', async () => {
    const { prisma, jwtService, service } = createFixture();
    const admin = {
      id: 'admin-1',
      firstName: 'Thibaut',
      email: 'admin@example.test',
      role: UserRole.ADMIN,
      isBlocked: false,
    };
    const target = {
      id: 'user-1',
      firstName: 'Camille',
      email: 'camille@example.test',
      avatarUrl: null,
      role: UserRole.USER,
      isBlocked: false,
    };

    prisma.user.findUnique
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce(target);
    prisma.adminImpersonationSession.updateMany.mockResolvedValue({ count: 0 });
    prisma.adminImpersonationSession.create.mockResolvedValue({
      id: 'session-1',
    });

    const result = await service.start(admin.id, target.id, {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(prisma.adminImpersonationSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: admin.id,
        targetUserId: target.id,
        adminEmail: admin.email,
        targetEmail: target.email,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: target.id,
        impersonating: true,
        actorId: admin.id,
        impersonationSessionId: 'session-1',
      }),
      expect.objectContaining({
        expiresIn: 1800,
      }),
    );
    expect(result.user.impersonation.adminId).toBe(admin.id);
    expect(result.user.id).toBe(target.id);
  });

  it('refuses access to another administrator', async () => {
    const { prisma, service } = createFixture();

    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: 'admin-1',
        firstName: 'Thibaut',
        email: 'admin@example.test',
        role: UserRole.ADMIN,
        isBlocked: false,
      })
      .mockResolvedValueOnce({
        id: 'admin-2',
        firstName: 'Alex',
        email: 'alex@example.test',
        avatarUrl: null,
        role: UserRole.ADMIN,
        isBlocked: false,
      });

    await expect(
      service.start('admin-1', 'admin-2', {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ends the audit session and restores the administrator identity', async () => {
    const { prisma, jwtService, service } = createFixture();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1_000);

    prisma.adminImpersonationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      adminUserId: 'admin-1',
      targetUserId: 'user-1',
      endedAt: null,
      expiresAt,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      firstName: 'Thibaut',
      email: 'admin@example.test',
      avatarUrl: null,
      role: UserRole.ADMIN,
      isBlocked: false,
    });
    prisma.adminImpersonationSession.update.mockResolvedValue({
      id: 'session-1',
    });

    const result = await service.stop('user-1', {
      sessionId: 'session-1',
      adminId: 'admin-1',
      adminEmail: 'admin@example.test',
      adminFirstName: 'Thibaut',
      expiresAt: expiresAt.toISOString(),
    });

    expect(prisma.adminImpersonationSession.update).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
      },
      data: {
        endedAt: expect.any(Date),
      },
    });
    expect(jwtService.signAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sub: 'admin-1',
        role: UserRole.ADMIN,
      }),
      expect.objectContaining({
        expiresIn: 900,
      }),
    );
    expect(result.user.id).toBe('admin-1');
  });
});
