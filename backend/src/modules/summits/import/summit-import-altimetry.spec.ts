import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { enrichCandidatesWithIgnAltitude } from './summit-import-altimetry';
import type { NormalizedIgnSummit } from './summit-import.types';

function candidate(
  externalId: string,
  longitude: number,
  latitude: number,
): NormalizedIgnSummit {
  return {
    externalId,
    name: `Sommet ${externalId}`,
    normalizedName: `sommet ${externalId}`,
    aliases: [],
    latitude,
    longitude,
    elevation: null,
    sourceNature: 'Sommet',
    sourceVersion: '2026-06-15',
    boundaryReview: false,
    boundaryDistanceMeters: 100,
    sourceProperties: {},
  };
}

describe('IGN altitude enrichment', () => {
  it('uses the official POST contract and reuses its local cache', async () => {
    const cacheDirectory = await mkdtemp(
      path.join(tmpdir(), 'hovren-altimetry-test-'),
    );
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        elevations: [
          { lon: 6.1, lat: 45.1, z: 1_234.4 },
          { lon: 6.2, lat: 45.2, z: 2_345.6 },
        ],
      }),
    });
    global.fetch = fetchMock;

    try {
      const input = {
        candidates: [
          candidate('ign-1', 6.1, 45.1),
          candidate('ign-2', 6.2, 45.2),
        ],
        cacheDirectory,
        sourceVersion: '2026-06-15',
      };

      await expect(enrichCandidatesWithIgnAltitude(input)).resolves.toEqual([
        expect.objectContaining({ externalId: 'ign-1', elevation: 1_234 }),
        expect.objectContaining({ externalId: 'ign-2', elevation: 2_346 }),
      ]);
      await enrichCandidatesWithIgnAltitude(input);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(request.method).toBe('POST');
      expect(JSON.parse(request.body as string)).toEqual({
        lon: '6.1|6.2',
        lat: '45.1|45.2',
        resource: 'ign_rge_alti_wld',
        delimiter: '|',
        indent: 'false',
        measures: 'false',
        zonly: 'false',
      });
    } finally {
      global.fetch = originalFetch;
      await rm(cacheDirectory, { recursive: true, force: true });
    }
  });
});
