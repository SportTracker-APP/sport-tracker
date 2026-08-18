import { readFile, writeFile } from 'node:fs/promises';

import { z } from 'zod';

import { haversineDistanceMeters } from './summit-import-matcher';
import {
  normalizeSummitNameForMatch,
  readIgnSummitSnapshot,
} from './summit-import-source';

const OSM_EXACT_NAME_MAX_DISTANCE_METERS = 1_500;
const OSM_POSITIONAL_MAX_DISTANCE_METERS = 80;

const osmElementSchema = z.object({
  type: z.enum(['node', 'way', 'relation']),
  id: z.number().int().positive(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).default({}),
});

const osmResponseSchema = z.object({
  elements: z.array(osmElementSchema),
});

type OsmPeak = {
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  name: string | null;
  latitude: number;
  longitude: number;
};

export type OsmQaReport = {
  attribution: '© OpenStreetMap contributors — ODbL 1.0';
  generatedAt: string;
  counts: {
    osmSourceElements: number;
    osmValidPeaks: number;
    matchedByName: number;
    matchedByPosition: number;
    unmatched: number;
    unnamedUnmatched: number;
  };
  unmatched: Array<
    OsmPeak & {
      nearestIgnName: string | null;
      nearestIgnDistanceMeters: number | null;
    }
  >;
};

function toOsmPeak(element: z.infer<typeof osmElementSchema>): OsmPeak | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (latitude === undefined || longitude === undefined) return null;

  const displayName = element.tags.name?.normalize('NFC').trim();
  return {
    osmType: element.type,
    osmId: element.id,
    name: displayName || null,
    latitude,
    longitude,
  };
}

export async function runOsmSummitQa(input: {
  snapshotDirectory: string;
  sourceVersion: string;
  osmSnapshotPath: string;
  reportPath?: string;
}): Promise<OsmQaReport> {
  const [ignSnapshot, osmSource] = await Promise.all([
    readIgnSummitSnapshot(input),
    readFile(input.osmSnapshotPath, 'utf8'),
  ]);
  const osmResponse = osmResponseSchema.parse(JSON.parse(osmSource) as unknown);
  const peaks = osmResponse.elements.flatMap((element) => {
    const peak = toOsmPeak(element);
    return peak ? [peak] : [];
  });
  let matchedByName = 0;
  let matchedByPosition = 0;
  const unmatched: OsmQaReport['unmatched'] = [];

  for (const peak of peaks) {
    const nearest = ignSnapshot.candidates
      .map((candidate) => ({
        candidate,
        distance: haversineDistanceMeters(
          [peak.longitude, peak.latitude],
          [candidate.longitude, candidate.latitude],
        ),
      }))
      .sort((first, second) => first.distance - second.distance)[0];
    const normalizedOsmName = peak.name
      ? normalizeSummitNameForMatch(peak.name)
      : '';
    const sameName = normalizedOsmName
      ? ignSnapshot.candidates.find(
          (candidate) =>
            [candidate.name, ...candidate.aliases].some(
              (name) => normalizeSummitNameForMatch(name) === normalizedOsmName,
            ) &&
            haversineDistanceMeters(
              [peak.longitude, peak.latitude],
              [candidate.longitude, candidate.latitude],
            ) <= OSM_EXACT_NAME_MAX_DISTANCE_METERS,
        )
      : null;

    if (sameName) {
      matchedByName += 1;
      continue;
    }
    if (nearest && nearest.distance <= OSM_POSITIONAL_MAX_DISTANCE_METERS) {
      matchedByPosition += 1;
      continue;
    }

    unmatched.push({
      ...peak,
      nearestIgnName: nearest?.candidate.name ?? null,
      nearestIgnDistanceMeters: nearest ? Math.round(nearest.distance) : null,
    });
  }

  const report: OsmQaReport = {
    attribution: '© OpenStreetMap contributors — ODbL 1.0',
    generatedAt: new Date().toISOString(),
    counts: {
      osmSourceElements: osmResponse.elements.length,
      osmValidPeaks: peaks.length,
      matchedByName,
      matchedByPosition,
      unmatched: unmatched.length,
      unnamedUnmatched: unmatched.filter(({ name }) => !name).length,
    },
    unmatched,
  };

  if (input.reportPath) {
    await writeFile(
      input.reportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
  }
  return report;
}
