import {
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitExternalProvider,
  SummitImportCandidateStatus,
  SummitImportRunStatus,
} from '@prisma/client';

import {
  buildSummitImportQaReport,
  type SummitImportQaCandidate,
  type SummitImportQaInput,
} from './summit-import-qa';

function candidate(
  overrides: Partial<SummitImportQaCandidate> = {},
): SummitImportQaCandidate {
  return {
    id: 'candidate-1',
    externalId: 'ign-1',
    normalizedName: 'sommet test',
    latitude: 45.9,
    longitude: 6.1,
    elevation: 2_000,
    status: SummitImportCandidateStatus.IMPORTED,
    catalogTier: SummitCatalogTier.CORE,
    isLegacyMatch: false,
    homonymGroupSize: 1,
    resolutionAction: null,
    matchedSummitId: 'summit-1',
    matchedSummit: {
      id: 'summit-1',
      catalogStatus: SummitCatalogStatus.READY,
      catalogTier: SummitCatalogTier.CORE,
      isActive: true,
      primaryMassifId: 'massif-1',
      geoAreas: [{ geoArea: { slug: 'haute-savoie' } }],
      externalReferences: [
        {
          provider: SummitExternalProvider.IGN_BD_TOPO,
          externalId: 'ign-1',
        },
      ],
    },
    ...overrides,
  };
}

function run(
  candidates: SummitImportQaCandidate[],
  overrides: Partial<SummitImportQaInput> = {},
): SummitImportQaInput {
  return {
    id: 'run-74',
    provider: SummitExternalProvider.IGN_BD_TOPO,
    scope: 'D074',
    sourceVersion: '2026-06-15',
    sourceChecksum: 'efa8b87b3751e737d90895e494f875f7',
    status: SummitImportRunStatus.PUBLISHED,
    sourceCount: candidates.length,
    candidateCount: candidates.length,
    conflictCount: 0,
    rejectedCount: 0,
    errorCount: 0,
    preflightReport: {
      counts: {
        withoutAltitude: 0,
        withoutCoordinates: 0,
        homonymGroups: 0,
        homonymCandidates: 0,
      },
    },
    candidates,
    ...overrides,
  };
}

describe('summit import post-apply QA', () => {
  it('reports a coherent published departmental import', () => {
    const report = buildSummitImportQaReport(run([candidate()]));

    expect(report.status).toBe('PASS');
    expect(report.counts).toMatchObject({
      totalCandidates: 1,
      core: 1,
      secondary: 0,
      reference: 0,
      creations: 1,
      matches: 0,
      finalMaterialized: 1,
      finalPublished: 1,
      finalExcludedAsReference: 0,
      finalHiddenOrNotReady: 0,
      unexplainedGaps: 0,
    });
    expect(report.checks.every(({ status }) => status === 'PASS')).toBe(true);
  });

  it('blocks unexplained accounting and a published summit outside scope', () => {
    const badCandidate = candidate({
      matchedSummit: {
        ...candidate().matchedSummit!,
        geoAreas: [{ geoArea: { slug: 'savoie' } }],
        externalReferences: [],
      },
    });
    const report = buildSummitImportQaReport(
      run([badCandidate], { candidateCount: 2, errorCount: 1 }),
    );

    expect(report.status).toBe('BLOCKED');
    expect(
      report.checks
        .filter(({ status }) => status === 'FAIL')
        .map(({ id }) => id),
    ).toEqual(
      expect.arrayContaining([
        'candidate-accounting',
        'tier-accounting',
        'unexplained-gaps',
        'external-references',
        'published-scope',
      ]),
    );
  });

  it('warns without blocking unresolved conflicts and massif curation', () => {
    const unresolved = candidate({
      id: 'conflict-1',
      externalId: 'ign-conflict',
      status: SummitImportCandidateStatus.CONFLICT,
      matchedSummitId: null,
      matchedSummit: null,
    });
    const noMassif = candidate({
      matchedSummit: { ...candidate().matchedSummit!, primaryMassifId: null },
    });
    const report = buildSummitImportQaReport(
      run([unresolved, noMassif], { conflictCount: 1 }),
    );

    expect(report.status).toBe('PASS');
    expect(report.counts.unresolvedConflicts).toBe(1);
    expect(report.counts.summitsWithoutMassif).toBe(1);
    expect(
      report.checks
        .filter(({ status }) => status === 'WARN')
        .map(({ id }) => id),
    ).toEqual(
      expect.arrayContaining(['unresolved-conflicts', 'massif-curation']),
    );
  });
});
