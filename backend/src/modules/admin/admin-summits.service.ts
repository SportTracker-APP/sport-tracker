import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  GeoAreaType,
  Prisma,
  SummitAdminAuditAction,
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitImportCandidateStatus,
  SummitImportResolutionAction,
  SummitImportRunStatus,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from '../geography/geo-areas.service';
import { HAUTE_SAVOIE_GEO_AREA_SLUG } from '../summits/import/summit-import.constants';
import { isSummitPublic } from '../summits/summit-publication';
import { ListAdminGeoAreasDto } from './dto/list-admin-geo-areas.dto';
import { CreateAdminSummitDto } from './dto/create-admin-summit.dto';
import {
  AdminImportCandidateView,
  ListAdminImportCandidatesDto,
} from './dto/list-admin-import-candidates.dto';
import { ListAdminSummitsDto } from './dto/list-admin-summits.dto';
import { UpdateAdminImportCandidateDto } from './dto/update-admin-import-candidate.dto';
import { UpdateAdminSummitDto } from './dto/update-admin-summit.dto';
import {
  getSummitDataQuality,
  getSummitPublicationQuality,
} from './summit-data-quality';

const STATUS_TRANSITIONS: Record<SummitCatalogStatus, SummitCatalogStatus[]> = {
  DRAFT: ['REVIEW', 'READY', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'READY', 'ARCHIVED'],
  READY: ['REVIEW', 'ARCHIVED'],
  ARCHIVED: ['DRAFT', 'REVIEW'],
};

const EDITABLE_IDENTITY_FIELDS = [
  'name',
  'aliases',
  'altitude',
  'latitude',
  'longitude',
  'difficulty',
  'type',
] as const;

type SummitIdentityField = (typeof EDITABLE_IDENTITY_FIELDS)[number];

const COMPLEMENTARY_RESOLUTION_ACTIONS = [
  SummitImportResolutionAction.MATCH_EXISTING,
  SummitImportResolutionAction.CREATE_NEW,
  SummitImportResolutionAction.IGNORE,
] as const;

function importedSummitId(externalId: string) {
  return `ign-bd-topo-${externalId.toLocaleLowerCase('fr-FR')}`;
}

function manualSummitId(name: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  if (!slug) throw new BadRequestException('Nom de sommet invalide');
  return slug;
}

function coordinateSuffix(latitude: number, longitude: number) {
  const part = (value: number, positive: string, negative: string) =>
    `${value >= 0 ? positive : negative}${Math.round(Math.abs(value) * 10_000)}`;
  return `${part(latitude, 'n', 's')}-${part(longitude, 'e', 'w')}`;
}

