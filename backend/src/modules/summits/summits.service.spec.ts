import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SummitDiscoveryStatus } from '@prisma/client';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SummitsService } from './summits.service';

type PrismaMock = {
  activity: { findFirst: jest.Mock; findMany: jest.Mock };
  summit: { findMany: jest.Mock };
  summitDiscovery: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  userBadge: {
    createMany: jest.Mock;
    deleteMany: jest.Mock;
    updateMany: jest.Mock;
  };
};

function makePrisma(): PrismaMock {
  return {
    activity: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    summit: { findMany: jest.fn().mockResolvedValue([]) },
    summitDiscovery: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userBadge: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

function makeService(prisma: PrismaMock) {
  return new SummitsService(
    prisma as unknown as PrismaService,
    {} as MailService,
    {} as ConfigService,
  );
}

describe('SummitsService', () => {
  it('processes a repeated activity identifier only once', async () => {
    const prisma = makePrisma();

    await expect(
      makeService(prisma).processActivities('user-1', [
        'activity-1',
        'activity-1',
      ]),
    ).resolves.toMatchObject({ processed: 1 });

    expect(prisma.activity.findFirst).toHaveBeenCalledTimes(1);
  });

  it('persists a manual dismissal for a discovery owned by the user', async () => {
    const prisma = makePrisma();
    const discovery = {
      id: 'discovery-1',
      userId: 'user-1',
      confirmedAt: new Date(),
    };
    prisma.summitDiscovery.findFirst.mockResolvedValue(discovery);
    prisma.summitDiscovery.update.mockResolvedValue({
      ...discovery,
      status: SummitDiscoveryStatus.DISMISSED,
    });

    await makeService(prisma).updateDiscovery('user-1', 'discovery-1', {
      status: SummitDiscoveryStatus.DISMISSED,
    });

    expect(prisma.summitDiscovery.findFirst).toHaveBeenCalledWith({
      where: { id: 'discovery-1', userId: 'user-1' },
    });
    expect(prisma.summitDiscovery.update).toHaveBeenCalledWith({
      where: { id: 'discovery-1' },
      data: expect.objectContaining({
        status: SummitDiscoveryStatus.DISMISSED,
        confirmedAt: null,
        dismissedAt: expect.any(Date),
      }),
    });
  });

  it('does not allow a user to update another user discovery', async () => {
    const prisma = makePrisma();
    prisma.summitDiscovery.findFirst.mockResolvedValue(null);

    await expect(
      makeService(prisma).updateDiscovery('user-1', 'discovery-2', {
        status: SummitDiscoveryStatus.CONFIRMED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.summitDiscovery.update).not.toHaveBeenCalled();
  });

  it('dismisses current discoveries without blocking a future activity', async () => {
    const prisma = makePrisma();
    prisma.summitDiscovery.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      makeService(prisma).dismissSummit('user-1', 'summit-1'),
    ).resolves.toEqual({ dismissedDiscoveries: 2 });

    expect(prisma.summitDiscovery.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        summitId: 'summit-1',
        status: { not: SummitDiscoveryStatus.DISMISSED },
      },
      data: {
        status: SummitDiscoveryStatus.DISMISSED,
        confirmedAt: null,
        dismissedAt: expect.any(Date),
      },
    });
  });

  it('rejects removal when the summit is not in the user discoveries', async () => {
    const prisma = makePrisma();
    prisma.summitDiscovery.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      makeService(prisma).dismissSummit('user-1', 'summit-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
