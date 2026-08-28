import {
  decodePolyline,
  detectSummits,
  type GeoPoint,
  type SummitDetectionTarget,
} from './summit-detection';

const ROUTE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

function makeSummit(
  overrides: Partial<SummitDetectionTarget> = {},
): SummitDetectionTarget {
  return {
    id: 'test-summit',
    name: 'Sommet test',
    aliases: [],
    altitude: 1_000,
    latitude: 38.5,
    longitude: -120.2,
    ...overrides,
  };
}

function detect(
  summit: SummitDetectionTarget,
  maxAltitude: number | null = 950,
) {
  return detectSummits(
    {
      title: 'Sortie du dimanche',
      maxAltitude,
      routePolyline: ROUTE,
    },
    [summit],
  );
}

describe('summit detection', () => {
  it('decodes a valid encoded polyline', () => {
    expect(decodePolyline(ROUTE)[0]).toEqual<GeoPoint>({
      lat: 38.5,
      lng: -120.2,
    });
  });

  it('automatically confirms a close trace with a compatible altitude', () => {
    const [match] = detect(makeSummit());

    expect(match).toMatchObject({
      summitId: 'test-summit',
      altitudeMatched: true,
      autoConfirmed: true,
    });
    expect(match.closestDistance).toBe(0);
    expect(match).toMatchObject({
      routePointCount: 3,
      nearbyPointCount: 1,
      detectionVersion: 2,
    });
  });

  it('keeps a named but distant trace pending instead of confirming it', () => {
    const [match] = detectSummits(
      {
        title: 'Sommet test au lever du jour',
        maxAltitude: 1_050,
        routePolyline: ROUTE,
      },
      [makeSummit({ latitude: 38.5035 })],
    );

    expect(match.closestDistance).toBeGreaterThan(250);
    expect(match.closestDistance).toBeLessThanOrEqual(500);
    expect(match.autoConfirmed).toBe(false);
  });

  it('does not detect an unnamed trace outside the physical summit radius', () => {
    expect(detect(makeSummit({ latitude: 38.5035 }))).toEqual([]);
  });

  it('keeps an unnamed trace between 100 and 250 metres pending', () => {
    const [match] = detect(makeSummit({ latitude: 38.5015 }));

    expect(match.closestDistance).toBeGreaterThan(100);
    expect(match.closestDistance).toBeLessThanOrEqual(250);
    expect(match.autoConfirmed).toBe(false);
  });

  it('keeps a named summit between 100 and 250 metres pending', () => {
    const [match] = detectSummits(
      {
        title: 'Sommet test au lever du jour',
        maxAltitude: 1_050,
        routePolyline: ROUTE,
      },
      [makeSummit({ latitude: 38.5015 })],
    );

    expect(match.titleMatched).toBe(true);
    expect(match.autoConfirmed).toBe(false);
  });

  it('rejects a trace that did not reach the summit altitude', () => {
    expect(detect(makeSummit(), 800)).toEqual([]);
  });

  it('does not treat a route to the foot of a summit as a title match', () => {
    expect(
      detectSummits(
        {
          title: 'Trail au pied du Sommet test',
          maxAltitude: 1_050,
          routePolyline: ROUTE,
        },
        [makeSummit({ latitude: 38.5051 })],
      ),
    ).toEqual([]);
  });

  it('does not treat a refuge carrying the summit name as title evidence', () => {
    expect(
      detectSummits(
        {
          title: 'Trail au refuge du Sommet test',
          maxAltitude: 1_050,
          routePolyline: ROUTE,
        },
        [makeSummit({ latitude: 38.5051 })],
      ),
    ).toEqual([]);
  });

  it('requires very close proximity when altitude data is unavailable', () => {
    expect(detect(makeSummit({ latitude: 38.502 }), null)).toEqual([]);
    expect(detect(makeSummit(), null)[0]).toMatchObject({
      altitudeMatched: true,
      autoConfirmed: false,
    });
  });

  it('creates one decision when a user stays around the summit', () => {
    const matches = detectSummits(
      {
        title: 'Test terrain du Vélan',
        maxAltitude: 1_020,
        routePolyline: '????????',
      },
      [
        makeSummit({
          id: 'velan',
          name: 'Le Vélan',
          latitude: 0,
          longitude: 0,
        }),
      ],
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      summitId: 'velan',
      autoConfirmed: true,
      routePointCount: 4,
      nearbyPointCount: 4,
    });
  });

  it('ignores malformed polylines without throwing', () => {
    expect(decodePolyline('_')).toEqual([]);
    expect(
      detectSummits({ title: null, maxAltitude: null, routePolyline: '_' }, [
        makeSummit(),
      ]),
    ).toEqual([]);
  });
});
