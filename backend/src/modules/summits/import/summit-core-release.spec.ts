import {
  SummitCatalogTier,
  SummitImportCandidateStatus,
  SummitImportResolutionAction,
} from '@prisma/client';

import { buildCoreReleasePreview } from './summit-import-runner';

type Candidate = Parameters<typeof buildCoreReleasePreview>[0][number];

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'candidate-1',
    name: 'Pointe fiable',
    latitude: 46,
    longitude: 6,
    elevation: 2140,
    status: SummitImportCandidateStatus.READY,
    catalogTier: SummitCatalogTier.CORE,
    resolutionAction: null,
    matchedSummitId: null,
    matchedSummit: null,
    ...overrides,
  };
}

describe('CORE release preview', () => {
  it('allows a complete CORE without primary massif', () => {
    expect(buildCoreReleasePreview([candidate()])).toEqual({
      coreCandidates: 1,
      coreEligible: 1,
      coreExcludedForConflict: 0,
      coreExcludedForInvalidData: 0,
      coreLegacyMatched: 0,
      coreNew: 1,
      withoutPrimaryMassif: 1,
      withPrimaryMassif: 0,
      plannedCreations: 1,
      plannedMatches: 0,
    });
  });

  it('excludes an unresolved CORE conflict without blocking the safe lot', () => {
    const preview = buildCoreReleasePreview([
      candidate(),
      candidate({
        id: 'conflict-1',
        status: SummitImportCandidateStatus.CONFLICT,
      }),
    ]);

    expect(preview.coreCandidates).toBe(2);
    expect(preview.coreEligible).toBe(1);
    expect(preview.coreExcludedForConflict).toBe(1);
  });

  it('includes an explicitly resolved legacy match and preserves its target', () => {
    const preview = buildCoreReleasePreview([
      candidate({
        status: SummitImportCandidateStatus.CONFLICT,
        resolutionAction: SummitImportResolutionAction.MATCH_EXISTING,
        matchedSummitId: 'legacy-summit',
        matchedSummit: { primaryMassifId: 'aravis' },
      }),
    ]);

    expect(preview.coreEligible).toBe(1);
    expect(preview.coreLegacyMatched).toBe(1);
    expect(preview.withPrimaryMassif).toBe(1);
  });

  it('refuses a CORE with invalid coordinates', () => {
    const preview = buildCoreReleasePreview([candidate({ latitude: 120 })]);

    expect(preview.coreEligible).toBe(0);
    expect(preview.coreExcludedForInvalidData).toBe(1);
  });

  it('never imports SECONDARY or REFERENCE in the CORE release', () => {
    const preview = buildCoreReleasePreview([
      candidate({ catalogTier: SummitCatalogTier.SECONDARY }),
      candidate({ catalogTier: SummitCatalogTier.REFERENCE }),
    ]);

    expect(preview.coreCandidates).toBe(0);
    expect(preview.coreEligible).toBe(0);
  });
});
