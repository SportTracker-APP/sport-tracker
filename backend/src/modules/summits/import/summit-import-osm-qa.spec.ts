import type { NormalizedIgnSummit } from './summit-import.types';
import { compareIgnSummitsWithOsmPeaks } from './summit-import-osm-qa';

function candidate(
  overrides: Partial<NormalizedIgnSummit> = {},
): NormalizedIgnSummit {
  return {
    externalId: 'IGN-1',
    name: "Aiguille d'Argentière",
    normalizedName: 'aiguille d argentiere',
    aliases: [],
    latitude: 45.96039571241734,
    longitude: 7.017572212622008,
    elevation: 3794,
    sourceNature: 'Pic',
    sourceVersion: '2026-06-15',
    boundaryReview: false,
    boundaryDistanceMeters: 0,
    sourceProperties: { PREC_PLANI: 30 },
    ...overrides,
  };
}

describe('compareIgnSummitsWithOsmPeaks', () => {
  it('flags a named IGN toponym point that is away from the OSM peak', () => {
    const comparison = compareIgnSummitsWithOsmPeaks(
      [candidate()],
      [
        {
          osmType: 'node',
          osmId: 290497894,
          name: "Aiguille d'Argentière",
          latitude: 45.959721,
          longitude: 7.020211,
          elevation: 3901,
        },
      ],
    );

    expect(comparison.matchedByName).toBe(1);
    expect(comparison.matches).toEqual([
      expect.objectContaining({
        distanceMeters: 217,
        sourcePrecisionMeters: 30,
        altitudeDeltaMeters: 107,
        positionReviewRequired: true,
        altitudeReviewRequired: true,
      }),
    ]);
  });

  it('keeps a close position below the review thresholds', () => {
    const comparison = compareIgnSummitsWithOsmPeaks(
      [
        candidate({
          externalId: 'IGN-2',
          name: 'la Tournette',
          normalizedName: 'la tournette',
          latitude: 45.82717489966426,
          longitude: 6.286153613976949,
          elevation: 2326,
        }),
      ],
      [
        {
          osmType: 'node',
          osmId: 26863492,
          name: 'La Tournette',
          latitude: 45.8270873,
          longitude: 6.2861465,
          elevation: 2351,
        },
      ],
    );

    expect(comparison.matches[0]).toEqual(
      expect.objectContaining({
        distanceMeters: 10,
        altitudeDeltaMeters: 25,
        positionReviewRequired: false,
        altitudeReviewRequired: false,
      }),
    );
  });

  it('selects the nearest same-name candidate instead of source order', () => {
    const comparison = compareIgnSummitsWithOsmPeaks(
      [
        candidate({ externalId: 'FAR', latitude: 45.95, longitude: 7.01 }),
        candidate({
          externalId: 'NEAR',
          latitude: 45.95972,
          longitude: 7.0202,
        }),
      ],
      [
        {
          osmType: 'node',
          osmId: 290497894,
          name: "Aiguille d'Argentière",
          latitude: 45.959721,
          longitude: 7.020211,
          elevation: 3901,
        },
      ],
    );

    expect(comparison.matches[0]?.ignExternalId).toBe('NEAR');
  });
});
