import {
  decodePolyline,
  detectSummits,
  findSummitDetectionCandidates,
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
  closestRouteAltitude: number | null = 950,
) {
  return detectSummits(
    {
      title: 'Sortie du dimanche',
      routePolyline: ROUTE,
    },
    [summit],
    closestRouteAltitude === null
      ? new Map()
      : new Map([
          [
            summit.id,
            {
              altitude: closestRouteAltitude,
              source: 'IGN_RGE_ALTI' as const,
            },
          ],
        ]),
  );
}

function localAltitude(summitId: string, altitude: number) {
  return new Map([[summitId, { altitude, source: 'IGN_RGE_ALTI' as const }]]);
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
      closestRouteAltitude: 950,
      altitudeSource: 'IGN_RGE_ALTI',
    });
    expect(match.closestDistance).toBe(0);
    expect(match).toMatchObject({
      routePointCount: 3,
      nearbyPointCount: 1,
      detectionVersion: 4,
    });
  });

  it('requests elevation at the same route point used for horizontal distance', () => {
    const [candidate] = findSummitDetectionCandidates(
      { title: null, routePolyline: ROUTE },
      [makeSummit({ latitude: 38.501 })],
    );

    expect(candidate.closestPoint).toEqual({ lat: 38.5, lng: -120.2 });
    expect(candidate.closestDistance).toBeGreaterThan(100);
    expect(candidate.closestDistance).toBeLessThan(120);
  });

  it('keeps a named but distant trace pending instead of confirming it', () => {
    const [match] = detectSummits(
      {
        title: 'Sommet test au lever du jour',
        routePolyline: ROUTE,
      },
      [makeSummit({ latitude: 38.5035 })],
      localAltitude('test-summit', 1_050),
    );

    expect(match.closestDistance).toBeGreaterThan(250);
    expect(match.closestDistance).toBeLessThanOrEqual(500);
    expect(match.autoConfirmed).toBe(false);
  });

  it('does not detect an unnamed trace outside the physical summit radius', () => {
    expect(detect(makeSummit({ latitude: 38.504 }))).toEqual([]);
  });

  it('keeps an unnamed trace between 100 and 250 metres pending', () => {
    const [match] = detect(makeSummit({ latitude: 38.5015 }));

    expect(match.closestDistance).toBeGreaterThan(100);
    expect(match.closestDistance).toBeLessThanOrEqual(250);
    expect(match.autoConfirmed).toBe(false);
  });

  it('offers an altitude-compatible passage between 250 and 400 metres for confirmation', () => {
    const [match] = detect(makeSummit({ latitude: 38.5027 }));

    expect(match.closestDistance).toBeGreaterThan(250);
    expect(match.closestDistance).toBeLessThanOrEqual(400);
    expect(match.altitudeMatched).toBe(true);
    expect(match.autoConfirmed).toBe(false);
    expect(match.detectionVersion).toBe(4);
  });

  it('keeps the real Vélan near-miss profile pending at 253 metres', () => {
    const [match] = detectSummits(
      {
        title: 'EP44 - Reco trail de Faverges avec le Maxence 🏔️',
        routePolyline: ROUTE,
      },
      [
        makeSummit({
          id: 'pointe-du-velan',
          name: 'Pointe du Vélan',
          altitude: 1_746,
          latitude: 38.502275,
        }),
      ],
      localAltitude('pointe-du-velan', 1_758),
    );

    expect(match).toMatchObject({
      summitId: 'pointe-du-velan',
      closestDistance: 253,
      altitudeMatched: true,
      autoConfirmed: false,
      detectionVersion: 4,
    });
  });

  it('keeps a named summit between 100 and 250 metres pending', () => {
    const [match] = detectSummits(
      {
        title: 'Sommet test au lever du jour',
        routePolyline: ROUTE,
      },
      [makeSummit({ latitude: 38.5015 })],
      localAltitude('test-summit', 1_050),
    );

    expect(match.titleMatched).toBe(true);
    expect(match.autoConfirmed).toBe(false);
  });

  it('rejects a trace whose closest point did not reach the summit altitude', () => {
    expect(detect(makeSummit(), 800)).toEqual([]);
  });

  it('does not reuse an activity maximum reached elsewhere on a long route', () => {
    const summit = makeSummit();

    expect(
      detectSummits(
        { title: 'Longue traversée', routePolyline: ROUTE },
        [summit],
        localAltitude(summit.id, 800),
      ),
    ).toEqual([]);
  });

  it('does not treat a route to the foot of a summit as a title match', () => {
    expect(
      detectSummits(
        {
          title: 'Trail au pied du Sommet test',
          routePolyline: ROUTE,
        },
        [makeSummit({ latitude: 38.5051 })],
        localAltitude('test-summit', 1_050),
      ),
    ).toEqual([]);
  });

  it('does not treat a refuge carrying the summit name as title evidence', () => {
    expect(
      detectSummits(
        {
          title: 'Trail au refuge du Sommet test',
          routePolyline: ROUTE,
        },
        [makeSummit({ latitude: 38.5051 })],
        localAltitude('test-summit', 1_050),
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
      localAltitude('velan', 1_020),
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
      detectSummits({ title: null, routePolyline: '_' }, [makeSummit()]),
    ).toEqual([]);
  });
});
