import { writeFile } from 'node:fs/promises';

import {
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitExternalProvider,
  SummitImportCandidateStatus,
  SummitImportResolutionAction,
  SummitImportRunStatus,
  type PrismaClient,
} from '@prisma/client';

import { getDepartmentImportDefinitionByScope } from './summit-department-import';
import { isSummitPublic } from '../summit-publication';

type QaCheckStatus = 'PASS' | 'WARN' | 'FAIL';

export type SummitImportQaCandidate = {
  id: string;
  externalId: string;
  normalizedName: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  status: SummitImportCandidateStatus;
  catalogTier: SummitCatalogTier;
  isLegacyMatch: boolean;
  homonymGroupSize: number;
  resolutionAction: SummitImportResolutionAction | null;
  matchedSummitId: string | null;
  matchedSummit: {
    id: string;
    catalogStatus: SummitCatalogStatus;
    catalogTier: SummitCatalogTier;
    isActive: boolean;
    primaryMassifId: string | null;
    geoAreas: Array<{ geoArea: { slug: string } }>;
    externalReferences: Array<{
      provider: SummitExternalProvider;
      externalId: string;
    }>;
  } | null;
};

export type SummitImportQaInput = {
  id: string;
  provider: SummitExternalProvider;
  scope: string;
  sourceVersion: string;
  sourceChecksum: string | null;
  status: SummitImportRunStatus;
  sourceCount: number;
  candidateCount: number;
  conflictCount: number;
  rejectedCount: number;
  errorCount: number;
  preflightReport?: unknown;
  candidates: SummitImportQaCandidate[];
};

type QaCheck = {
  id: string;
  status: QaCheckStatus;
  message: string;
  actual: number | string | boolean;
  expected?: number | string | boolean;
};

function isValidCoordinates(candidate: SummitImportQaCandidate) {
  return (
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}

function isImported(candidate: SummitImportQaCandidate) {
  return candidate.status === SummitImportCandidateStatus.IMPORTED;
}

function isCreation(candidate: SummitImportQaCandidate) {
  return (
    isImported(candidate) &&
    (candidate.resolutionAction === SummitImportResolutionAction.CREATE_NEW ||
      (!candidate.isLegacyMatch &&
        candidate.resolutionAction !==
          SummitImportResolutionAction.MATCH_EXISTING))
  );
}

function isMatch(candidate: SummitImportQaCandidate) {
  return (
    isImported(candidate) &&
    (candidate.isLegacyMatch ||
      candidate.resolutionAction ===
        SummitImportResolutionAction.MATCH_EXISTING)
  );
}

function check(
  id: string,
  status: QaCheckStatus,
  message: string,
  actual: QaCheck['actual'],
  expected?: QaCheck['expected'],
): QaCheck {
  return {
    id,
    status,
    message,
    actual,
    ...(expected !== undefined && { expected }),
  };
}

function getPreflightCounts(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const counts = (value as { counts?: unknown }).counts;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts))
    return null;
  return counts as Record<string, unknown>;
}

