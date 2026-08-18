import { writeFile } from 'node:fs/promises';

import {
  Prisma,
  PrismaClient,
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitExternalProvider,
  SummitImportCandidateStatus,
  SummitImportResolutionAction,
  SummitImportRunStatus,
} from '@prisma/client';

import {
  HAUTE_SAVOIE_GEO_AREA_SLUG,
  IGN_BD_TOPO_PROVIDER,
  IGN_BD_TOPO_SOURCE_NAME,
} from './summit-import.constants';
import { enrichCandidatesWithIgnAltitude } from './summit-import-altimetry';
import { classifySummitCatalogTier } from './summit-catalog-tier';
import { matchIgnCandidates } from './summit-import-matcher';
import { calculateCandidateClassificationSignals } from './summit-import-signals';
import { readIgnSummitSnapshot } from './summit-import-source';
import type {
  ExistingSummitForMatch,
  ImportRejectedFeature,
  SummitMatchDecision,
} from './summit-import.types';
import { SUMMIT_CATALOG } from '../summit-catalog';

export type SummitImportMode = 'dry-run' | 'prepare';

export type SummitImportOptions = {
  snapshotDirectory: string;
  osmSnapshotPath: string;
  sourceVersion: string;
  sourceChecksum?: string;
  cacheDirectory: string;
  reportPath?: string;
  mode: SummitImportMode;
  catalogMode?: 'database' | 'bootstrap';
};

type ClassifiedDecision = SummitMatchDecision & {
  suggestedTier: SummitCatalogTier;
  tierReason: string;
  classificationSignals: Prisma.InputJsonObject;
  homonymGroupSize: number;
};

type CoreReleaseCandidate = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  status: SummitImportCandidateStatus;
  catalogTier: SummitCatalogTier;
  resolutionAction: SummitImportResolutionAction | null;
  matchedSummitId: string | null;
  matchedSummit: { primaryMassifId: string | null } | null;
};

export type CoreReleasePreview = {
  coreCandidates: number;
  coreEligible: number;
  coreExcludedForConflict: number;
  coreExcludedForInvalidData: number;
  coreLegacyMatched: number;
  coreNew: number;
  withoutPrimaryMassif: number;
  withPrimaryMassif: number;
  plannedCreations: number;
  plannedMatches: number;
};

export type SummitImportReport = {
  mode: SummitImportMode;
  source: {
    provider: typeof IGN_BD_TOPO_PROVIDER;
    name: string;
    version: string;
    checksum: string | null;
    scope: 'D074';
  };
  counts: {
    source: number;
    candidates: number;
    importable: number;
    matched: number;
    new: number;
    conflicts: number;
    rejected: number;
    withoutName: number;
    withoutCoordinates: number;
    withoutAltitude: number;
    withoutMassif: number;
    core: number;
    secondary: number;
    reference: number;
    homonymGroups: number;
    homonymCandidates: number;
  };
  rejectionReasons: Record<string, number>;
  conflicts: Array<{
    externalId: string;
    name: string;
    matchedSummitId: string | null;
    reason: string;
  }>;
  unmatchedLegacySummits: Array<{ id: string; name: string }>;
  unexplainedGaps: number;
  importRunId: string | null;
  idempotent: boolean;
};

function countByReason(rejected: ImportRejectedFeature[]) {
  return Object.fromEntries(
    [...new Set(rejected.map(({ reason }) => reason))].map((reason) => [
      reason,
      rejected.filter((entry) => entry.reason === reason).length,
    ]),
  );
}

function newSummitId(externalId: string) {
  return `ign-bd-topo-${externalId.toLocaleLowerCase('fr-FR')}`;
}

