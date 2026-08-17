import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityStatus, Prisma, SummitDiscoveryStatus } from '@prisma/client';

import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from '../geography/geo-areas.service';
import { seedNationalGeoCatalog } from '../geography/geo-area-seed';
import { BADGE_CATALOG } from './badge-catalog';
import { evaluateBadgeCatalog, getBadgeProgress } from './badge-engine';
import { UpdateSummitDiscoveryDto } from './dto/update-summit-discovery.dto';
import { ListSummitsDto } from './dto/list-summits.dto';
import { SUMMIT_CATALOG } from './summit-catalog';
import { detectSummits } from './summit-detection';

type ProcessOptions = {
  sendNotifications?: boolean;
};

@Injectable()
export class SummitsService implements OnModuleInit {
  private readonly logger = new Logger(SummitsService.name);
  private readonly historicalBackfillAttempts = new Set<string>();

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
          },
          update: {
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
            isActive: true,
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
    });
  }

  async findAll(userId: string, query: ListSummitsDto = {}) {
    await this.ensureHistoricalBackfill(userId);

    const geoAreaIds = query.geoAreaId
      ? await this.geoAreasService.getPublishedAreaIds(
          query.geoAreaId,
          query.includeDescendants ?? true,
        )
      : null;

    const summits = await this.prisma.summit.findMany({
      where: {
        isActive: true,
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
                coverImageUrl: true,
              },
            },
          },
          orderBy: { activity: { startedAt: 'asc' } },
        },
      },
      orderBy: [{ massif: 'asc' }, { altitude: 'asc' }],
    });

    return summits.map((summit) => {
      const confirmedDiscoveries = summit.discoveries.filter(
        (discovery) => discovery.status === SummitDiscoveryStatus.CONFIRMED,
      );
      const pendingDiscoveries = summit.discoveries.filter(
        (discovery) => discovery.status === SummitDiscoveryStatus.PENDING,
      );
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

      return {
        id: summit.id,
        name: summit.name,
        aliases: summit.aliases,
        altitude: summit.altitude,
        massif: summit.primaryMassif?.name ?? summit.massif,
        primaryMassif: summit.primaryMassif,
        geoAreas: summit.geoAreas.map(({ geoArea }) => geoArea),
        difficulty: summit.difficulty,
        type: summit.type,
        coordinates: [summit.longitude, summit.latitude] as const,
        imageUrl: summit.imageUrl,
        imageCredit: summit.imageCredit,
        sourceUrl: summit.sourceUrl,
        discovered: confirmedDiscoveries.length > 0,
        closestDistance,
        activityCount: confirmedDiscoveries.length,
        firstActivity: firstDiscovery?.activity ?? null,
        latestActivity: latestDiscovery?.activity ?? null,
        firstDiscoveredAt: firstDiscovery?.confirmedAt ?? null,
        latestDiscoveredAt: latestDiscovery?.confirmedAt ?? null,
        pendingDiscoveries: pendingDiscoveries.map((discovery) => ({
          id: discovery.id,
          confidence: discovery.confidence,
          closestDistance: discovery.closestDistance,
          activity: discovery.activity,
        })),
      };
    });
  }

  async findBadges(userId: string) {
    await this.reconcileBadges(userId, false);

    const [discoveries, activities] = await Promise.all([
      this.prisma.summitDiscovery.findMany({
        where: { userId, status: SummitDiscoveryStatus.CONFIRMED },
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

  private async ensureHistoricalBackfill(userId: string): Promise<void> {
    if (this.historicalBackfillAttempts.has(userId)) {
      return;
    }

    this.historicalBackfillAttempts.add(userId);

    try {
      const existingDiscoveries = await this.prisma.summitDiscovery.count({
        where: { userId },
      });

      if (existingDiscoveries > 0) {
        return;
      }

      const completedRoutes = await this.prisma.activity.count({
        where: {
          userId,
          status: ActivityStatus.COMPLETED,
          routePolyline: { not: null },
        },
      });

      if (completedRoutes === 0) {
        return;
      }

      const result = await this.recalculateUser(userId);
      this.logger.log({
        processedActivities: result.processed,
        detectedSummits: result.detected,
        confirmedSummits: result.confirmed,
        message: 'Historical summit discovery backfill completed',
      });
    } catch (error) {
      this.historicalBackfillAttempts.delete(userId);
      this.logger.warn({
        errorName: error instanceof Error ? error.name : 'UnknownError',
        message: 'Historical summit discovery backfill deferred',
      });
    }
  }

  async updateDiscovery(
    userId: string,
    discoveryId: string,
    dto: UpdateSummitDiscoveryDto,
  ) {
    const discovery = await this.prisma.summitDiscovery.findFirst({
      where: { id: discoveryId, userId },
    });

    if (!discovery) {
      throw new NotFoundException('Découverte de sommet introuvable');
    }

    const confirmed = dto.status === SummitDiscoveryStatus.CONFIRMED;
    const updated = await this.prisma.summitDiscovery.update({
      where: { id: discovery.id },
      data: {
        status: dto.status,
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

    if (!activity?.routePolyline) {
      return { detected: 0, confirmed: 0 };
    }

    const summits = await this.prisma.summit.findMany({
      where: { isActive: true },
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
      select: { summitId: true, status: true, confirmedAt: true },
    });
    const existingBySummit = new Map(
      existingDiscoveries.map((discovery) => [discovery.summitId, discovery]),
    );

    for (const match of matches) {
      const existing = existingBySummit.get(match.summitId);
      const detectedStatus = match.autoConfirmed
        ? SummitDiscoveryStatus.CONFIRMED
        : SummitDiscoveryStatus.PENDING;
      const status =
        existing?.status === SummitDiscoveryStatus.DISMISSED
          ? SummitDiscoveryStatus.DISMISSED
          : detectedStatus;

      await this.prisma.summitDiscovery.upsert({
        where: {
          summitId_activityId: { summitId: match.summitId, activityId },
        },
        create: {
          userId,
          summitId: match.summitId,
          activityId,
          status,
          confidence: match.confidence,
          closestDistance: match.closestDistance,
          altitudeMatched: match.altitudeMatched,
          titleMatched: match.titleMatched,
          confirmedAt:
            status === SummitDiscoveryStatus.CONFIRMED ? new Date() : null,
        },
        update: {
          status,
          confidence: match.confidence,
          closestDistance: match.closestDistance,
          altitudeMatched: match.altitudeMatched,
          titleMatched: match.titleMatched,
          confirmedAt:
            status === SummitDiscoveryStatus.CONFIRMED
              ? (existing?.confirmedAt ?? new Date())
              : null,
          dismissedAt:
            status === SummitDiscoveryStatus.DISMISSED ? undefined : null,
        },
      });
    }

    return {
      detected: matches.length,
      confirmed: matches.filter((match) => match.autoConfirmed).length,
    };
  }

  private async reconcileBadges(userId: string, sendNotifications: boolean) {
    const discoveries = await this.prisma.summitDiscovery.findMany({
      where: { userId, status: SummitDiscoveryStatus.CONFIRMED },
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