function distanceMeters(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return (
    6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

@Injectable()
export class AdminSummitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoAreasService: GeoAreasService,
  ) {}

  async findAll(query: ListAdminSummitsDto) {
    const search = query.search?.trim();
    const parsedAltitude =
      search && /^\d{2,4}$/.test(search) ? Number(search) : null;
    const where: Prisma.SummitWhereInput = {
      catalogStatus: query.status,
      catalogTier: query.tier,
      isActive: query.published,
      ...(query.massifMissing === true && { primaryMassifId: null }),
      ...(query.massifMissing === false && { primaryMassifId: { not: null } }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { id: { contains: search, mode: 'insensitive' } },
              { massif: { contains: search, mode: 'insensitive' } },
              {
                primaryMassif: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                geoAreas: {
                  some: {
                    geoArea: {
                      OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { slug: { contains: search, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              },
              ...(parsedAltitude === null
                ? []
                : [{ altitude: parsedAltitude }]),
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;

    const [summits, total] = await this.prisma.$transaction([
      this.prisma.summit.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ name: 'asc' }],
        select: {
          id: true,
          name: true,
          altitude: true,
          latitude: true,
          longitude: true,
          massif: true,
          catalogStatus: true,
          catalogTier: true,
          suggestedTier: true,
          tierReason: true,
          isActive: true,
          primaryMassifId: true,
          primaryMassif: {
            select: { id: true, name: true, slug: true, type: true },
          },
          _count: { select: { geoAreas: true } },
        },
      }),
      this.prisma.summit.count({ where }),
    ]);

    return {
      items: summits.map(({ _count, ...summit }) => ({
        ...summit,
        geoAreaCount: _count.geoAreas,
        quality: getSummitDataQuality({
          ...summit,
          geoAreaCount: _count.geoAreas,
        }),
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async findGeoAreaOptions(query: ListAdminGeoAreasDto) {
    const search = query.search?.trim();
    const areas = await this.prisma.geoArea.findMany({
      where: {
        type: query.type,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: 40,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: { parent: { select: { id: true, name: true, type: true } } },
    });

    return areas.map((area) => ({
      id: area.id,
      name: area.name,
      slug: area.slug,
      type: area.type,
      isPublished: area.isPublished,
      parent: area.parent,
    }));
  }

  async findImportRuns() {
    const runs = await this.prisma.summitImportRun.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      include: {
        candidates: {
          select: {
            status: true,
            suggestedTier: true,
            resolutionAction: true,
            appliedAt: true,
            isLegacyMatch: true,
            homonymGroupSize: true,
            matchedSummit: {
              select: {
                catalogStatus: true,
                catalogTier: true,
                isActive: true,
                primaryMassifId: true,
              },
            },
          },
        },
        appliedBy: { select: { id: true, firstName: true, email: true } },
        publishedBy: { select: { id: true, firstName: true, email: true } },
      },
    });

    return runs.map(({ candidates, ...run }) => ({
      ...run,
      candidateStatuses: Object.fromEntries(
        Object.values(SummitImportCandidateStatus).map((status) => [
          status,
          candidates.filter((candidate) => candidate.status === status).length,
        ]),
      ),
      suggestedTiers: Object.fromEntries(
        Object.values(SummitCatalogTier).map((tier) => [
          tier,
          candidates.filter((candidate) => candidate.suggestedTier === tier)
            .length,
        ]),
      ),
      resolvedConflictCount: candidates.filter(
        ({ status, resolutionAction }) =>
          status === SummitImportCandidateStatus.CONFLICT &&
          resolutionAction !== null &&
          resolutionAction !== SummitImportResolutionAction.KEEP_FOR_REVIEW,
      ).length,
      complementaryPublishableCount: candidates.filter(
        ({ status, resolutionAction, appliedAt }) =>
          status === SummitImportCandidateStatus.CONFLICT &&
          appliedAt === null &&
          COMPLEMENTARY_RESOLUTION_ACTIONS.some(
            (action) => action === resolutionAction,
          ),
      ).length,
      unresolvedConflictCount: candidates.filter(
        ({ status, resolutionAction }) =>
          status === SummitImportCandidateStatus.CONFLICT &&
          (!resolutionAction ||
            resolutionAction === SummitImportResolutionAction.KEEP_FOR_REVIEW),
      ).length,
      legacyMatchCount: candidates.filter(({ isLegacyMatch }) => isLegacyMatch)
        .length,
      homonymCandidateCount: candidates.filter(
        ({ homonymGroupSize }) => homonymGroupSize > 1,
      ).length,
      withoutMassifCount: candidates.filter(
        ({ status, matchedSummit }) =>
          status === SummitImportCandidateStatus.READY ||
          !matchedSummit?.primaryMassifId,
      ).length,
      publishableCount: candidates.filter(
        ({ status, matchedSummit }) =>
          status === SummitImportCandidateStatus.IMPORTED &&
          matchedSummit?.catalogStatus === SummitCatalogStatus.READY &&
          matchedSummit.catalogTier !== SummitCatalogTier.REFERENCE &&
          !matchedSummit.isActive,
      ).length,
    }));
  }

  async create(adminUserId: string, dto: CreateAdminSummitDto) {
    const baseSummitId = manualSummitId(dto.name.trim());
    let summitId = baseSummitId;
    try {
      await this.prisma.$transaction(
        async (transaction) => {
          const [existingId, nearbySummits, areas] = await Promise.all([
            transaction.summit.findUnique({
              where: { id: baseSummitId },
              select: { id: true, name: true },
            }),
            transaction.summit.findMany({
              where: {
                latitude: {
                  gte: dto.latitude - 0.002,
                  lte: dto.latitude + 0.002,
                },
                longitude: {
                  gte: dto.longitude - 0.003,
                  lte: dto.longitude + 0.003,
                },
              },
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
              },
            }),
            transaction.geoArea.findMany({
              select: {
                id: true,
                name: true,
                type: true,
                parentId: true,
                isPublished: true,
              },
            }),
          ]);

          const nearbyDuplicate = nearbySummits.find(
            (summit) => distanceMeters(summit, dto) <= 75,
          );
          if (nearbyDuplicate) {
            throw new ConflictException(
              `Un sommet très proche existe déjà : ${nearbyDuplicate.name} (${nearbyDuplicate.id})`,
            );
          }
          if (existingId) {
            summitId = `${baseSummitId}-${coordinateSuffix(
              dto.latitude,
              dto.longitude,
            )}`;
          }

          const areaById = new Map(areas.map((area) => [area.id, area]));
          const primaryMassif = areaById.get(dto.primaryMassifId);
          if (!primaryMassif) {
            throw new NotFoundException('Massif principal introuvable');
          }
          if (primaryMassif.type !== GeoAreaType.MASSIF) {
            throw new BadRequestException(
              'Le massif principal doit être un territoire de type MASSIF',
            );
          }
          if (dto.isActive && !primaryMassif.isPublished) {
            throw new BadRequestException(
              'Le massif principal doit être publié avant le sommet',
            );
          }
          if (dto.isActive && dto.catalogStatus !== SummitCatalogStatus.READY) {
            throw new BadRequestException(
              'Un sommet doit être au statut READY avant publication',
            );
          }
          if (dto.isActive && dto.catalogTier === SummitCatalogTier.REFERENCE) {
            throw new BadRequestException(
              'Un sommet REFERENCE ne peut pas être publié',
            );
          }

          const selectedAreaIds = new Set(dto.geoAreaIds ?? []);
          selectedAreaIds.add(primaryMassif.id);
          let ancestorId = primaryMassif.parentId;
          while (ancestorId) {
            selectedAreaIds.add(ancestorId);
            ancestorId = areaById.get(ancestorId)?.parentId ?? null;
          }
          const unknownAreaId = [...selectedAreaIds].find(
            (areaId) => !areaById.has(areaId),
          );
          if (unknownAreaId) {
            throw new NotFoundException(
              `Territoire introuvable : ${unknownAreaId}`,
            );
          }

          if (dto.externalReference) {
            const existingReference =
              await transaction.summitExternalReference.findUnique({
                where: {
                  provider_externalId: {
                    provider: dto.externalReference.provider,
                    externalId: dto.externalReference.externalId.trim(),
                  },
                },
                select: { summitId: true },
              });
            if (existingReference) {
              throw new ConflictException(
                `Cette référence externe est déjà liée au sommet ${existingReference.summitId}`,
              );
            }
          }

          const now = new Date();
          await transaction.summit.create({
            data: {
              id: summitId,
              name: dto.name.trim(),
              aliases: [],
              altitude: dto.altitude,
              latitude: dto.latitude,
              longitude: dto.longitude,
              massif: primaryMassif.name,
              difficulty: 'À définir',
              type: dto.type.trim(),
              sourceUrl: dto.sourceUrl?.trim() || null,
              catalogTier: dto.catalogTier,
              suggestedTier: dto.catalogTier,
              tierReason: 'Création manuelle admin',
              tierUpdatedAt: now,
              tierUpdatedByUserId: adminUserId,
              catalogStatus: dto.catalogStatus,
              isActive: dto.isActive,
              primaryMassifId: primaryMassif.id,
              geoAreas: {
                create: [...selectedAreaIds].map((geoAreaId) => ({
                  geoAreaId,
                })),
              },
              ...(dto.externalReference && {
                externalReferences: {
                  create: {
                    provider: dto.externalReference.provider,
                    externalId: dto.externalReference.externalId.trim(),
                    sourceName: dto.externalReference.sourceName.trim(),
                    sourceVersion:
                      dto.externalReference.sourceVersion?.trim() || 'manual',
                    firstSeenAt: now,
                    lastSeenAt: now,
                  },
                },
              }),
            },
          });
          await this.createAuditLog(transaction, {
            summitId,
            adminUserId,
            action: SummitAdminAuditAction.MANUAL_SUMMIT_CREATED,
            before: null,
            after: {
              name: dto.name.trim(),
              altitude: dto.altitude,
              latitude: dto.latitude,
              longitude: dto.longitude,
              primaryMassifId: primaryMassif.id,
              geoAreaIds: [...selectedAreaIds],
              catalogTier: dto.catalogTier,
              catalogStatus: dto.catalogStatus,
              isActive: dto.isActive,
              ...(dto.externalReference && {
                externalReference: {
                  provider: dto.externalReference.provider,
                  externalId: dto.externalReference.externalId.trim(),
                },
              }),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un sommet ou une référence identique existe déjà',
        );
      }
      throw error;
    }

    return this.findOne(summitId);
  }

  async findImportRun(
    importRunId: string,
    query: ListAdminImportCandidatesDto,
  ) {
    const viewWhere: Prisma.SummitImportCandidateWhereInput =
      query.view === AdminImportCandidateView.CONFLICTS
        ? { status: SummitImportCandidateStatus.CONFLICT }
        : query.view === AdminImportCandidateView.LEGACY
          ? { isLegacyMatch: true }
          : query.view === AdminImportCandidateView.RESOLVED
            ? {
                resolutionAction: {
                  in: [
                    SummitImportResolutionAction.MATCH_EXISTING,
                    SummitImportResolutionAction.CREATE_NEW,
                    SummitImportResolutionAction.IGNORE,
                  ],
                },
              }
            : query.view === AdminImportCandidateView.HOMONYMS
              ? { homonymGroupSize: { gt: 1 } }
              : query.view === AdminImportCandidateView.WITHOUT_MASSIF
                ? {
                    OR: [
                      { matchedSummitId: null },
                      { matchedSummit: { primaryMassifId: null } },
                    ],
                  }
                : {};
    const where: Prisma.SummitImportCandidateWhereInput = {
      importRunId,
      catalogTier: query.tier,
      ...viewWhere,
    };
    const [run, total, candidates] = await this.prisma.$transaction([
      this.prisma.summitImportRun.findUnique({ where: { id: importRunId } }),
      this.prisma.summitImportCandidate.count({ where }),
      this.prisma.summitImportCandidate.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [
          { status: 'asc' },
          { normalizedName: 'asc' },
          { elevation: 'desc' },
        ],
        include: {
          matchedSummit: {
            select: {
              id: true,
              name: true,
              primaryMassif: { select: { id: true, name: true } },
            },
          },
          resolvedBy: { select: { id: true, firstName: true, email: true } },
        },
      }),
    ]);

    if (!run) throw new NotFoundException('Import introuvable');
    return {
      ...run,
      candidates,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async updateImportCandidate(
    adminUserId: string,
    importRunId: string,
    candidateId: string,
    dto: UpdateAdminImportCandidateDto,
  ) {
    const candidate = await this.prisma.summitImportCandidate.findFirst({
      where: { id: candidateId, importRunId },
    });
    if (!candidate) throw new NotFoundException('Candidat introuvable');
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Aucune décision transmise');
    }

    if (candidate.appliedAt) {
      throw new BadRequestException(
        'Une résolution déjà appliquée ne peut plus être modifiée',
      );
    }

    if (dto.resolutionAction && candidate.status !== 'CONFLICT') {
      throw new BadRequestException(
        'Une action de résolution ne peut cibler qu’un conflit',
      );
    }
    if (
      dto.resolutionAction === SummitImportResolutionAction.MATCH_EXISTING &&
      !dto.matchedSummitId
    ) {
      throw new BadRequestException('Le Summit HOVREN cible est requis');
    }
    if (
      dto.resolutionAction === SummitImportResolutionAction.IGNORE &&
      !dto.resolutionReason?.trim()
    ) {
      throw new BadRequestException('Une raison est requise pour ignorer');
    }
    if (dto.matchedSummitId) {
      const target = await this.prisma.summit.findUnique({
        where: { id: dto.matchedSummitId },
        select: { id: true },
      });
      if (!target)
        throw new NotFoundException('Summit HOVREN cible introuvable');
    }

    const action = dto.resolutionAction;
    const resolved =
      action !== undefined &&
      action !== SummitImportResolutionAction.KEEP_FOR_REVIEW;
    return this.prisma.summitImportCandidate.update({
      where: { id: candidate.id },
      data: {
        ...(dto.catalogTier && { catalogTier: dto.catalogTier }),
        ...(action && { resolutionAction: action }),
        ...(dto.resolutionReason !== undefined && {
          resolutionReason: dto.resolutionReason.trim(),
        }),
        ...(action === SummitImportResolutionAction.MATCH_EXISTING && {
          matchedSummitId: dto.matchedSummitId,
        }),
        ...(action === SummitImportResolutionAction.CREATE_NEW && {
          matchedSummitId: null,
        }),
        ...(action && {
          resolvedAt: resolved ? new Date() : null,
          resolvedByUserId: resolved ? adminUserId : null,
        }),
      },
      include: { matchedSummit: { select: { id: true, name: true } } },
    });
  }

  async publishImportRun(adminUserId: string, importRunId: string) {
    const run = await this.prisma.summitImportRun.findUnique({
      where: { id: importRunId },
      include: {
        candidates: {
          where: {
            status: SummitImportCandidateStatus.IMPORTED,
            matchedSummit: {
              catalogStatus: SummitCatalogStatus.READY,
              catalogTier: { not: SummitCatalogTier.REFERENCE },
              isActive: false,
            },
          },
          select: { matchedSummitId: true },
        },
      },
    });

    if (!run) throw new NotFoundException('Import introuvable');
    const summitIds = [
      ...new Set(
        run.candidates.flatMap(({ matchedSummitId }) =>
          matchedSummitId ? [matchedSummitId] : [],
        ),
      ),
    ];

    if (summitIds.length === 0) {
      throw new BadRequestException(
        'Aucun sommet complet et prêt à publier dans cet import',
      );
    }

    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.summit.updateMany({
        where: {
          id: { in: summitIds },
          catalogStatus: SummitCatalogStatus.READY,
          catalogTier: { not: SummitCatalogTier.REFERENCE },
        },
        data: { isActive: true },
      });

      await transaction.summitAdminAuditLog.createMany({
        data: summitIds.map((summitId) => ({
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.IMPORT_BATCH_PUBLISHED,
          before: { isActive: false, importRunId },
          after: { isActive: true, importRunId },
        })),
      });

      await transaction.summitImportRun.update({
        where: { id: importRunId },
        data: {
          status: SummitImportRunStatus.PUBLISHED,
          publishedAt: now,
          publishedByUserId: adminUserId,
        },
      });
    });

    return { importRunId, publishedCount: summitIds.length };
  }

  async publishComplementaryResolutions(
    adminUserId: string,
    importRunId: string,
  ) {
    const run = await this.prisma.summitImportRun.findUnique({
      where: { id: importRunId },
      include: {
        candidates: {
          where: {
            status: SummitImportCandidateStatus.CONFLICT,
            appliedAt: null,
            resolutionAction: { in: [...COMPLEMENTARY_RESOLUTION_ACTIONS] },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!run) throw new NotFoundException('Import introuvable');
    if (run.status !== SummitImportRunStatus.PUBLISHED) {
      throw new BadRequestException(
        'La publication complémentaire exige un import déjà publié',
      );
    }

    if (run.candidates.length === 0) {
      return {
        importRunId,
        appliedCount: 0,
        createdCount: 0,
        matchedCount: 0,
        ignoredCount: 0,
      };
    }

    const now = new Date();
    let createdCount = 0;
    let matchedCount = 0;
    let ignoredCount = 0;

    await this.prisma.$transaction(
      async (transaction) => {
        const requiresCreation = run.candidates.some(
          ({ resolutionAction }) =>
            resolutionAction === SummitImportResolutionAction.CREATE_NEW,
        );
        const geoAreaIds = requiresCreation
          ? await this.getGeoAreaAndAncestorIds(
              transaction,
              HAUTE_SAVOIE_GEO_AREA_SLUG,
            )
          : [];

        for (const candidate of run.candidates) {
          const claimed = await transaction.summitImportCandidate.updateMany({
            where: {
              id: candidate.id,
              status: SummitImportCandidateStatus.CONFLICT,
              appliedAt: null,
              updatedAt: candidate.updatedAt,
              resolutionAction: candidate.resolutionAction,
            },
            data: { appliedAt: now, appliedByUserId: adminUserId },
          });

          if (claimed.count === 0) continue;

          if (
            candidate.resolutionAction === SummitImportResolutionAction.IGNORE
          ) {
            await transaction.summitImportCandidate.update({
              where: { id: candidate.id },
              data: { status: SummitImportCandidateStatus.SKIPPED },
            });
            ignoredCount += 1;
            continue;
          }

          const externalReference =
            await transaction.summitExternalReference.findUnique({
              where: {
                provider_externalId: {
                  provider: run.provider,
                  externalId: candidate.externalId,
                },
              },
            });
          const publishableTier =
            candidate.catalogTier !== SummitCatalogTier.REFERENCE;
          let summitId: string;
          let auditBefore: Prisma.InputJsonObject | null = null;

          if (
            candidate.resolutionAction ===
            SummitImportResolutionAction.CREATE_NEW
          ) {
            if (candidate.elevation === null) {
              throw new BadRequestException(
                `Altitude absente pour ${candidate.name}`,
              );
            }

            summitId =
              externalReference?.summitId ??
              importedSummitId(candidate.externalId);

            if (externalReference) {
              const existingSummit = await transaction.summit.findUnique({
                where: { id: externalReference.summitId },
                select: {
                  id: true,
                  catalogStatus: true,
                  catalogTier: true,
                  isActive: true,
                },
              });
              if (!existingSummit) {
                throw new NotFoundException(
                  `Sommet référencé introuvable pour ${candidate.name}`,
                );
              }

              auditBefore = {
                catalogStatus: existingSummit.catalogStatus,
                catalogTier: existingSummit.catalogTier,
                isActive: existingSummit.isActive,
              };
              await transaction.summit.update({
                where: { id: summitId },
                data: {
                  catalogStatus: SummitCatalogStatus.READY,
                  catalogTier: candidate.catalogTier,
                  suggestedTier: candidate.suggestedTier,
                  tierReason: candidate.tierReason,
                  tierUpdatedAt: now,
                  tierUpdatedByUserId: adminUserId,
                  isActive: publishableTier,
                },
              });
              matchedCount += 1;
            } else {
              const existingSummit = await transaction.summit.findUnique({
                where: { id: summitId },
                select: { id: true },
              });
              if (existingSummit) {
                throw new ConflictException(
                  `L’identifiant ${summitId} existe déjà sans référence externe`,
                );
              }

              await transaction.summit.create({
                data: {
                  id: summitId,
                  name: candidate.name,
                  aliases: [],
                  altitude: candidate.elevation,
                  massif: 'Massif à préciser',
                  difficulty: 'À définir',
                  type: candidate.sourceNature,
                  longitude: candidate.longitude,
                  latitude: candidate.latitude,
                  catalogStatus: SummitCatalogStatus.READY,
                  isActive: publishableTier,
                  suggestedTier: candidate.suggestedTier,
                  catalogTier: candidate.catalogTier,
                  tierReason: candidate.tierReason,
                  tierUpdatedAt: now,
                  tierUpdatedByUserId: adminUserId,
                  geoAreas: {
                    create: geoAreaIds.map((geoAreaId) => ({ geoAreaId })),
                  },
                },
              });
              createdCount += 1;
            }
          } else {
            if (!candidate.matchedSummitId) {
              throw new BadRequestException(
                `Sommet cible absent pour ${candidate.name}`,
              );
            }
            if (
              externalReference &&
              externalReference.summitId !== candidate.matchedSummitId
            ) {
              throw new ConflictException(
                `La référence ${candidate.externalId} cible déjà un autre sommet`,
              );
            }

            const matchedSummit = await transaction.summit.findUnique({
              where: { id: candidate.matchedSummitId },
              select: {
                id: true,
                catalogStatus: true,
                catalogTier: true,
                isActive: true,
              },
            });
            if (!matchedSummit) {
              throw new NotFoundException(
                `Sommet cible introuvable pour ${candidate.name}`,
              );
            }

            summitId = matchedSummit.id;
            auditBefore = {
              catalogStatus: matchedSummit.catalogStatus,
              catalogTier: matchedSummit.catalogTier,
              isActive: matchedSummit.isActive,
            };
            await transaction.summit.update({
              where: { id: summitId },
              data: {
                catalogStatus: SummitCatalogStatus.READY,
                catalogTier: candidate.catalogTier,
                suggestedTier: candidate.suggestedTier,
                tierReason: candidate.tierReason,
                tierUpdatedAt: now,
                tierUpdatedByUserId: adminUserId,
                isActive: publishableTier,
              },
            });
            matchedCount += 1;
          }

          await transaction.summitExternalReference.upsert({
            where: {
              provider_externalId: {
                provider: run.provider,
                externalId: candidate.externalId,
              },
            },
            create: {
              summitId,
              provider: run.provider,
              externalId: candidate.externalId,
              sourceVersion: run.sourceVersion,
              sourceName: run.sourceName,
              firstSeenAt: now,
              lastSeenAt: now,
            },
            update: {
              summitId,
              sourceVersion: run.sourceVersion,
              sourceName: run.sourceName,
              lastSeenAt: now,
            },
          });
          await transaction.summitImportCandidate.update({
            where: { id: candidate.id },
            data: {
              status: SummitImportCandidateStatus.IMPORTED,
              matchedSummitId: summitId,
            },
          });
          await this.createAuditLog(transaction, {
            summitId,
            adminUserId,
            action: SummitAdminAuditAction.IMPORT_COMPLEMENTARY_APPLIED,
            before: auditBefore,
            after: {
              importRunId,
              candidateId: candidate.id,
              resolutionAction: candidate.resolutionAction!,
              catalogTier: candidate.catalogTier,
              catalogStatus: SummitCatalogStatus.READY,
              isActive: publishableTier,
            },
          });
        }
      },
      { timeout: 120_000 },
    );

    return {
      importRunId,
      appliedCount: createdCount + matchedCount + ignoredCount,
      createdCount,
      matchedCount,
      ignoredCount,
    };
  }

  async findOne(summitId: string) {
    const [summit, allAreas] = await Promise.all([
      this.prisma.summit.findUnique({
        where: { id: summitId },
        include: {
          primaryMassif: true,
          geoAreas: { include: { geoArea: true } },
          adminAuditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              adminUser: {
                select: { id: true, firstName: true, email: true },
              },
            },
          },
        },
      }),
      this.prisma.geoArea.findMany({
        select: { id: true, name: true, parentId: true },
      }),
    ]);

    if (!summit) {
      throw new NotFoundException('Sommet introuvable');
    }

    const areaById = new Map(allAreas.map((area) => [area.id, area]));
    const getHierarchy = (areaId: string) => {
      const hierarchy: string[] = [];
      let currentArea = areaById.get(areaId);
      const visited = new Set<string>();

      while (currentArea && !visited.has(currentArea.id)) {
        hierarchy.unshift(currentArea.name);
        visited.add(currentArea.id);
        currentArea = currentArea.parentId
          ? areaById.get(currentArea.parentId)
          : undefined;
      }

      return hierarchy;
    };

    return {
      ...summit,
      automaticImageUrl: summit.imageUrl,
      automaticImageCredit: summit.imageCredit,
      automaticSourceUrl: summit.sourceUrl,
      imageUrl: summit.editorialImageUrl ?? summit.imageUrl,
      imageCredit: summit.editorialImageUrl
        ? summit.editorialImageCredit
        : summit.imageCredit,
      sourceUrl: summit.editorialImageUrl
        ? summit.editorialSourceUrl
        : summit.sourceUrl,
      geoAreas: summit.geoAreas
        .map(({ geoArea }) => ({
          ...geoArea,
          hierarchy: getHierarchy(geoArea.id),
        }))
        .sort((first, second) => first.name.localeCompare(second.name, 'fr')),
      quality: getSummitDataQuality({
        ...summit,
        geoAreaCount: summit.geoAreas.length,
      }),
    };
  }

  async update(
    adminUserId: string,
    summitId: string,
    dto: UpdateAdminSummitDto,
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const summit = await transaction.summit.findUnique({
        where: { id: summitId },
        include: { _count: { select: { geoAreas: true } } },
      });

      if (!summit) {
        throw new NotFoundException('Sommet introuvable');
      }

      const requestedFields = Object.keys(dto);
      if (requestedFields.length === 0) {
        throw new BadRequestException('Aucune modification transmise');
      }

      const targetStatus = dto.catalogStatus ?? summit.catalogStatus;
      const targetTier = dto.catalogTier ?? summit.catalogTier;
      this.assertStatusTransition(summit.catalogStatus, targetStatus);

      if (dto.isActive && targetStatus !== SummitCatalogStatus.READY) {
        throw new BadRequestException(
          'Un sommet doit être au statut READY avant publication',
        );
      }
      if (dto.isActive && targetTier === SummitCatalogTier.REFERENCE) {
        throw new BadRequestException(
          'Un sommet REFERENCE ne peut pas être publié',
        );
      }

      const updateData: Prisma.SummitUpdateInput = {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.aliases !== undefined && {
          aliases: dto.aliases.map((alias) => alias.trim()).filter(Boolean),
        }),
        ...(dto.altitude !== undefined && { altitude: dto.altitude }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.difficulty !== undefined && {
          difficulty: dto.difficulty.trim(),
        }),
        ...(dto.type !== undefined && { type: dto.type.trim() }),
        ...(dto.catalogStatus !== undefined && {
          catalogStatus: dto.catalogStatus,
        }),
        ...(dto.catalogTier !== undefined && {
          catalogTier: dto.catalogTier,
          tierReason: 'Admin override',
          tierUpdatedAt: new Date(),
          tierUpdatedBy: { connect: { id: adminUserId } },
        }),
      };

      const quality = getSummitPublicationQuality({
        id: summit.id,
        name: dto.name?.trim() ?? summit.name,
        altitude: dto.altitude ?? summit.altitude,
        latitude: dto.latitude ?? summit.latitude,
        longitude: dto.longitude ?? summit.longitude,
        primaryMassifId: summit.primaryMassifId,
        geoAreaCount: summit._count.geoAreas,
      });

      if (
        (targetStatus === SummitCatalogStatus.READY || dto.isActive) &&
        !quality.isPublishable
      ) {
        throw new BadRequestException(
          `Données incomplètes : ${quality.blocking.map(({ label }) => label).join(', ')}`,
        );
      }

      const targetIsActive = isSummitPublic({
        catalogStatus: targetStatus,
        catalogTier: targetTier,
        isActive: dto.isActive ?? summit.isActive,
      });
      if (targetIsActive !== summit.isActive) {
        updateData.isActive = targetIsActive;
      }

      const updated = await transaction.summit.update({
        where: { id: summitId },
        data: updateData,
      });

      const changedIdentityFields = EDITABLE_IDENTITY_FIELDS.filter(
        (field) =>
          dto[field] !== undefined &&
          !this.valuesEqual(summit[field], updated[field]),
      );
      if (changedIdentityFields.length > 0) {
        await this.createAuditLog(transaction, {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.SUMMIT_UPDATED,
          before: this.pickFields(summit, changedIdentityFields),
          after: this.pickFields(updated, changedIdentityFields),
        });
      }

      if (summit.catalogStatus !== updated.catalogStatus) {
        await this.createAuditLog(transaction, {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.STATUS_CHANGED,
          before: { catalogStatus: summit.catalogStatus },
          after: { catalogStatus: updated.catalogStatus },
        });
      }

      if (summit.catalogTier !== updated.catalogTier) {
        await this.createAuditLog(transaction, {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.TIER_CHANGED,
          before: {
            catalogTier: summit.catalogTier,
            reason: summit.tierReason ?? 'Non renseignée',
          },
          after: {
            catalogTier: updated.catalogTier,
            suggestedTier: updated.suggestedTier ?? updated.catalogTier,
            reason: updated.tierReason ?? 'Admin override',
          },
        });
      }

      if (summit.isActive !== updated.isActive) {
        await this.createAuditLog(transaction, {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.PUBLICATION_CHANGED,
          before: { isActive: summit.isActive },
          after: { isActive: updated.isActive },
        });
      }
    });

    return this.findOne(summitId);
  }

  async addGeoArea(adminUserId: string, summitId: string, geoAreaId: string) {
    try {
      await this.prisma.$transaction(async (transaction) => {
        const [summit, geoArea, existingLink] = await Promise.all([
          transaction.summit.findUnique({ where: { id: summitId } }),
          transaction.geoArea.findUnique({ where: { id: geoAreaId } }),
          transaction.summitGeoArea.findUnique({
            where: { summitId_geoAreaId: { summitId, geoAreaId } },
          }),
        ]);

        if (!summit) throw new NotFoundException('Sommet introuvable');
        if (!geoArea) throw new NotFoundException('Territoire introuvable');
        if (existingLink) {
          throw new ConflictException('Ce territoire est déjà associé');
        }

        await transaction.summitGeoArea.create({
          data: { summitId, geoAreaId },
        });
        await this.createAuditLog(transaction, {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.GEO_AREA_ADDED,
          before: null,
          after: { id: geoArea.id, name: geoArea.name, type: geoArea.type },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ce territoire est déjà associé');
      }
      throw error;
    }

    return this.findOne(summitId);
  }

  async removeGeoArea(
    adminUserId: string,
    summitId: string,
    geoAreaId: string,
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const [summit, geoArea, existingLink, areas] = await Promise.all([
        transaction.summit.findUnique({ where: { id: summitId } }),
        transaction.geoArea.findUnique({ where: { id: geoAreaId } }),
        transaction.summitGeoArea.findUnique({
          where: { summitId_geoAreaId: { summitId, geoAreaId } },
        }),
        transaction.geoArea.findMany({ select: { id: true, parentId: true } }),
      ]);

      if (!summit) throw new NotFoundException('Sommet introuvable');
      if (!geoArea || !existingLink) {
        throw new NotFoundException('Association territoriale introuvable');
      }

      const protectedAreaIds = new Set<string>();
      const parentByAreaId = new Map(
        areas.map((area) => [area.id, area.parentId]),
      );
      let protectedAreaId = summit.primaryMassifId;
      while (protectedAreaId) {
        protectedAreaIds.add(protectedAreaId);
        protectedAreaId = parentByAreaId.get(protectedAreaId) ?? null;
      }

      if (protectedAreaIds.has(geoAreaId)) {
        throw new BadRequestException(
          'Ce territoire est requis par le massif principal. Changez d’abord le massif principal.',
        );
      }

      await transaction.summitGeoArea.delete({
        where: { summitId_geoAreaId: { summitId, geoAreaId } },
      });
      await this.createAuditLog(transaction, {
        summitId,
        adminUserId,
        action: SummitAdminAuditAction.GEO_AREA_REMOVED,
        before: { id: geoArea.id, name: geoArea.name, type: geoArea.type },
        after: null,
      });
    });

    return this.findOne(summitId);
  }

  async updatePrimaryMassif(
    adminUserId: string,
    summitId: string,
    geoAreaId: string,
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const summit = await transaction.summit.findUnique({
        where: { id: summitId },
        include: { primaryMassif: true },
      });
      if (!summit) throw new NotFoundException('Sommet introuvable');

      const updated =
        await this.geoAreasService.setSummitPrimaryMassifInTransaction(
          transaction,
          summitId,
          geoAreaId,
        );

      if (summit.primaryMassifId !== updated.primaryMassifId) {
        await this.createAuditLog(transaction, {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.PRIMARY_MASSIF_CHANGED,
          before: summit.primaryMassif
            ? { id: summit.primaryMassif.id, name: summit.primaryMassif.name }
            : null,
          after: updated.primaryMassif
            ? { id: updated.primaryMassif.id, name: updated.primaryMassif.name }
            : null,
        });
      }
    });

    return this.findOne(summitId);
  }

  private assertStatusTransition(
    current: SummitCatalogStatus,
    target: SummitCatalogStatus,
  ) {
    if (current === target) return;
    if (!STATUS_TRANSITIONS[current].includes(target)) {
      throw new BadRequestException(
        `Transition de statut interdite : ${current} → ${target}`,
      );
    }
  }

  private async getGeoAreaAndAncestorIds(
    transaction: Prisma.TransactionClient,
    slug: string,
  ) {
    const areas = await transaction.geoArea.findMany({
      select: { id: true, slug: true, parentId: true, isPublished: true },
    });
    const area = areas.find((candidate) => candidate.slug === slug);

    if (!area?.isPublished) {
      throw new BadRequestException('Territoire fiable absent pour cet import');
    }

    const parentById = new Map(
      areas.map((candidate) => [candidate.id, candidate.parentId]),
    );
    const ids: string[] = [];
    let currentId: string | null = area.id;

    while (currentId) {
      ids.push(currentId);
      currentId = parentById.get(currentId) ?? null;
    }

    return ids;
  }

  private valuesEqual(first: unknown, second: unknown) {
    return JSON.stringify(first) === JSON.stringify(second);
  }

  private pickFields(
    source: Record<SummitIdentityField, unknown>,
    fields: readonly SummitIdentityField[],
  ) {
    return Object.fromEntries(
      fields.map((field) => [field, source[field] as Prisma.InputJsonValue]),
    ) as Prisma.InputJsonObject;
  }

  private createAuditLog(
    transaction: Prisma.TransactionClient,
    input: {
      summitId: string;
      adminUserId: string;
      action: SummitAdminAuditAction;
      before: Prisma.InputJsonObject | null;
      after: Prisma.InputJsonObject | null;
    },
  ) {
    return transaction.summitAdminAuditLog.create({
      data: {
        summitId: input.summitId,
        adminUserId: input.adminUserId,
        action: input.action,
        before: input.before ?? Prisma.JsonNull,
        after: input.after ?? Prisma.JsonNull,
      },
    });
  }
}
