import {
  getSummitDataQuality,
  getSummitPublicationQuality,
} from './summit-data-quality';

describe('getSummitDataQuality', () => {
  it('reports a complete summit', () => {
    expect(
      getSummitDataQuality({
        id: 'la-tournette',
        name: 'La Tournette',
        altitude: 2351,
        latitude: 45.827,
        longitude: 6.287,
        primaryMassifId: 'bornes',
        geoAreaCount: 4,
      }),
    ).toEqual({ isComplete: true, missingCount: 0, missing: [] });
  });

  it('lists only the important missing information', () => {
    const quality = getSummitDataQuality({
      id: 'summit-draft',
      name: 'Sommet brouillon',
      altitude: 0,
      latitude: 46,
      longitude: 6,
      primaryMassifId: null,
      geoAreaCount: 0,
    });

    expect(quality.isComplete).toBe(false);
    expect(quality.missing.map(({ code }) => code)).toEqual([
      'MISSING_ALTITUDE',
      'MISSING_GEO_AREA',
      'MISSING_PRIMARY_MASSIF',
    ]);
  });

  it('allows publication without a primary massif when a territory is reliable', () => {
    const quality = getSummitPublicationQuality({
      id: 'pointe-fiable',
      name: 'Pointe fiable',
      altitude: 2140,
      latitude: 46,
      longitude: 6,
      primaryMassifId: null,
      geoAreaCount: 3,
    });

    expect(quality.isComplete).toBe(false);
    expect(quality.isPublishable).toBe(true);
    expect(quality.blocking).toEqual([]);
  });

  it('still refuses publication when essential coordinates are invalid', () => {
    const quality = getSummitPublicationQuality({
      id: 'pointe-invalide',
      name: 'Pointe invalide',
      altitude: 2140,
      latitude: 120,
      longitude: 6,
      primaryMassifId: null,
      geoAreaCount: 3,
    });

    expect(quality.isPublishable).toBe(false);
    expect(quality.blocking.map(({ code }) => code)).toEqual([
      'MISSING_COORDINATES',
    ]);
  });
});
