import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import {
  IGN_ALTIMETRY_MAX_POINTS_PER_REQUEST,
  IGN_ALTIMETRY_RESOURCE,
  IGN_ALTIMETRY_URL,
} from './import/summit-import.constants';
import type {
  SummitDetectionCandidate,
  SummitLocalAltitudeEvidence,
} from './summit-detection';

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 2;

const elevationResponseSchema = z.object({
  elevations: z.array(
    z.object({
      z: z.number(),
    }),
  ),
});

@Injectable()
export class SummitElevationService {
  async getLocalAltitudes(
    candidates: SummitDetectionCandidate[],
  ): Promise<Map<string, SummitLocalAltitudeEvidence>> {
    const elevations = new Map<string, SummitLocalAltitudeEvidence>();

    for (
      let offset = 0;
      offset < candidates.length;
      offset += IGN_ALTIMETRY_MAX_POINTS_PER_REQUEST
    ) {
      const batch = candidates.slice(
        offset,
        offset + IGN_ALTIMETRY_MAX_POINTS_PER_REQUEST,
      );
      const batchElevations = await this.fetchElevationBatch(batch);

      batch.forEach((candidate, index) => {
        const altitude = batchElevations[index];
        if (altitude !== null && altitude > 0) {
          elevations.set(candidate.summit.id, {
            altitude,
            source: 'IGN_RGE_ALTI',
          });
        }
      });
    }

    return elevations;
  }

  private async fetchElevationBatch(
    candidates: SummitDetectionCandidate[],
  ): Promise<Array<number | null>> {
    if (candidates.length === 0) {
      return [];
    }

    const body = JSON.stringify({
      lon: candidates
        .map(({ closestPoint }) => closestPoint.lng.toString())
        .join('|'),
      lat: candidates
        .map(({ closestPoint }) => closestPoint.lat.toString())
        .join('|'),
      resource: IGN_ALTIMETRY_RESOURCE,
      delimiter: '|',
      indent: 'false',
      measures: 'false',
      zonly: 'false',
    });

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

        return parsed.elevations.map(({ z: altitude }) =>
          altitude === -99999 || !Number.isFinite(altitude)
            ? null
            : Math.round(altitude),
        );
      } catch (error) {
        if (attempt === MAX_ATTEMPTS) {
          throw error;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error('Service altimétrique IGN indisponible');
  }
}
