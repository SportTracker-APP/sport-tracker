import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ActivityStatus,
  GeoAreaType,
  Prisma,
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitDiscoveryConfirmationSource,
  SummitDiscoveryStatus,
} from '@prisma/client';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from '../geography/geo-areas.service';
import { seedNationalGeoCatalog } from '../geography/geo-area-seed';
import { BADGE_CATALOG } from './badge-catalog';
import { evaluateBadgeCatalog, getBadgeProgress } from './badge-engine';
import { UpdateSummitDiscoveryDto } from './dto/update-summit-discovery.dto';
import { ListSummitsDto } from './dto/list-summits.dto';
import { SUMMIT_CATALOG } from './summit-catalog';
import { detectSummits, SUMMIT_DETECTION_VERSION } from './summit-detection';
import {
  PUBLIC_MAP_SUMMIT_WHERE,
  PUBLIC_SUMMIT_WHERE,
} from './summit-publication';

type ProcessOptions = {
  sendNotifications?: boolean;
};

type ReconcilePendingDetectionOptions = {
  batchSize?: number;
  maxBatches?: number;
};

export type PendingDetectionReconciliationResult = {
  batches: number;
  processed: number;
  detected: number;
  confirmed: number;
  remaining: number;
};

const DEFAULT_DETECTION_BATCH_SIZE = 20;
const MAX_DETECTION_BATCH_SIZE = 100;

