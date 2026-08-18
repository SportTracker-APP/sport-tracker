/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- Jest mock and asymmetric matcher typings expose `any`. */
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitDiscoveryStatus,
} from '@prisma/client';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from '../geography/geo-areas.service';
import { SummitsService } from './summits.service';

type PrismaMock = {
  activity: { findFirst: jest.Mock; findMany: jest.Mock };
  summit: { findMany: jest.Mock };
  summitDiscovery: {
    count: jest.Mock;
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
      count: jest.fn().mockResolvedValue(1),
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

function makeService(
  prisma: PrismaMock,
  geoAreasService: Pick<GeoAreasService, 'getPublishedAreaIdsForMany'> = {
    getPublishedAreaIdsForMany: jest.fn(),
  },
) {
  return new SummitsService(
    prisma as unknown as PrismaService,
    {} as MailService,
    {} as ConfigService,
    geoAreasService as GeoAreasService,
  );
}

describe('SummitsService', () => {
  it('does not overwrite admin-managed summit identity during bootstrap sync', async () => {
    const transactionMock = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('stop before geographic seed'));
    const prisma = {
      $transaction: transactionMock,
      badge: { updateMany: jest.fn(), upsert: jest.fn() },
      summit: { updateMany: jest.fn(), upsert: jest.fn() },
    };
    const service = makeService(prisma as unknown as PrismaMock);

    await expect(service.synchronizeCatalogs()).rejects.toThrow(
      'stop before geographic seed',
    );

    const summitUpsert = prisma.summit.upsert.mock.calls[0]?.[0] as
      | {
          create?: Record<string, unknown>;
          update?: Record<string, unknown>;
        }
      | undefined;
    expect(summitUpsert?.create).toMatchObject({
      catalogStatus: SummitCatalogStatus.READY,
      catalogTier: SummitCatalogTier.CORE,
      isActive: true,
    });
    expect(summitUpsert?.update).not.toHaveProperty('name');
    expect(summitUpsert?.update).not.toHaveProperty('altitude');
    expect(summitUpsert?.update).not.toHaveProperty('latitude');
    expect(summitUpsert?.update).not.toHaveProperty('primaryMassifId');
  });

  it('filters published summits through a parent territory without N+1', async () => {
    const prisma = makePrisma();
    const getPublishedAreaIdsForMany = jest
      .fn()
      .mockResolvedValue(['geo-alpes', 'geo-aravis']);

    await makeService(prisma, { getPublishedAreaIdsForMany }).findAll(
      'user-1',
      {
        geoAreaId: 'geo-alpes',
        includeDescendants: true,
      },
    );

    expect(getPublishedAreaIdsForMany).toHaveBeenCalledWith(
      ['geo-alpes'],
      true,
    );
    expect(prisma.summit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          catalogStatus: SummitCatalogStatus.READY,
          catalogTier: SummitCatalogTier.CORE,
          geoAreas: {
            some: {
              geoAreaId: { in: ['geo-alpes', 'geo-aravis'] },
            },
          },
        },
      }),
    );
  });

  it('excludes masked summits from the public main catalogue', async () => {
    const prisma = makePrisma();

    await expect(makeService(prisma).findAll('user-1')).resolves.toEqual([]);

    expect(prisma.summit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          catalogStatus: SummitCatalogStatus.READY,
          catalogTier: SummitCatalogTier.CORE,
        },
      }),
    );
  });

  it('exposes secondary summits only when catalogue search opts in', async () => {
    const prisma = makePrisma();

    await expect(
      makeService(prisma).findAll('user-1', { includeSecondary: true }),
    ).resolves.toEqual([]);

    expect(prisma.summit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          catalogStatus: SummitCatalogStatus.READY,
          catalogTier: {
            in: [SummitCatalogTier.CORE, SummitCatalogTier.SECONDARY],
          },
        },
      }),
    );
  });

  it('returns a lean published summit payload for the Exploration map', async () => {
    const prisma = makePrisma();
    prisma.summit.findMany.mockResolvedValue([
      {
        id: 'la-tournette',
        name: 'La Tournette',
        altitude: 2351,
        longitude: 6.287,
        latitude: 45.827,
        catalogTier: SummitCatalogTier.CORE,
        discoveries: [{ confirmedAt: new Date('2026-08-01T08:00:00Z') }],
      },
    ]);

    await expect(makeService(prisma).findMapSummits('user-1')).resolves.toEqual(
      [
        {
          id: 'la-tournette',
          name: 'La Tournette',
          altitude: 2351,
          catalogTier: SummitCatalogTier.CORE,
          coordinates: [6.287, 45.827],
          discovered: true,
          firstDiscoveredAt: new Date('2026-08-01T08:00:00Z'),
          latestDiscoveredAt: new Date('2026-08-01T08:00:00Z'),
        },
      ],
    );

    expect(prisma.summit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          catalogStatus: SummitCatalogStatus.READY,
          catalogTier: {
            in: [SummitCatalogTier.CORE, SummitCatalogTier.SECONDARY],
          },
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          altitude: true,
          longitude: true,
          latitude: true,
        }),
      }),
    );
  });

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
      where: {
        id: 'discovery-1',
        userId: 'user-1',
        summit: { catalogTier: SummitCatalogTier.CORE },
      },
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