function hasValidCoreIdentity(candidate: CoreReleaseCandidate) {
  return (
    candidate.name.trim().length > 0 &&
    candidate.elevation !== null &&
    Number.isFinite(candidate.elevation) &&
    candidate.elevation > 0 &&
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}

function isResolvedCoreConflict(candidate: CoreReleaseCandidate) {
  return (
    candidate.status === SummitImportCandidateStatus.CONFLICT &&
    (candidate.resolutionAction ===
      SummitImportResolutionAction.MATCH_EXISTING ||
      candidate.resolutionAction === SummitImportResolutionAction.CREATE_NEW)
  );
}

function isCoreReleaseEligible(candidate: CoreReleaseCandidate) {
  if (candidate.catalogTier !== SummitCatalogTier.CORE) return false;
  if (!hasValidCoreIdentity(candidate)) return false;
  if (candidate.status === SummitImportCandidateStatus.CONFLICT) {
    return isResolvedCoreConflict(candidate);
  }
  return (
    candidate.status === SummitImportCandidateStatus.READY ||
    candidate.status === SummitImportCandidateStatus.MATCHED
  );
}

function shouldCreateCore(candidate: CoreReleaseCandidate) {
  return (
    candidate.status === SummitImportCandidateStatus.READY ||
    candidate.resolutionAction === SummitImportResolutionAction.CREATE_NEW
  );
}

export function buildCoreReleasePreview(
  candidates: CoreReleaseCandidate[],
): CoreReleasePreview {
  const coreCandidates = candidates.filter(
    ({ catalogTier }) => catalogTier === SummitCatalogTier.CORE,
  );
  const eligible = coreCandidates.filter(isCoreReleaseEligible);
  const coreExcludedForConflict = coreCandidates.filter(
    (candidate) =>
      candidate.status === SummitImportCandidateStatus.CONFLICT &&
      !isResolvedCoreConflict(candidate),
  ).length;
  const coreExcludedForInvalidData = coreCandidates.filter(
    (candidate) => !hasValidCoreIdentity(candidate),
  ).length;
  const plannedCreations = eligible.filter(shouldCreateCore).length;
  const plannedMatches = eligible.length - plannedCreations;
  const withPrimaryMassif = eligible.filter(({ matchedSummit }) =>
    Boolean(matchedSummit?.primaryMassifId),
  ).length;

  return {
    coreCandidates: coreCandidates.length,
    coreEligible: eligible.length,
    coreExcludedForConflict,
    coreExcludedForInvalidData,
    coreLegacyMatched: plannedMatches,
    coreNew: plannedCreations,
    withoutPrimaryMassif: eligible.length - withPrimaryMassif,
    withPrimaryMassif,
    plannedCreations,
    plannedMatches,
  };
}

async function loadExistingSummits(
  prisma: PrismaClient,
  catalogMode: 'database' | 'bootstrap',
): Promise<ExistingSummitForMatch[]> {
  if (catalogMode === 'bootstrap') {
    return SUMMIT_CATALOG.map((summit) => ({
      id: summit.id,
      name: summit.name,
      aliases: [...(summit.aliases ?? [])],
      altitude: summit.altitude,
      latitude: summit.coordinates[1],
      longitude: summit.coordinates[0],
      externalReferences: [],
    }));
  }

  return prisma.summit.findMany({
    select: {
      id: true,
      name: true,
      aliases: true,
      altitude: true,
      latitude: true,
      longitude: true,
      externalReferences: { select: { provider: true, externalId: true } },
    },
  });
}

async function getAreaAndAncestors(prisma: PrismaClient, slug: string) {
  const areas = await prisma.geoArea.findMany({
    select: { id: true, slug: true, parentId: true },
  });
  const byId = new Map(areas.map((area) => [area.id, area]));
  const area = areas.find((entry) => entry.slug === slug);
  if (!area) throw new Error(`GeoArea ${slug} introuvable`);

  const ids: string[] = [];
  let currentId: string | null = area.id;
  while (currentId) {
    ids.push(currentId);
    currentId = byId.get(currentId)?.parentId ?? null;
  }
  return ids;
}

function getHomonymGroupSizes(decisions: SummitMatchDecision[]) {
  const sizes = new Map<string, number>();
  for (const { candidate } of decisions) {
    sizes.set(
      candidate.normalizedName,
      (sizes.get(candidate.normalizedName) ?? 0) + 1,
    );
  }
  return sizes;
}

async function classifyDecisions(input: {
  decisions: SummitMatchDecision[];
  osmSnapshotPath: string;
}) {
  const signalsByExternalId = await calculateCandidateClassificationSignals({
    candidates: input.decisions.map(({ candidate }) => candidate),
    osmSnapshotPath: input.osmSnapshotPath,
    legacyCertainExternalIds: new Set(
      input.decisions.flatMap(({ candidate, status }) =>
        status === 'MATCHED' ? [candidate.externalId] : [],
      ),
    ),
  });
  const homonymGroupSizes = getHomonymGroupSizes(input.decisions);

  return input.decisions.map((decision): ClassifiedDecision => {
    const signals = signalsByExternalId.get(decision.candidate.externalId);
    if (!signals) {
      throw new Error(
        `Signaux de classification absents pour ${decision.candidate.externalId}`,
      );
    }
    const tier = classifySummitCatalogTier(signals);
    return {
      ...decision,
      suggestedTier: tier.tier,
      tierReason: tier.reason,
      classificationSignals: signals,
      homonymGroupSize:
        homonymGroupSizes.get(decision.candidate.normalizedName) ?? 1,
    };
  });
}

async function prepareImport(
  prisma: PrismaClient,
  options: SummitImportOptions,
  sourceCount: number,
  rejected: ImportRejectedFeature[],
  decisions: ClassifiedDecision[],
) {
  const existing = await prisma.summitImportRun.findUnique({
    where: {
      provider_sourceVersion_scope: {
        provider: SummitExternalProvider.IGN_BD_TOPO,
        sourceVersion: options.sourceVersion,
        scope: 'D074',
      },
    },
    select: { id: true, sourceChecksum: true },
  });
  if (existing) {
    if (
      existing.sourceChecksum &&
      options.sourceChecksum &&
      existing.sourceChecksum !== options.sourceChecksum
    ) {
      throw new Error(
        'Un PREPARE existe déjà pour cette version avec un checksum différent',
      );
    }
    return { importRunId: existing.id, idempotent: true };
  }

  const now = new Date();
  const run = await prisma.$transaction(
    async (transaction) => {
      const created = await transaction.summitImportRun.create({
        data: {
          provider: SummitExternalProvider.IGN_BD_TOPO,
          scope: 'D074',
          sourceVersion: options.sourceVersion,
          sourceName: IGN_BD_TOPO_SOURCE_NAME,
          sourceChecksum: options.sourceChecksum,
          status: SummitImportRunStatus.PREPARED,
          completedAt: now,
          sourceCount,
          candidateCount: decisions.length,
          matchedCount: decisions.filter(({ status }) => status === 'MATCHED')
            .length,
          conflictCount: decisions.filter(({ status }) => status === 'CONFLICT')
            .length,
          rejectedCount:
            rejected.length +
            decisions.filter(({ status }) => status === 'REJECTED').length,
          createdCount: 0,
        },
      });

      for (const decision of decisions) {
        await transaction.summitImportCandidate.create({
          data: {
            importRunId: created.id,
            externalId: decision.candidate.externalId,
            name: decision.candidate.name,
            normalizedName: decision.candidate.normalizedName,
            latitude: decision.candidate.latitude,
            longitude: decision.candidate.longitude,
            elevation: decision.candidate.elevation,
            sourceNature: decision.candidate.sourceNature,
            sourceProperties: decision.candidate.sourceProperties,
            status: decision.status,
            matchedSummitId: decision.matchedSummitId,
            suggestedTier: decision.suggestedTier,
            catalogTier: decision.suggestedTier,
            tierReason: decision.tierReason,
            classificationSignals: decision.classificationSignals,
            isLegacyMatch: decision.status === 'MATCHED',
            homonymGroupSize: decision.homonymGroupSize,
            resolutionReason: decision.reason,
          },
        });
      }
      return created;
    },
    { timeout: 120_000 },
  );

  return { importRunId: run.id, idempotent: false };
}

export async function applyPreparedSummitImport(
  prisma: PrismaClient,
  importRunId: string,
) {
  const run = await prisma.summitImportRun.findUnique({
    where: { id: importRunId },
    include: {
      candidates: {
        orderBy: { createdAt: 'asc' },
        include: {
          matchedSummit: { select: { primaryMassifId: true } },
        },
      },
    },
  });
  if (!run) throw new Error('ImportRun introuvable');
  if (
    run.status === SummitImportRunStatus.APPLIED ||
    run.status === SummitImportRunStatus.PUBLISHED
  ) {
    return {
      importRunId,
      created: run.createdCount,
      matched: run.matchedCount,
      preview: buildCoreReleasePreview(run.candidates),
    };
  }
  if (run.status !== SummitImportRunStatus.PREPARED) {
    throw new Error(`ImportRun ${run.status} non applicable`);
  }

  const departmentAreaIds = await getAreaAndAncestors(
    prisma,
    HAUTE_SAVOIE_GEO_AREA_SLUG,
  );
  if (departmentAreaIds.length === 0) {
    throw new Error('Territoire fiable absent pour le lot CORE');
  }

  const preview = buildCoreReleasePreview(run.candidates);
  const eligibleCandidates = run.candidates.filter(isCoreReleaseEligible);
  if (eligibleCandidates.length === 0) {
    throw new Error('Aucun candidat CORE éligible à appliquer');
  }

  const now = new Date();
  let createdCount = 0;
  let matchedCount = 0;

  await prisma.$transaction(
    async (transaction) => {
      for (const candidate of eligibleCandidates) {
        const shouldCreate = shouldCreateCore(candidate);
        let summitId = candidate.matchedSummitId;

        if (shouldCreate) {
          if (candidate.elevation === null) {
            throw new Error(`Altitude absente pour ${candidate.externalId}`);
          }
          summitId = newSummitId(candidate.externalId);
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
              isActive: true,
              suggestedTier: candidate.suggestedTier,
              catalogTier: candidate.catalogTier,
              tierReason: candidate.tierReason,
              tierUpdatedAt: now,
              geoAreas: {
                create: departmentAreaIds.map((geoAreaId) => ({ geoAreaId })),
              },
            },
          });
          createdCount += 1;
        } else if (summitId) {
          await transaction.summit.update({
            where: { id: summitId },
            data: {
              suggestedTier: candidate.suggestedTier,
              tierReason: candidate.tierReason,
              catalogStatus: SummitCatalogStatus.READY,
              catalogTier: SummitCatalogTier.CORE,
              isActive: true,
            },
          });
          matchedCount += 1;
        } else {
          throw new Error(
            `Le candidat ${candidate.id} doit cibler un Summit existant`,
          );
        }

        await transaction.summitExternalReference.upsert({
          where: {
            provider_externalId: {
              provider: SummitExternalProvider.IGN_BD_TOPO,
              externalId: candidate.externalId,
            },
          },
          create: {
            summitId,
            provider: SummitExternalProvider.IGN_BD_TOPO,
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
      }

      await transaction.summitImportRun.update({
        where: { id: importRunId },
        data: {
          status: SummitImportRunStatus.PUBLISHED,
          appliedAt: now,
          publishedAt: now,
          completedAt: now,
          createdCount,
          matchedCount,
        },
      });
    },
    { timeout: 120_000 },
  );

  return {
    importRunId,
    created: createdCount,
    matched: matchedCount,
    preview,
  };
}

export async function previewPreparedSummitImport(
  prisma: PrismaClient,
  importRunId: string,
) {
  const run = await prisma.summitImportRun.findUnique({
    where: { id: importRunId },
    include: {
      candidates: {
        include: {
          matchedSummit: { select: { primaryMassifId: true } },
        },
      },
    },
  });
  if (!run) throw new Error('ImportRun introuvable');
  if (run.status !== SummitImportRunStatus.PREPARED) {
    throw new Error(`ImportRun ${run.status} non prévisualisable`);
  }

  await getAreaAndAncestors(prisma, HAUTE_SAVOIE_GEO_AREA_SLUG);
  return {
    importRunId,
    sourceVersion: run.sourceVersion,
    scope: run.scope,
    preview: buildCoreReleasePreview(run.candidates),
  };
}

export async function runSummitImport(
  prisma: PrismaClient,
  options: SummitImportOptions,
): Promise<SummitImportReport> {
  const snapshot = await readIgnSummitSnapshot(options);
  const candidates = await enrichCandidatesWithIgnAltitude({
    candidates: snapshot.candidates,
    cacheDirectory: options.cacheDirectory,
    sourceVersion: options.sourceVersion,
  });
  const existingSummits = await loadExistingSummits(
    prisma,
    options.catalogMode ?? 'database',
  );
  const decisions = matchIgnCandidates(candidates, existingSummits);
  const classified = await classifyDecisions({
    decisions,
    osmSnapshotPath: options.osmSnapshotPath,
  });
  const conflicts = classified.filter(({ status }) => status === 'CONFLICT');
  const matchedSummitIds = new Set(
    classified.flatMap(({ status, matchedSummitId }) =>
      status === 'MATCHED' && matchedSummitId ? [matchedSummitId] : [],
    ),
  );
  const rejectionReasons = countByReason(snapshot.rejected);
  const decisionRejections = classified.filter(
    ({ status }) => status === 'REJECTED',
  );
  const unexplainedGaps =
    snapshot.sourceCount - snapshot.rejected.length - classified.length;
  if (decisionRejections.length > 0) {
    rejectionReasons.ALTITUDE_UNAVAILABLE = decisionRejections.length;
  }
  const homonymGroups = new Set(
    classified
      .filter(({ homonymGroupSize }) => homonymGroupSize > 1)
      .map(({ candidate }) => candidate.normalizedName),
  );

  const report: SummitImportReport = {
    mode: options.mode,
    source: {
      provider: IGN_BD_TOPO_PROVIDER,
      name: IGN_BD_TOPO_SOURCE_NAME,
      version: options.sourceVersion,
      checksum: options.sourceChecksum ?? null,
      scope: 'D074',
    },
    counts: {
      source: snapshot.sourceCount,
      candidates: candidates.length,
      importable: classified.filter(({ status }) =>
        ['READY', 'MATCHED'].includes(status),
      ).length,
      matched: classified.filter(({ status }) => status === 'MATCHED').length,
      new: classified.filter(({ status }) => status === 'READY').length,
      conflicts: conflicts.length,
      rejected: snapshot.rejected.length + decisionRejections.length,
      withoutName: snapshot.rejected.filter(
        ({ reason }) => reason === 'MISSING_NAME',
      ).length,
      withoutCoordinates: snapshot.rejected.filter(
        ({ reason }) => reason === 'INVALID_SOURCE',
      ).length,
      withoutAltitude: candidates.filter(({ elevation }) => elevation === null)
        .length,
      withoutMassif: classified.filter(({ status }) => status === 'READY')
        .length,
      core: classified.filter(
        ({ suggestedTier }) => suggestedTier === SummitCatalogTier.CORE,
      ).length,
      secondary: classified.filter(
        ({ suggestedTier }) => suggestedTier === SummitCatalogTier.SECONDARY,
      ).length,
      reference: classified.filter(
        ({ suggestedTier }) => suggestedTier === SummitCatalogTier.REFERENCE,
      ).length,
      homonymGroups: homonymGroups.size,
      homonymCandidates: classified.filter(
        ({ homonymGroupSize }) => homonymGroupSize > 1,
      ).length,
    },
    rejectionReasons,
    conflicts: conflicts.map(({ candidate, matchedSummitId, reason }) => ({
      externalId: candidate.externalId,
      name: candidate.name,
      matchedSummitId,
      reason,
    })),
    unmatchedLegacySummits: existingSummits
      .filter(({ id }) => !matchedSummitIds.has(id))
      .map(({ id, name }) => ({ id, name })),
    unexplainedGaps,
    importRunId: null,
    idempotent: false,
  };

  if (options.mode === 'prepare') {
    const prepared = await prepareImport(
      prisma,
      options,
      snapshot.sourceCount,
      snapshot.rejected,
      classified,
    );
    report.importRunId = prepared.importRunId;
    report.idempotent = prepared.idempotent;
  }

  if (options.reportPath) {
    await writeFile(
      options.reportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
  }

  return report;
}
