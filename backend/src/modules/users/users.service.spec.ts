/* eslint-disable @typescript-eslint/no-unsafe-member-access -- Jest mock call arguments are exposed as `any`. */
import * as bcrypt from 'bcrypt';

import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { UsersService } from './users.service';

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  geoArea: { findMany: jest.Mock };
  userGeoAreaPreference: { findMany: jest.Mock };
  userOnboardingState: { findUnique: jest.Mock };
  $transaction: jest.Mock;
};

function makePrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    geoArea: { findMany: jest.fn() },
    userGeoAreaPreference: { findMany: jest.fn().mockResolvedValue([]) },
    userOnboardingState: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(),
  };
}

describe('UsersService security', () => {
  it('revokes refresh sessions and stores a bcrypt hash when password changes', async () => {
    const prisma = makePrismaMock();
    const currentPasswordHash = await bcrypt.hash('OldPassword1', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      password: currentPasswordHash,
    });

    await new UsersService(prisma as unknown as PrismaService).updatePassword(
      'user-1',
      {
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword1',
      },
    );

    const updatePayload = prisma.user.update.mock.calls[0]?.[0] as {
      data: {
        password: string;
        refreshToken: null;
      };
    };

    expect(updatePayload.data.password).not.toBe('NewPassword1');
    expect(updatePayload.data.password).toMatch(/^\$2[ab]\$/);
    expect(updatePayload.data.refreshToken).toBeNull();
  });
});

describe('UsersService discovery territories', () => {
  it('requires onboarding only when neither a choice nor completion exists', async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        firstName: 'Lou',
        email: 'lou@example.com',
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date(),
        geoAreaPreferences: [],
        onboardingStates: [],
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        firstName: 'Lou',
        email: 'lou@example.com',
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date(),
        geoAreaPreferences: [{ id: 'preference-1' }],
        onboardingStates: [],
      });
    const service = new UsersService(prisma as unknown as PrismaService);

    await expect(service.getProfile('user-1')).resolves.toMatchObject({
      needsDiscoveryOnboarding: true,
    });
    await expect(service.getProfile('user-1')).resolves.toMatchObject({
      needsDiscoveryOnboarding: false,
    });
  });

  it('stores a deduplicated multi-territory selection in one transaction', async () => {
    const prisma = makePrismaMock();
    prisma.geoArea.findMany.mockResolvedValue([
      { id: 'aravis' },
      { id: 'mont-blanc' },
    ]);
    const transaction = {
      userGeoAreaPreference: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      userOnboardingState: { upsert: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    const service = new UsersService(prisma as unknown as PrismaService);

    await service.updateDiscoveryGeoPreferences('user-1', {
      geoAreaIds: ['aravis', 'mont-blanc', 'aravis'],
    });

    expect(transaction.userGeoAreaPreference.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', geoAreaId: 'aravis', type: 'DISCOVERY' },
        { userId: 'user-1', geoAreaId: 'mont-blanc', type: 'DISCOVERY' },
      ],
      skipDuplicates: true,
    });
    expect(transaction.userOnboardingState.upsert).toHaveBeenCalledTimes(1);
  });

  it('allows an explicit empty choice to mean the whole HOVREN catalogue', async () => {
    const prisma = makePrismaMock();
    prisma.geoArea.findMany.mockResolvedValue([]);
    const transaction = {
      userGeoAreaPreference: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      userOnboardingState: { upsert: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await new UsersService(
      prisma as unknown as PrismaService,
    ).updateDiscoveryGeoPreferences('user-1', { geoAreaIds: [] });

    expect(transaction.userGeoAreaPreference.createMany).not.toHaveBeenCalled();
    expect(transaction.userOnboardingState.upsert).toHaveBeenCalledTimes(1);
  });

  it('rejects unpublished or ineligible territories before changing choices', async () => {
    const prisma = makePrismaMock();
    prisma.geoArea.findMany.mockResolvedValue([]);

    await expect(
      new UsersService(
        prisma as unknown as PrismaService,
      ).updateDiscoveryGeoPreferences('user-1', {
        geoAreaIds: ['unknown-area'],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
