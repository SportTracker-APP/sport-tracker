import { SummitElevationService } from './summit-elevation.service';
import type { SummitDetectionCandidate } from './summit-detection';

function candidate(
  id: string,
  lat: number,
  lng: number,
): SummitDetectionCandidate {
  return {
    summit: {
      id,
      name: id,
      aliases: [],
      altitude: 1_000,
      latitude: lat,
      longitude: lng,
    },
    closestPoint: { lat, lng },
    closestDistance: 12,
    titleMatched: false,
    routePointCount: 3,
    nearbyPointCount: 1,
  };
}

describe('SummitElevationService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps IGN terrain elevations to the matching closest trace points', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          elevations: [
            { lon: 6.1, lat: 45.9, z: 1_742.4 },
            { lon: 6.2, lat: 45.8, z: -99999 },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await new SummitElevationService().getLocalAltitudes([
      candidate('velan', 45.9, 6.1),
      candidate('border-summit', 45.8, 6.2),
    ]);

    expect(result).toEqual(
      new Map([['velan', { altitude: 1_742, source: 'IGN_RGE_ALTI' }]]),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const request = fetchSpy.mock.calls[0];
    expect(request?.[1]?.method).toBe('POST');
    const requestBody = request?.[1]?.body;
    expect(typeof requestBody).toBe('string');
    expect(requestBody).toContain('6.1|6.2');
  });

  it('does not call IGN when no summit is horizontally eligible', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(
      new SummitElevationService().getLocalAltitudes([]),
    ).resolves.toEqual(new Map());
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
