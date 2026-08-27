import {
  osmNameMatchRequiresPositionReview,
  selectCanonicalSummitLocation,
} from './summit-canonical-location';

const candidate = {
  latitude: 45.842,
  longitude: 6.259,
  elevation: 1768,
};

describe('canonical summit location', () => {
  it('uses a nearby named OSM peak instead of the IGN toponym point', () => {
    expect(
      selectCanonicalSummitLocation(candidate, {
        osmMatched: true,
        osmMatchMethod: 'NAME',
        osmDistanceMeters: 217,
        osmLatitude: 45.959721,
        osmLongitude: 7.020211,
        osmElevation: 3901,
      }),
    ).toEqual({
      latitude: 45.959721,
      longitude: 7.020211,
      elevation: 3901,
      source: 'OSM',
    });
  });

  it('keeps the IGN point when a same-name peak is too far away', () => {
    const signals = {
      osmMatched: true,
      osmMatchMethod: 'NAME' as const,
      osmDistanceMeters: 954,
      osmLatitude: 45.9276121,
      osmLongitude: 6.3506791,
      osmElevation: 2023,
    };

    expect(selectCanonicalSummitLocation(candidate, signals)).toEqual({
      ...candidate,
      source: 'IGN',
    });
    expect(osmNameMatchRequiresPositionReview(signals)).toBe(true);
  });

  it('accepts a positional OSM match only inside the strict radius', () => {
    expect(
      selectCanonicalSummitLocation(candidate, {
        osmMatched: true,
        osmMatchMethod: 'POSITION',
        osmDistanceMeters: 81,
        osmLatitude: 45.85,
        osmLongitude: 6.25,
        osmElevation: null,
      }).source,
    ).toBe('IGN');
  });
});