@Injectable()
export class SummitsService implements OnModuleInit {
  private readonly logger = new Logger(SummitsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly geoAreasService: GeoAreasService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.synchronizeCatalogs();
    } catch (error) {
      const errorCode =
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code
          : error instanceof Prisma.PrismaClientInitializationError
            ? error.errorCode
            : undefined;

      if (errorCode === 'P1001' || errorCode === 'P2021') {
        this.logger.warn({
          message:
            'Summit catalog initialization deferred because the database or schema is unavailable',
        });
        return;
      }

      throw error;
    }
  }

  async synchronizeCatalogs(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.badge.updateMany({
        where: { id: { notIn: BADGE_CATALOG.map((badge) => badge.id) } },
        data: { isActive: false },
      }),
      ...SUMMIT_CATALOG.map((summit) =>
        this.prisma.summit.upsert({
          where: { id: summit.id },
          create: {
            id: summit.id,
            name: summit.name,
            aliases: [...(summit.aliases ?? [])],
            altitude: summit.altitude,
            massif: summit.massif,
            difficulty: summit.difficulty,
            type: summit.type,
            longitude: summit.coordinates[0],
            latitude: summit.coordinates[1],
            imageUrl: summit.imageUrl,
            imageCredit: summit.imageCredit,
            sourceUrl: summit.sourceUrl,
            catalogTier: SummitCatalogTier.CORE,
            suggestedTier: SummitCatalogTier.CORE,
            tierReason: 'Legacy HOVREN',
            catalogStatus: SummitCatalogStatus.READY,
            isActive: true,
          },
          update: {
            // Identity and geography are now catalogue-managed through the
            // admin back-office. Only read-only media metadata still follows
            // the bundled bootstrap catalogue for existing summits.
            imageUrl: summit.imageUrl,
            imageCredit: summit.imageCredit,
            sourceUrl: summit.sourceUrl,
          },
        }),
      ),
      ...BADGE_CATALOG.map((badge) =>
        this.prisma.badge.upsert({
          where: { id: badge.id },
          create: {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            hint: badge.hint,
            icon: badge.icon,
            tone: badge.tone,
            sortOrder: badge.sortOrder,
          },
          update: {
            name: badge.name,
            description: badge.description,
            hint: badge.hint,
            icon: badge.icon,
            tone: badge.tone,
            sortOrder: badge.sortOrder,
            isActive: true,
          },
        }),
      ),
    ]);

    await seedNationalGeoCatalog(this.prisma, {
      summitIds: SUMMIT_CATALOG.map((summit) => summit.id),
      administrativeAreaSlug: 'haute-savoie',
    });
  }

  async findAll(userId: string, query: ListSummitsDto = {}) {
    const requestedGeoAreaIds = query.geoAreaIds?.length
      ? query.geoAreaIds
      : query.geoAreaId
        ? [query.geoAreaId]
        : [];
    const geoAreaIds = requestedGeoAreaIds.length
      ? await this.geoAreasService.getPublishedAreaIdsForMany(
          requestedGeoAreaIds,
          query.includeDescendants ?? true,
        )
      : null;

    const summits = await this.prisma.summit.findMany({
      where: {
        ...(query.includeSecondary
          ? PUBLIC_MAP_SUMMIT_WHERE
          : PUBLIC_SUMMIT_WHERE),
        ...(geoAreaIds
          ? {
              geoAreas: {
                some: { geoAreaId: { in: geoAreaIds } },
              },
            }
          : {}),
      },
      include: {
        primaryMassif: true,
        geoAreas: { include: { geoArea: true } },
        discoveries: {
          where: {
            userId,
            status: { not: SummitDiscoveryStatus.DISMISSED },
          },
          include: {
            activity: {
              select: {
                id: true,
                title: true,
                sport: true,
                startedAt: true,
                distance: true,
                elevationGain: true,
                maxAltitude: true,
                coverImageUrl: true,
              },
            },
          },
          orderBy: { discoveredAt: 'asc' },
        },
      },
      orderBy: [{ massif: 'asc' }, { altitude: 'asc' }],
    });

    return summits.map((summit) => {
      const isCollectible = summit.catalogTier === SummitCatalogTier.CORE;
      const confirmedDiscoveries = isCollectible
        ? summit.discoveries.filter(
            (discovery) => discovery.status === SummitDiscoveryStatus.CONFIRMED,
          )
        : [];
      const pendingDiscoveries = isCollectible
        ? summit.discoveries.filter(
            (discovery) => discovery.status === SummitDiscoveryStatus.PENDING,
          )
        : [];
      const firstDiscovery = confirmedDiscoveries[0] ?? null;
      const latestDiscovery =
        confirmedDiscoveries[confirmedDiscoveries.length - 1] ?? null;
      const closestDistance = summit.discoveries.reduce<number | null>(
        (closest, discovery) =>
          closest === null
            ? discovery.closestDistance
            : Math.min(closest, discovery.closestDistance),
        null,
      );
      const department = summit.geoAreas.find(
        ({ geoArea }) => geoArea.type === GeoAreaType.DEPARTMENT,
      )?.geoArea;
      const publicMassif = summit.primaryMassif?.name ?? summit.massif;

      return {
        id: summit.id,
        name: summit.name,
        aliases: summit.aliases,
        altitude: summit.altitude,
        massif: publicMassif,
        department: department?.name ?? null,
        primaryMassif: summit.primaryMassif,
        geoAreas: summit.geoAreas.map(({ geoArea }) => geoArea),
        difficulty: summit.difficulty,
        type: summit.type,
        coordinates: [summit.longitude, summit.latitude] as const,
        imageUrl: summit.editorialImageUrl ?? summit.imageUrl,
        imageCredit: summit.editorialImageUrl
          ? summit.editorialImageCredit
          : summit.imageCredit,
        sourceUrl: summit.editorialImageUrl
          ? summit.editorialSourceUrl
          : summit.sourceUrl,
        catalogTier: summit.catalogTier,
        discovered: isCollectible && confirmedDiscoveries.length > 0,
        closestDistance: isCollectible ? closestDistance : null,
        activityCount: confirmedDiscoveries.length,
        firstActivity: firstDiscovery?.activity ?? null,
        latestActivity: latestDiscovery?.activity ?? null,
        firstDiscoveredAt: firstDiscovery?.discoveredAt ?? null,
        latestDiscoveredAt: latestDiscovery?.discoveredAt ?? null,
        pendingDiscoveries: pendingDiscoveries.map((discovery) => ({
          id: discovery.id,
          confidence: discovery.confidence,
          closestDistance: discovery.closestDistance,
          activity: discovery.activity,
        })),
      };
    });
  }

  async findMapSummits(userId: string, query: ListSummitsDto = {}) {
    const requestedGeoAreaIds = query.geoAreaIds?.length
      ? query.geoAreaIds
      : query.geoAreaId
        ? [query.geoAreaId]
        : [];
    const geoAreaIds = requestedGeoAreaIds.length
      ? await this.geoAreasService.getPublishedAreaIdsForMany(
          requestedGeoAreaIds,
          query.includeDescendants ?? true,
        )
      : null;

    const summits = await this.prisma.summit.findMany({
      where: {
        ...PUBLIC_MAP_SUMMIT_WHERE,
        ...(geoAreaIds
          ? { geoAreas: { some: { geoAreaId: { in: geoAreaIds } } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        altitude: true,
        longitude: true,
        latitude: true,
        catalogTier: true,
        discoveries: {
          where: {
            userId,
            status: SummitDiscoveryStatus.CONFIRMED,
          },
          select: { discoveredAt: true },
          orderBy: { discoveredAt: 'asc' },
        },
      },
      orderBy: [{ altitude: 'desc' }, { name: 'asc' }],
    });

    return summits.map((summit) => ({
      id: summit.id,
      name: summit.name,
      altitude: summit.altitude,
      catalogTier: summit.catalogTier,
      coordinates: [summit.longitude, summit.latitude] as const,
      discovered:
        summit.catalogTier === SummitCatalogTier.CORE &&
        summit.discoveries.length > 0,
      firstDiscoveredAt:
        summit.catalogTier === SummitCatalogTier.CORE
          ? (summit.discoveries[0]?.discoveredAt ?? null)
          : null,
      latestDiscoveredAt:
        summit.catalogTier === SummitCatalogTier.CORE
          ? (summit.discoveries.at(-1)?.discoveredAt ?? null)
          : null,
    }));
  }

  async findBadges(userId: string) {
    await this.reconcileBadges(userId, false);

    const [discoveries, activities] = await Promise.all([
      this.prisma.summitDiscovery.findMany({
        where: {
          userId,
          status: SummitDiscoveryStatus.CONFIRMED,
          summit: { catalogTier: SummitCatalogTier.CORE },
        },
        include: { activity: true },
        orderBy: { activity: { startedAt: 'asc' } },
      }),
      this.prisma.activity.findMany({
        where: { userId, status: ActivityStatus.COMPLETED },
        select: {
          distance: true,
          elevationGain: true,
          sport: true,
          startLatitude: true,
          startLongitude: true,
          startedAt: true,
          temperature: true,
          weather: true,
        },
      }),
    ]);
    const firstBySummit = new Map<string, (typeof discoveries)[number]>();

    for (const discovery of discoveries) {
      if (!firstBySummit.has(discovery.summitId)) {
        firstBySummit.set(discovery.summitId, discovery);
      }
    }

    const uniqueDiscoveries = Array.from(firstBySummit.values());
    const badges = await this.prisma.badge.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: { userId },
          select: { unlockedAt: true },
          take: 1,
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const catalogById = new Map(
      BADGE_CATALOG.map((badge) => [badge.id, badge]),
    );

    return badges.map((badge) => {
      const catalogBadge = catalogById.get(badge.id);

      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        hint: badge.hint,
        icon: badge.icon,
        tone: badge.tone,
        category: catalogBadge?.category ?? 'Progression D+',
        criterion: catalogBadge?.criterion ?? badge.hint,
        progress: catalogBadge
          ? getBadgeProgress(catalogBadge.rule, activities, uniqueDiscoveries)
          : null,
        unlocked: badge.users.length > 0,
        unlockedAt: badge.users[0]?.unlockedAt ?? null,
      };
    });
  }

  async processActivities(
    userId: string,
    activityIds: string[],
    options: ProcessOptions = {},
  ) {
    const uniqueActivityIds = Array.from(new Set(activityIds));
    let detected = 0;
    let confirmed = 0;

    for (const activityId of uniqueActivityIds) {
      const result = await this.detectActivity(userId, activityId);
      detected += result.detected;
      confirmed += result.confirmed;
    }

    await this.reconcileBadges(userId, options.sendNotifications ?? true);

    return { processed: uniqueActivityIds.length, detected, confirmed };
  }

  async recalculateUser(userId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        userId,
        status: ActivityStatus.COMPLETED,
        routePolyline: { not: null },
      },
      select: { id: true },
      orderBy: { startedAt: 'asc' },
    });

    return this.processActivities(
      userId,
      activities.map((activity) => activity.id),
      { sendNotifications: false },
    );
  }

  async recalculateAll() {
    const users = await this.prisma.activity.findMany({
      where: {
        status: ActivityStatus.COMPLETED,
        routePolyline: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const results: Array<{
      userId: string;
      processed: number;
      detected: number;
      confirmed: number;
    }> = [];

    for (const user of users) {
      results.push({
        userId: user.userId,
        ...(await this.recalculateUser(user.userId)),
      });
    }

    return results;
  }

  async reconcilePendingActivityDetections(
    options: ReconcilePendingDetectionOptions = {},
  ): Promise<PendingDetectionReconciliationResult> {
    const batchSize = Math.min(
      MAX_DETECTION_BATCH_SIZE,
      Math.max(
        1,
        Math.trunc(options.batchSize ?? DEFAULT_DETECTION_BATCH_SIZE),
      ),
    );
    const maxBatches =
      options.maxBatches === undefined
        ? Number.POSITIVE_INFINITY
        : Math.max(0, Math.trunc(options.maxBatches));
    const totals = {
      batches: 0,
      processed: 0,
      detected: 0,
      confirmed: 0,
    };
    const attemptedActivityIds = new Set<string>();

    while (totals.batches < maxBatches) {
      const pendingActivities = await this.prisma.activity.findMany({
        where: {
          status: ActivityStatus.COMPLETED,
          routePolyline: { not: null },
          summitDetectionVersion: { lt: SUMMIT_DETECTION_VERSION },
        },
        select: { id: true, userId: true },
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        take: batchSize,
      });

      if (pendingActivities.length === 0) {
        break;
      }

      const repeatedActivity = pendingActivities.find(({ id }) =>
        attemptedActivityIds.has(id),
      );
      if (repeatedActivity) {
        throw new Error(
          `Summit detection batch made no progress for activity ${repeatedActivity.id}`,
        );
      }
      pendingActivities.forEach(({ id }) => attemptedActivityIds.add(id));

      const activityIdsByUser = new Map<string, string[]>();
      for (const activity of pendingActivities) {
        const activityIds = activityIdsByUser.get(activity.userId) ?? [];
        activityIds.push(activity.id);
        activityIdsByUser.set(activity.userId, activityIds);
      }

      for (const [userId, activityIds] of activityIdsByUser) {
        const result = await this.processActivities(userId, activityIds, {
          sendNotifications: false,
        });
        totals.processed += result.processed;
        totals.detected += result.detected;
        totals.confirmed += result.confirmed;
      }

      totals.batches += 1;
      this.logger.log({
        batch: totals.batches,
        batchActivities: pendingActivities.length,
        processedActivities: totals.processed,
        detectedSummits: totals.detected,
        confirmedSummits: totals.confirmed,
        message: 'Pending summit detection batch completed',
      });
    }

    const remaining = await this.prisma.activity.count({
      where: {
        status: ActivityStatus.COMPLETED,
        routePolyline: { not: null },
        summitDetectionVersion: { lt: SUMMIT_DETECTION_VERSION },
      },
    });

    return { ...totals, remaining };
  }

  async updateDiscovery(
    userId: string,
    discoveryId: string,
    dto: UpdateSummitDiscoveryDto,
  ) {
    const discovery = await this.prisma.summitDiscovery.findFirst({
      where: {
        id: discoveryId,
        userId,
        summit: { catalogTier: SummitCatalogTier.CORE },
      },
      include: { activity: { select: { startedAt: true } } },
    });

    if (!discovery) {
      throw new NotFoundException('Découverte de sommet introuvable');
    }

    const confirmed = dto.status === SummitDiscoveryStatus.CONFIRMED;
    const updated = await this.prisma.summitDiscovery.update({
      where: { id: discovery.id },
      data: {
        status: dto.status,
        confirmationSource: confirmed
          ? SummitDiscoveryConfirmationSource.USER
          : null,
        discoveredAt: confirmed
          ? discovery.activity.startedAt
          : discovery.discoveredAt,
        confirmedAt: confirmed ? (discovery.confirmedAt ?? new Date()) : null,
        dismissedAt: confirmed ? null : new Date(),
      },
    });

    await this.reconcileBadges(userId, true);

    return updated;
  }

  async dismissSummit(userId: string, summitId: string) {
    const dismissedAt = new Date();
    const result = await this.prisma.summitDiscovery.updateMany({
      where: {
        userId,
        summitId,
        status: { not: SummitDiscoveryStatus.DISMISSED },
      },
      data: {
        status: SummitDiscoveryStatus.DISMISSED,
        confirmationSource: null,
        confirmedAt: null,
        dismissedAt,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Sommet découvert introuvable');
    }

    await this.reconcileBadges(userId, true);

    return { dismissedDiscoveries: result.count };
  }

  private async detectActivity(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
        status: ActivityStatus.COMPLETED,
        routePolyline: { not: null },
      },
    });

    if (!activity) {
      return { detected: 0, confirmed: 0 };
    }

    if (!activity.routePolyline) {
      await this.markActivityDetectionProcessed(activity.id);
      return { detected: 0, confirmed: 0 };
    }

    const summits = await this.prisma.summit.findMany({
      where: PUBLIC_SUMMIT_WHERE,
      select: {
        id: true,
        name: true,
        aliases: true,
        altitude: true,
        latitude: true,
        longitude: true,
      },
    });
    const matches = detectSummits(
      {
        title: activity.title,
        maxAltitude: activity.maxAltitude,
        routePolyline: activity.routePolyline,
      },
      summits,
    );
    const existingDiscoveries = await this.prisma.summitDiscovery.findMany({
      where: { activityId },
      select: {
        summitId: true,
        status: true,
        confirmationSource: true,
        confirmedAt: true,
      },
    });
    const existingBySummit = new Map(
      existingDiscoveries.map((discovery) => [discovery.summitId, discovery]),
    );

    for (const match of matches) {
      const existing = existingBySummit.get(match.summitId);
      const detectedStatus = match.autoConfirmed
        ? SummitDiscoveryStatus.CONFIRMED
        : SummitDiscoveryStatus.PENDING;
      const manuallyConfirmed =
        existing?.status === SummitDiscoveryStatus.CONFIRMED &&
        existing.confirmationSource === SummitDiscoveryConfirmationSource.USER;
      const status =
        existing?.status === SummitDiscoveryStatus.DISMISSED
          ? SummitDiscoveryStatus.DISMISSED
          : manuallyConfirmed
            ? SummitDiscoveryStatus.CONFIRMED
            : detectedStatus;
      const confirmationSource =
        status === SummitDiscoveryStatus.CONFIRMED
          ? manuallyConfirmed
            ? SummitDiscoveryConfirmationSource.USER
            : SummitDiscoveryConfirmationSource.AUTO
          : null;

      await this.prisma.summitDiscovery.upsert({
        where: {
          summitId_activityId: { summitId: match.summitId, activityId },
        },
        create: {
          userId,
          summitId: match.summitId,
          activityId,
          status,
          confirmationSource,
          confidence: match.confidence,
          closestDistance: match.closestDistance,
          altitudeMatched: match.altitudeMatched,
          titleMatched: match.titleMatched,
          routePointCount: match.routePointCount,
          nearbyPointCount: match.nearbyPointCount,
          detectionVersion: match.detectionVersion,
          discoveredAt: activity.startedAt,
          confirmedAt:
            status === SummitDiscoveryStatus.CONFIRMED ? new Date() : null,
        },
        update: {
          status,
          confirmationSource,
          confidence: match.confidence,
          closestDistance: match.closestDistance,
          altitudeMatched: match.altitudeMatched,
          titleMatched: match.titleMatched,
          routePointCount: match.routePointCount,
          nearbyPointCount: match.nearbyPointCount,
          detectionVersion: match.detectionVersion,
          discoveredAt: activity.startedAt,
          confirmedAt:
            status === SummitDiscoveryStatus.CONFIRMED
              ? (existing?.confirmedAt ?? new Date())
              : null,
          dismissedAt:
            status === SummitDiscoveryStatus.DISMISSED ? undefined : null,
        },
      });
    }

    const matchedSummitIds = new Set(matches.map(({ summitId }) => summitId));
    const staleAutomaticSummitIds = existingDiscoveries.flatMap(
      ({ summitId, status, confirmationSource }) =>
        !matchedSummitIds.has(summitId) &&
        (status === SummitDiscoveryStatus.PENDING ||
          confirmationSource === SummitDiscoveryConfirmationSource.AUTO)
          ? [summitId]
          : [],
    );
    if (staleAutomaticSummitIds.length > 0) {
      await this.prisma.summitDiscovery.updateMany({
        where: {
          activityId,
          summitId: { in: staleAutomaticSummitIds },
        },
        data: {
          status: SummitDiscoveryStatus.DISMISSED,
          confirmationSource: null,
          confirmedAt: null,
          dismissedAt: new Date(),
        },
      });
    }

    await this.markActivityDetectionProcessed(activityId);

    return {
      detected: matches.length,
      confirmed: matches.filter((match) => match.autoConfirmed).length,
    };
  }

  private async markActivityDetectionProcessed(activityId: string) {
    await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        summitDetectionProcessedAt: new Date(),
        summitDetectionVersion: SUMMIT_DETECTION_VERSION,
      },
    });
  }

  private async reconcileBadges(userId: string, sendNotifications: boolean) {
    const discoveries = await this.prisma.summitDiscovery.findMany({
      where: {
        userId,
        status: SummitDiscoveryStatus.CONFIRMED,
        summit: { catalogTier: SummitCatalogTier.CORE },
      },
      include: { summit: true, activity: true },
      orderBy: { activity: { startedAt: 'asc' } },
    });
    const firstBySummit = new Map<string, (typeof discoveries)[number]>();

    for (const discovery of discoveries) {
      if (!firstBySummit.has(discovery.summitId)) {
        firstBySummit.set(discovery.summitId, discovery);
      }
    }

    const uniqueDiscoveries = Array.from(firstBySummit.values());
    const firstDiscovery = uniqueDiscoveries[0];
    const activities = await this.prisma.activity.findMany({
      where: { userId, status: ActivityStatus.COMPLETED },
      select: {
        distance: true,
        elevationGain: true,
        sport: true,
        startLatitude: true,
        startLongitude: true,
        startedAt: true,
        temperature: true,
        weather: true,
      },
    });
    const qualifiedBadgeIds = Array.from(
      evaluateBadgeCatalog(BADGE_CATALOG, activities, uniqueDiscoveries),
    );
    const managedBadgeIds = BADGE_CATALOG.map((badge) => badge.id);
    await this.prisma.userBadge.deleteMany({
      where: {
        userId,
        badgeId: {
          in: managedBadgeIds,
          ...(qualifiedBadgeIds.length > 0 ? { notIn: qualifiedBadgeIds } : {}),
        },
      },
    });

    if (qualifiedBadgeIds.length > 0) {
      await this.prisma.userBadge.createMany({
        data: qualifiedBadgeIds.map((badgeId) => ({
          userId,
          badgeId,
          sourceDiscoveryId:
            badgeId === 'first-summit'
              ? (firstDiscovery?.id ?? null)
              : badgeId === 'summits-10'
                ? (uniqueDiscoveries[9]?.id ?? null)
                : null,
        })),
        skipDuplicates: true,
      });
    }

    if (!firstDiscovery) {
      return;
    }

    if (sendNotifications) {
      await this.sendFirstSummitEmail(userId, firstDiscovery.id);
      return;
    }

    // Historical imports must not produce a delayed "first summit" email later.
    await this.prisma.userBadge.updateMany({
      where: {
        userId,
        badgeId: 'first-summit',
        notificationSentAt: null,
      },
      data: { notificationSentAt: new Date() },
    });
  }

  private async sendFirstSummitEmail(userId: string, discoveryId: string) {
    const userBadge = await this.prisma.userBadge.findUnique({
      where: {
        userId_badgeId: { userId, badgeId: 'first-summit' },
      },
    });

    if (!userBadge || userBadge.notificationSentAt) {
      return;
    }

    const discovery = await this.prisma.summitDiscovery.findUnique({
      where: { id: discoveryId },
      include: { summit: true, activity: true, user: true },
    });

    if (!discovery) {
      return;
    }

    try {
      const result = await this.mailService.sendFirstSummitValidatedEmail({
        to: discovery.user.email,
        userName: discovery.user.firstName,
        summitDate: new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'long',
          timeZone: 'Europe/Paris',
        }).format(discovery.activity.startedAt),
        summitName: discovery.summit.name,
        summitAltitude: `${new Intl.NumberFormat('fr-FR').format(discovery.summit.altitude)} m`,
        routeDistance: discovery.activity.distance
          ? `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(discovery.activity.distance)} km`
          : 'Non renseignée',
        elevationGain: discovery.activity.elevationGain
          ? `${new Intl.NumberFormat('fr-FR').format(discovery.activity.elevationGain)} m D+`
          : 'Non renseigné',
        summitUrl: this.buildSummitUrl(discovery.summit.id),
        businessId: `summit-discovery:${discovery.id}`,
      });

      if (!result.skipped) {
        await this.prisma.userBadge.update({
          where: { id: userBadge.id },
          data: { notificationSentAt: new Date() },
        });
      }
    } catch (error) {
      this.logger.warn({
        discoveryId,
        message: 'First summit email failed',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  private buildSummitUrl(summitId: string): string {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      this.configService.get<string>('APP_BASE_URL') ??
      'http://localhost:3000';

    return new URL(
      `/sommets?sommet=${encodeURIComponent(summitId)}#sommet-${encodeURIComponent(summitId)}`,
      baseUrl,
    ).toString();
  }
}