function numericPreflightCount(
  counts: Record<string, unknown> | null,
  key: string,
  fallback: number,
) {
  const value = counts?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function buildSummitImportQaReport(input: SummitImportQaInput) {
  const department = getDepartmentImportDefinitionByScope(input.scope, {
    requireEnabled: false,
  });
  const preflightCounts = getPreflightCounts(input.preflightReport);
  const candidateStatuses = Object.fromEntries(
    Object.values(SummitImportCandidateStatus).map((status) => [
      status,
      input.candidates.filter((candidate) => candidate.status === status)
        .length,
    ]),
  );
  const tiers = Object.fromEntries(
    Object.values(SummitCatalogTier).map((tier) => [
      tier,
      input.candidates.filter((candidate) => candidate.catalogTier === tier)
        .length,
    ]),
  ) as Record<SummitCatalogTier, number>;
  const imported = input.candidates.filter(isImported);
  const materializedSummits = new Map(
    imported.flatMap((candidate) =>
      candidate.matchedSummit
        ? [[candidate.matchedSummit.id, candidate.matchedSummit] as const]
        : [],
    ),
  );
  const publishedSummits = [...materializedSummits.values()].filter((summit) =>
    isSummitPublic(summit),
  );
  const unpublishedSummits = [...materializedSummits.values()].filter(
    (summit) => !isSummitPublic(summit),
  );
  const unpublishedReferences = unpublishedSummits.filter(
    ({ catalogTier }) => catalogTier === SummitCatalogTier.REFERENCE,
  );
  const hiddenOrNotReady = unpublishedSummits.filter(
    ({ catalogTier }) => catalogTier !== SummitCatalogTier.REFERENCE,
  );
  const withoutMassif = [...materializedSummits.values()].filter(
    ({ primaryMassifId }) => !primaryMassifId,
  );
  const homonymNames = new Set(
    input.candidates
      .filter(({ homonymGroupSize }) => homonymGroupSize > 1)
      .map(({ normalizedName }) => normalizedName),
  );
  const withoutCoordinates = input.candidates.filter(
    (candidate) => !isValidCoordinates(candidate),
  );
  const withoutCoordinatesCount = numericPreflightCount(
    preflightCounts,
    'withoutCoordinates',
    withoutCoordinates.length,
  );
  const withoutAltitudeCount = numericPreflightCount(
    preflightCounts,
    'withoutAltitude',
    input.candidates.filter(({ elevation }) => elevation === null).length,
  );
  const homonymGroupsCount = numericPreflightCount(
    preflightCounts,
    'homonymGroups',
    homonymNames.size,
  );
  const homonymCandidatesCount = numericPreflightCount(
    preflightCounts,
    'homonymCandidates',
    input.candidates.filter(({ homonymGroupSize }) => homonymGroupSize > 1)
      .length,
  );
  const importedWithoutSummit = imported.filter(
    ({ matchedSummitId, matchedSummit }) => !matchedSummitId || !matchedSummit,
  );
  const missingExternalReferences = imported.filter((candidate) => {
    const summit = candidate.matchedSummit;
    return !summit?.externalReferences.some(
      (reference) =>
        reference.provider === input.provider &&
        reference.externalId === candidate.externalId,
    );
  });
  const outsideScope = publishedSummits.filter(
    (summit) =>
      !summit.geoAreas.some(
        ({ geoArea }) => geoArea.slug === department.geoAreaSlug,
      ),
  );
  const publishedReferences = publishedSummits.filter(
    ({ catalogTier }) => catalogTier === SummitCatalogTier.REFERENCE,
  );
  const unresolvedConflicts = input.candidates.filter(
    (candidate) =>
      candidate.status === SummitImportCandidateStatus.CONFLICT &&
      (!candidate.resolutionAction ||
        candidate.resolutionAction ===
          SummitImportResolutionAction.KEEP_FOR_REVIEW),
  );
  const statusTotal = Object.values(candidateStatuses).reduce(
    (total, count) => total + count,
    0,
  );
  const tierTotal = Object.values(tiers).reduce(
    (total, count) => total + count,
    0,
  );
  const checks: QaCheck[] = [
    check(
      'source-checksum',
      input.sourceChecksum ? 'PASS' : 'FAIL',
      input.sourceChecksum
        ? 'Le snapshot source est identifié par un checksum.'
        : 'Le checksum du snapshot source est absent.',
      Boolean(input.sourceChecksum),
      true,
    ),
    check(
      'preflight-snapshot',
      preflightCounts ? 'PASS' : 'WARN',
      preflightCounts
        ? 'Les compteurs approuvés avant apply sont conservés avec le run.'
        : 'Run historique : compteurs préflight reconstruits depuis les candidats persistés.',
      Boolean(preflightCounts),
      true,
    ),
    check(
      'candidate-accounting',
      statusTotal === input.candidateCount ? 'PASS' : 'FAIL',
      'La somme des statuts doit correspondre au nombre de candidats du run.',
      statusTotal,
      input.candidateCount,
    ),
    check(
      'tier-accounting',
      tierTotal === input.candidateCount ? 'PASS' : 'FAIL',
      'La somme CORE/SECONDARY/REFERENCE doit couvrir tous les candidats.',
      tierTotal,
      input.candidateCount,
    ),
    check(
      'unexplained-gaps',
      input.errorCount === 0 ? 'PASS' : 'FAIL',
      'Aucun écart source inexpliqué ne doit subsister.',
      input.errorCount,
      0,
    ),
    check(
      'materialized-links',
      importedWithoutSummit.length === 0 ? 'PASS' : 'FAIL',
      'Chaque candidat importé doit cibler un sommet matérialisé.',
      importedWithoutSummit.length,
      0,
    ),
    check(
      'external-references',
      missingExternalReferences.length === 0 ? 'PASS' : 'FAIL',
      'Chaque candidat importé doit conserver sa référence source.',
      missingExternalReferences.length,
      0,
    ),
    check(
      'published-scope',
      outsideScope.length === 0 ? 'PASS' : 'FAIL',
      'Chaque sommet publié doit appartenir au département du run.',
      outsideScope.length,
      0,
    ),
    check(
      'reference-publication',
      publishedReferences.length === 0 ? 'PASS' : 'FAIL',
      'Aucun sommet REFERENCE ne doit être publié.',
      publishedReferences.length,
      0,
    ),
    check(
      'coordinates',
      withoutCoordinates.length === 0 ? 'PASS' : 'FAIL',
      'Les candidats doivent posséder des coordonnées valides.',
      withoutCoordinates.length,
      0,
    ),
    check(
      'unresolved-conflicts',
      unresolvedConflicts.length === 0 ? 'PASS' : 'WARN',
      'Les conflits ouverts restent exclus jusqu’à décision admin.',
      unresolvedConflicts.length,
      0,
    ),
    check(
      'massif-curation',
      withoutMassif.length === 0 ? 'PASS' : 'WARN',
      'Les sommets matérialisés sans massif nécessitent une curation.',
      withoutMassif.length,
      0,
    ),
    check(
      'publication-curation',
      hiddenOrNotReady.length === 0 ? 'PASS' : 'WARN',
      'Les sommets importés non-REFERENCE mais masqués ou non prêts doivent être justifiés par la curation.',
      hiddenOrNotReady.length,
      0,
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    status: checks.some(({ status }) => status === 'FAIL')
      ? ('BLOCKED' as const)
      : ('PASS' as const),
    importRun: {
      id: input.id,
      status: input.status,
      provider: input.provider,
      scope: input.scope,
      departmentCode: department.departmentCode,
      departmentSlug: department.geoAreaSlug,
      sourceVersion: input.sourceVersion,
      sourceChecksum: input.sourceChecksum,
    },
    counts: {
      source: input.sourceCount,
      totalCandidates: input.candidateCount,
      core: tiers.CORE,
      secondary: tiers.SECONDARY,
      reference: tiers.REFERENCE,
      creations: input.candidates.filter(isCreation).length,
      matches: input.candidates.filter(isMatch).length,
      historicalConflicts: input.conflictCount,
      unresolvedConflicts: unresolvedConflicts.length,
      rejected: input.rejectedCount,
      withoutAltitude: withoutAltitudeCount,
      withoutCoordinates: withoutCoordinatesCount,
      summitsWithoutMassif: withoutMassif.length,
      homonymGroups: homonymGroupsCount,
      homonymCandidates: homonymCandidatesCount,
      unexplainedGaps: input.errorCount,
      finalMaterialized: materializedSummits.size,
      finalPublished: publishedSummits.length,
      finalExcludedAsReference: unpublishedReferences.length,
      finalHiddenOrNotReady: hiddenOrNotReady.length,
    },
    candidateStatuses,
    checks,
    anomalies: {
      importedWithoutSummit: importedWithoutSummit.map(({ id }) => id),
      missingExternalReferences: missingExternalReferences.map(({ id }) => id),
      publishedOutsideScope: outsideScope.map(({ id }) => id),
      publishedReferences: publishedReferences.map(({ id }) => id),
      invalidCoordinates: withoutCoordinates.map(({ id }) => id),
    },
  };
}

export async function runSummitImportQa(
  prisma: PrismaClient,
  importRunId: string,
  reportPath?: string,
) {
  const run = await prisma.summitImportRun.findUnique({
    where: { id: importRunId },
    include: {
      candidates: {
        orderBy: { createdAt: 'asc' },
        include: {
          matchedSummit: {
            select: {
              id: true,
              catalogStatus: true,
              catalogTier: true,
              isActive: true,
              primaryMassifId: true,
              geoAreas: { select: { geoArea: { select: { slug: true } } } },
              externalReferences: {
                select: { provider: true, externalId: true },
              },
            },
          },
        },
      },
    },
  });
  if (!run) throw new Error('ImportRun introuvable');
  const report = buildSummitImportQaReport(run);
  if (reportPath) {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  return report;
}
