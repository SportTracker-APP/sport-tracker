import type {
  ExistingSummitForMatch,
  NormalizedIgnSummit,
} from './summit-import.types';
import { matchIgnCandidate } from './summit-import-matcher';

function candidate(
  overrides: Partial<NormalizedIgnSummit> = {},
): NormalizedIgnSummit {
  return {
    externalId: 'ign-1',
    name: 'Aiguille du Midi',
    normalizedName: 'aiguille du midi',
    aliases: [],
    latitude: 45.879,
    longitude: 6.887,
    elevation: 3842,
    sourceNature: 'Sommet',
    sourceVersion: '2026-06-15',
    boundaryReview: false,
    boundaryDistanceMeters: 2_000,
    sourceProperties: {},
    ...overrides,
  };
}

function summit(
  overrides: Partial<ExistingSummitForMatch> = {},
): ExistingSummitForMatch {
  return {
    id: 'legacy-aiguille-du-midi',
    name: 'Aiguille du Midi',
    aliases: [],
    latitude: 45.879,
    longitude: 6.887,
    altitude: 3842,
    externalReferences: [],
    ...overrides,
  };
}

describe('IGN summit matching', () => {
  it('matches an existing external reference before all heuristic checks', () => {
    const result = matchIgnCandidate(candidate({ boundaryReview: true }), [
      summit({
        externalReferences: [{ provider: 'IGN_BD_TOPO', externalId: 'ign-1' }],
      }),
    ]);

    expect(result).toMatchObject({
      status: 'MATCHED',
      matchedSummitId: 'legacy-aiguille-du-midi',
      reason: 'Référence externe IGN identique',
    });
  });

  it('matches a legacy summit only when name, position and altitude agree', () => {
    expect(matchIgnCandidate(candidate(), [summit()])).toMatchObject({
      status: 'MATCHED',
      matchedSummitId: 'legacy-aiguille-du-midi',
    });
  });

  it('does not merge two distant summits sharing the same name', () => {
    const result = matchIgnCandidate(candidate(), [
      summit({ latitude: 46.2, longitude: 7.2 }),
    ]);

    expect(result).toMatchObject({ status: 'READY', matchedSummitId: null });
  });

  it('keeps a nearby namesake out of automatic import when legacy coordinates may be approximate', () => {
    const result = matchIgnCandidate(candidate(), [
      summit({ latitude: 45.897, longitude: 6.884 }),
    ]);

    expect(result).toMatchObject({
      status: 'CONFLICT',
      matchedSummitId: 'legacy-aiguille-du-midi',
    });
  });

  it('sends a close positional match with a different name to review', () => {
    const result = matchIgnCandidate(candidate(), [
      summit({ id: 'legacy-other', name: 'Pointe voisine' }),
    ]);

    expect(result).toMatchObject({
      status: 'CONFLICT',
      matchedSummitId: 'legacy-other',
      reason: 'Sommet historique très proche mais nom différent',
    });
  });

  it('never silently imports a boundary candidate', () => {
    const result = matchIgnCandidate(
      candidate({ boundaryReview: true, boundaryDistanceMeters: 4.2 }),
      [],
    );

    expect(result).toMatchObject({ status: 'CONFLICT' });
    expect(result.reason).toContain('frontalier');
  });

  it('rejects a candidate whose official altitude enrichment failed', () => {
    expect(matchIgnCandidate(candidate({ elevation: null }), [])).toMatchObject(
      { status: 'REJECTED' },
    );
  });

  it('makes repeated matching idempotent once the external reference exists', () => {
    const existing = summit({
      externalReferences: [{ provider: 'IGN_BD_TOPO', externalId: 'ign-1' }],
    });

    expect(matchIgnCandidate(candidate(), [existing])).toEqual(
      matchIgnCandidate(candidate(), [existing]),
    );
  });
});
