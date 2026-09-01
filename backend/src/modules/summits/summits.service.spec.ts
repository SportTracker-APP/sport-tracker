import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeoAreaType,
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitDiscoveryConfirmationSource,
  SummitDiscoveryStatus,
} from '@prisma/client';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from '../geography/geo-areas.service';
import type { SummitDetectionCandidate } from './summit-detection';
import { SummitElevationService } from './summit-elevation.service';
import { SummitsService } from './summits.service';

type PrismaMock = {
  activity: {
    count: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  summit: { findMany: jest.Mock };
  summitDiscovery: {
    count: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    upsert: jest.Mock;
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
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    summit: { findMany: jest.fn().mockResolvedValue([]) },
    summitDiscovery: {
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
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
  summitElevationService: Pick<SummitElevationService, 'getLocalAltitudes'> = {
    getLocalAltitudes: jest
      .fn()
      .mockImplementation((candidates: SummitDetectionCandidate[]) =>
        Promise.resolve(
          new Map(
            candidates.map(({ summit }) => [
              summit.id,
              { altitude: summit.altitude, source: 'IGN_RGE_ALTI' as const },
            ]),
          ),
        ),
      ),
  },
) {
  return new SummitsService(
    prisma as unknown as PrismaService,
    {} as MailService,
    {} as ConfigService,
    geoAreasService as GeoAreasService,
    summitElevationService as SummitElevationService,
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

  it('does not reconcile unfinished detections inside the summit catalogue request', async () => {
    const prisma = makePrisma();

    await expect(makeService(prisma).findAll('user-1')).resolves.toEqual([]);

    expect(prisma.activity.findMany).not.toHaveBeenCalled();
    expect(prisma.activity.update).not.toHaveBeenCalled();
  });

  it('reconciles pending detections in bounded idempotent batches', async () => {
    const prisma = makePrisma();
    prisma.activity.findMany
      .mockResolvedValueOnce([
        { id: 'activity-1', userId: 'user-1' },
        { id: 'activity-2', userId: 'user-1' },
        { id: 'activity-3', userId: 'user-2' },
      ])
      .mockResolvedValueOnce([]);
    const service = makeService(prisma);
    const processActivities = jest
      .spyOn(service, 'processActivities')
      .mockResolvedValueOnce({ processed: 2, detected: 1, confirmed: 1 })
      .mockResolvedValueOnce({ processed: 1, detected: 2, confirmed: 0 });

    await expect(
      service.reconcilePendingActivityDetections({ batchSize: 3 }),
    ).resolves.toEqual({
      batches: 1,
      processed: 3,
      detected: 3,
      confirmed: 1,
      remaining: 0,
    });

    expect(prisma.activity.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        status: 'COMPLETED',
        routePolyline: { not: null },
        summitDetectionVersion: { lt: 4 },
      },
      select: { id: true, userId: true },
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
      take: 3,
    });
    expect(processActivities).toHaveBeenNthCalledWith(
      1,
      'user-1',
      ['activity-1', 'activity-2'],
      { sendNotifications: false },
    );
    expect(processActivities).toHaveBeenNthCalledWith(
      2,
      'user-2',
      ['activity-3'],
      { sendNotifications: false },
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

  it('counts repeated Vélan passages without duplicating the discovered summit', async () => {
    const prisma = makePrisma();
    const firstDate = new Date('2026-08-20T06:00:00.000Z');
    const latestDate = new Date('2026-08-28T06:15:00.000Z');
    prisma.summit.findMany.mockResolvedValue([
      {
        id: 'velan',
        name: 'Le Vélan',
        aliases: [],
        altitude: 1734,
        massif: 'Massif historique',
        difficulty: 'À définir',
        type: 'Sommet',
        longitude: 6.1,
        latitude: 45.9,
        imageUrl: null,
        imageCredit: null,
        sourceUrl: null,
        editorialImageUrl: null,
        editorialImageCredit: null,
        editorialSourceUrl: null,
        catalogTier: SummitCatalogTier.CORE,
        primaryMassif: { id: 'bornes', name: 'Bornes' },
        geoAreas: [
          {
            geoArea: {
              id: 'haute-savoie',
              name: 'Haute-Savoie',
              type: GeoAreaType.DEPARTMENT,
            },
          },
        ],
        discoveries: [
          {
            status: SummitDiscoveryStatus.CONFIRMED,
            closestDistance: 8,
            discoveredAt: firstDate,
            activity: { id: 'activity-1', startedAt: firstDate },
          },
          {
            status: SummitDiscoveryStatus.CONFIRMED,
            closestDistance: 5,
            discoveredAt: latestDate,
            activity: { id: 'activity-2', startedAt: latestDate },
          },
        ],
      },
    ]);

    const [summit] = await makeService(prisma).findAll('user-1');

    expect(summit).toMatchObject({
      id: 'velan',
      massif: 'Bornes',
      department: 'Haute-Savoie',
      discovered: true,
      activityCount: 2,
      closestDistance: 5,
      firstDiscoveredAt: firstDate,
      latestDiscoveredAt: latestDate,
    });
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
        discoveries: [{ discoveredAt: new Date('2026-08-01T08:00:00Z') }],
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
    expect(prisma.activity.findMany).not.toHaveBeenCalled();
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

  it('validates the Vélan field-test trace once and preserves its evidence', async () => {
    const prisma = makePrisma();
    const startedAt = new Date('2026-08-28T06:15:00.000Z');
    prisma.activity.findFirst.mockResolvedValue({
      id: 'activity-velan',
      title: 'Test terrain du Vélan',
      maxAltitude: 1020,
      routePolyline: '????????',
      startedAt,
    });
    prisma.summit.findMany.mockResolvedValue([
      {
        id: 'velan',
        name: 'Le Vélan',
        aliases: [],
        altitude: 1000,
        latitude: 0,
        longitude: 0,
      },
    ]);

    await expect(
      makeService(prisma).processActivities('user-1', ['activity-velan']),
    ).resolves.toEqual({ processed: 1, detected: 1, confirmed: 1 });

    expect(prisma.summitDiscovery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          summitId_activityId: {
            summitId: 'velan',
            activityId: 'activity-velan',
          },
        },
        create: expect.objectContaining({
          userId: 'user-1',
          status: SummitDiscoveryStatus.CONFIRMED,
          confirmationSource: SummitDiscoveryConfirmationSource.AUTO,
          discoveredAt: startedAt,
          routePointCount: 4,
          nearbyPointCount: 4,
          detectionVersion: 4,
          closestRouteAltitude: 1000,
          altitudeSource: 'IGN_RGE_ALTI',
        }),
      }),
    );
    expect(prisma.activity.update).toHaveBeenCalledWith({
      where: { id: 'activity-velan' },
      data: {
        summitDetectionProcessedAt: expect.any(Date),
        summitDetectionVersion: 4,
      },
    });
  });

  it('does not mark an activity as processed when summit detection fails', async () => {
    const prisma = makePrisma();
    prisma.activity.findFirst.mockResolvedValue({
      id: 'activity-1',
      title: 'Sortie à reprendre',
      maxAltitude: 1600,
      routePolyline: '??',
      startedAt: new Date('2026-08-28T06:15:00.000Z'),
    });
    prisma.summit.findMany.mockRejectedValue(new Error('database unavailable'));

    await expect(
      makeService(prisma).processActivities('user-1', ['activity-1']),
    ).rejects.toThrow('database unavailable');
    expect(prisma.activity.update).not.toHaveBeenCalled();
  });

  it('keeps detection retryable when local IGN altitude is unavailable', async () => {
    const prisma = makePrisma();
    prisma.activity.findFirst.mockResolvedValue({
      id: 'activity-1',
      title: 'Sortie proche du sommet',
      maxAltitude: 2_000,
      routePolyline: '??',
      startedAt: new Date('2026-08-28T06:15:00.000Z'),
    });
    prisma.summit.findMany.mockResolvedValue([
      {
        id: 'summit-1',
        name: 'Sommet test',
        aliases: [],
        altitude: 1_000,
        latitude: 0,
        longitude: 0,
      },
    ]);
    const getLocalAltitudes = jest
      .fn()
      .mockRejectedValue(new Error('IGN unavailable'));

    await expect(
      makeService(prisma, undefined, { getLocalAltitudes }).processActivities(
        'user-1',
        ['activity-1'],
      ),
    ).rejects.toThrow('IGN unavailable');

    expect(prisma.summitDiscovery.upsert).not.toHaveBeenCalled();
    expect(prisma.activity.update).not.toHaveBeenCalled();
  });

  it('marks an empty stored route as terminal without creating a discovery', async () => {
    const prisma = makePrisma();
    prisma.activity.findFirst.mockResolvedValue({
      id: 'activity-empty-route',
      routePolyline: '',
    });

    await expect(
      makeService(prisma).processActivities('user-1', ['activity-empty-route']),
    ).resolves.toEqual({ processed: 1, detected: 0, confirmed: 0 });

    expect(prisma.summit.findMany).not.toHaveBeenCalled();
    expect(prisma.summitDiscovery.upsert).not.toHaveBeenCalled();
    expect(prisma.activity.update).toHaveBeenCalledWith({
      where: { id: 'activity-empty-route' },
      data: {
        summitDetectionProcessedAt: expect.any(Date),
        summitDetectionVersion: 4,
      },
    });
  });

  it('dismisses an automatic discovery that no longer reaches the corrected summit', async () => {
    const prisma = makePrisma();
    prisma.activity.findFirst.mockResolvedValue({
      id: 'activity-1',
      title: 'Pieds du sommet',
      maxAltitude: 1600,
      routePolyline: '??',
      startedAt: new Date('2026-05-23T06:44:33Z'),
    });
    prisma.summitDiscovery.findMany
      .mockResolvedValueOnce([
        {
          summitId: 'corrected-summit',
          status: SummitDiscoveryStatus.CONFIRMED,
          confirmationSource: SummitDiscoveryConfirmationSource.AUTO,
          confirmedAt: new Date('2026-07-02T14:02:54Z'),
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.summitDiscovery.updateMany.mockResolvedValue({ count: 1 });

    await makeService(prisma).processActivities('user-1', ['activity-1']);

    expect(prisma.summitDiscovery.updateMany).toHaveBeenCalledWith({
      where: {
        activityId: 'activity-1',
        summitId: { in: ['corrected-summit'] },
      },
      data: {
        status: SummitDiscoveryStatus.DISMISSED,
        confirmationSource: null,
        confirmedAt: null,
        dismissedAt: expect.any(Date),
      },
    });
  });

  it('preserves a user-confirmed discovery during geographic recalculation', async () => {
    const prisma = makePrisma();
    prisma.activity.findFirst.mockResolvedValue({
      id: 'activity-1',
      title: 'Sortie historique',
      maxAltitude: 1600,
      routePolyline: '??',
      startedAt: new Date('2026-05-23T06:44:33Z'),
    });
    prisma.summitDiscovery.findMany
      .mockResolvedValueOnce([
        {
          summitId: 'user-confirmed-summit',
          status: SummitDiscoveryStatus.CONFIRMED,
          confirmationSource: SummitDiscoveryConfirmationSource.USER,
          confirmedAt: new Date('2026-07-06T12:51:34Z'),
        },
      ])
      .mockResolvedValueOnce([]);

    await makeService(prisma).processActivities('user-1', ['activity-1']);

    expect(prisma.summitDiscovery.updateMany).not.toHaveBeenCalled();
  });

  it('persists a manual dismissal for a discovery owned by the user', async () => {
    const prisma = makePrisma();
    const discovery = {
      id: 'discovery-1',
      userId: 'user-1',
      discoveredAt: new Date('2026-07-01T08:00:00Z'),
      confirmedAt: new Date(),
      activity: { startedAt: new Date('2026-07-01T08:00:00Z') },
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
      include: { activity: { select: { startedAt: true } } },
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

  it('uses the activity date when a late historical discovery is confirmed', async () => {
    const prisma = makePrisma();
    const activityStartedAt = new Date('2022-06-18T06:30:00Z');
    prisma.summitDiscovery.findFirst.mockResolvedValue({
      id: 'historical-discovery',
      discoveredAt: new Date('2026-08-24T08:00:00Z'),
      confirmedAt: null,
      activity: { startedAt: activityStartedAt },
    });
    prisma.summitDiscovery.update.mockResolvedValue({});

    await makeService(prisma).updateDiscovery(
      'user-1',
      'historical-discovery',
      { status: SummitDiscoveryStatus.CONFIRMED },
    );

    expect(prisma.summitDiscovery.update).toHaveBeenCalledWith({
      where: { id: 'historical-discovery' },
      data: expect.objectContaining({
        discoveredAt: activityStartedAt,
        confirmedAt: expect.any(Date),
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
        confirmationSource: null,
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
