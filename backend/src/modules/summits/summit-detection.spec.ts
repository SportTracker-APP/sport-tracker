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
  });

  it('keeps a lower-confidence nearby trace pending', () => {
    const [match] = detect(makeSummit({ latitude: 38.5035 }));

    expect(match.closestDistance).toBeGreaterThan(250);
    expect(match.closestDistance).toBeLessThanOrEqual(500);
    expect(match.autoConfirmed).toBe(false);
  });

  it('rejects a trace that did not reach the summit altitude', () => {
    expect(detect(makeSummit(), 800)).toEqual([]);
  });

  it('requires very close proximity when altitude data is unavailable', () => {
    expect(detect(makeSummit({ latitude: 38.502 }), null)).toEqual([]);
    expect(detect(makeSummit(), null)[0]?.autoConfirmed).toBe(true);
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
