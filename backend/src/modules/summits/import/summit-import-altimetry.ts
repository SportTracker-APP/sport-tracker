import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import {
  IGN_ALTIMETRY_MAX_POINTS_PER_REQUEST,
  IGN_ALTIMETRY_RESOURCE,
  IGN_ALTIMETRY_URL,
} from './summit-import.constants';
import type { NormalizedIgnSummit } from './summit-import.types';

const elevationResponseSchema = z.object({
  elevations: z.array(
    z.object({
      lon: z.number(),
      lat: z.number(),
      z: z.number(),
    }),
  ),
});

const altitudeCacheSchema = z.record(z.string(), z.number().int().positive());

async function readCache(cachePath: string) {
  try {
    return altitudeCacheSchema.parse(
      JSON.parse(await readFile(cachePath, 'utf8')) as unknown,
    );
  } catch {
    return {};
  }
}

async function fetchElevationBatch(candidates: NormalizedIgnSummit[]) {
  const body = JSON.stringify({
    lon: candidates.map(({ longitude }) => longitude.toString()).join('|'),
    lat: candidates.map(({ latitude }) => latitude.toString()).join('|'),
    resource: IGN_ALTIMETRY_RESOURCE,
    delimiter: '|',
    indent: 'false',
    measures: 'false',
    zonly: 'false',
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(IGN_ALTIMETRY_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`IGN altimétrie HTTP ${response.status}`);
      }

      const parsed = elevationResponseSchema.parse(await response.json());
      if (parsed.elevations.length !== candidates.length) {
        throw new Error('Nombre d’altitudes IGN incohérent');
      }

      return parsed.elevations.map(({ z }) =>
        z === -99999 || !Number.isFinite(z) ? null : Math.round(z),
      );
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('Service altimétrique IGN indisponible');
}

export async function enrichCandidatesWithIgnAltitude(input: {
  candidates: NormalizedIgnSummit[];
  cacheDirectory: string;
  sourceVersion: string;
}) {
  await mkdir(input.cacheDirectory, { recursive: true });
  const cachePath = path.join(
    input.cacheDirectory,
    `ign-rge-alti-${input.sourceVersion}.json`,
  );
  const cache = await readCache(cachePath);
  const missing = input.candidates.filter(
    (candidate) => cache[candidate.externalId] === undefined,
  );

  for (
    let offset = 0;
    offset < missing.length;
    offset += IGN_ALTIMETRY_MAX_POINTS_PER_REQUEST
  ) {
    const batch = missing.slice(
      offset,
      offset + IGN_ALTIMETRY_MAX_POINTS_PER_REQUEST,
    );
    const elevations = await fetchElevationBatch(batch);

    batch.forEach((candidate, index) => {
      const elevation = elevations[index];
      if (elevation !== null && elevation > 0) {
        cache[candidate.externalId] = elevation;
      }
    });

    if (offset + batch.length < missing.length) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');

  return input.candidates.map((candidate) => ({
    ...candidate,
    elevation: cache[candidate.externalId] ?? null,
  }));
}
