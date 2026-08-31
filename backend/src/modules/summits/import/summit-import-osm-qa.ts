import { readFile, writeFile } from 'node:fs/promises';

import { z } from 'zod';

import { haversineDistanceMeters } from './summit-import-matcher';
import {
  normalizeSummitNameForMatch,
  readIgnSummitSnapshot,
} from './summit-import-source';
import type { NormalizedIgnSummit } from './summit-import.types';

const OSM_EXACT_NAME_MAX_DISTANCE_METERS = 1_500;
const OSM_POSITIONAL_MAX_DISTANCE_METERS = 80;
export const OSM_POSITION_REVIEW_DISTANCE_METERS = 80;
export const OSM_ALTITUDE_REVIEW_DELTA_METERS = 50;

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

export type OsmPeak = {
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  name: string | null;
  latitude: number;
  longitude: number;
  elevation: number | null;
};

export type OsmQaMatch = {
  ignExternalId: string;
  ignName: string;
  osmType: OsmPeak['osmType'];
  osmId: number;
  osmName: string | null;
  matchKind: 'NAME' | 'POSITION';
  ignLatitude: number;
  ignLongitude: number;
  osmLatitude: number;
  osmLongitude: number;
  distanceMeters: number;
  sourcePrecisionMeters: number | null;
  ignElevation: number | null;
  osmElevation: number | null;
  altitudeDeltaMeters: number | null;
  positionReviewRequired: boolean;
  altitudeReviewRequired: boolean;
};

export type OsmQaReport = {
  attribution: '© OpenStreetMap contributors — ODbL 1.0';
  generatedAt: string;
  counts: {
    osmSourceElements: number;
    osmValidPeaks: number;
    matchedByName: number;
    matchedByPosition: number;
    positionReviewRequired: number;
    altitudeReviewRequired: number;
    unmatched: number;
    unnamedUnmatched: number;
  };
  matches: OsmQaMatch[];
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
  const parsedElevation = Number.parseFloat(element.tags.ele ?? '');
  return {
    osmType: element.type,
    osmId: element.id,
    name: displayName || null,
    latitude,
    longitude,
    elevation: Number.isFinite(parsedElevation) ? parsedElevation : null,
  };
}

function numericSourcePrecision(candidate: NormalizedIgnSummit) {
  const value = Number(candidate.sourceProperties.PREC_PLANI);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function compareIgnSummitsWithOsmPeaks(
  candidates: NormalizedIgnSummit[],
  peaks: OsmPeak[],
) {
  let matchedByName = 0;
  let matchedByPosition = 0;
  const matches: OsmQaMatch[] = [];
  const unmatched: OsmQaReport['unmatched'] = [];

  for (const peak of peaks) {
    const candidatesByDistance = candidates
      .map((candidate) => ({
        candidate,
        distance: haversineDistanceMeters(
          [peak.longitude, peak.latitude],
          [candidate.longitude, candidate.latitude],
        ),
      }))
      .sort((first, second) => first.distance - second.distance);
    const nearest = candidatesByDistance[0];
    const normalizedOsmName = peak.name
      ? normalizeSummitNameForMatch(peak.name)
      : '';
    const sameName = normalizedOsmName
      ? candidatesByDistance.find(
          ({ candidate, distance }) =>
            [candidate.name, ...candidate.aliases].some(
              (name) => normalizeSummitNameForMatch(name) === normalizedOsmName,
            ) && distance <= OSM_EXACT_NAME_MAX_DISTANCE_METERS,
        )
      : null;
    const matched =
      sameName ??
      (nearest && nearest.distance <= OSM_POSITIONAL_MAX_DISTANCE_METERS
        ? nearest
        : null);

    if (matched) {
      const matchKind = sameName ? 'NAME' : 'POSITION';
      if (matchKind === 'NAME') matchedByName += 1;
      else matchedByPosition += 1;

      const altitudeDeltaMeters =
        matched.candidate.elevation !== null && peak.elevation !== null
          ? Math.round(Math.abs(matched.candidate.elevation - peak.elevation))
          : null;
      matches.push({
        ignExternalId: matched.candidate.externalId,
        ignName: matched.candidate.name,
        osmType: peak.osmType,
        osmId: peak.osmId,
        osmName: peak.name,
        matchKind,
        ignLatitude: matched.candidate.latitude,
        ignLongitude: matched.candidate.longitude,
        osmLatitude: peak.latitude,
        osmLongitude: peak.longitude,
        distanceMeters: Math.round(matched.distance),
        sourcePrecisionMeters: numericSourcePrecision(matched.candidate),
        ignElevation: matched.candidate.elevation,
        osmElevation: peak.elevation,
        altitudeDeltaMeters,
        positionReviewRequired:
          matchKind === 'NAME' &&
          matched.distance > OSM_POSITION_REVIEW_DISTANCE_METERS,
        altitudeReviewRequired:
          altitudeDeltaMeters !== null &&
          altitudeDeltaMeters > OSM_ALTITUDE_REVIEW_DELTA_METERS,
      });
      continue;
    }

    unmatched.push({
      ...peak,
      nearestIgnName: nearest?.candidate.name ?? null,
      nearestIgnDistanceMeters: nearest ? Math.round(nearest.distance) : null,
    });
  }

  return { matchedByName, matchedByPosition, matches, unmatched };
}

export async function runOsmSummitQa(input: {
  snapshotDirectory: string;
  sourceVersion: string;
  departmentCode?: string;
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
  const comparison = compareIgnSummitsWithOsmPeaks(
    ignSnapshot.candidates,
    peaks,
  );

  const report: OsmQaReport = {
    attribution: '© OpenStreetMap contributors — ODbL 1.0',
    generatedAt: new Date().toISOString(),
    counts: {
      osmSourceElements: osmResponse.elements.length,
      osmValidPeaks: peaks.length,
      matchedByName: comparison.matchedByName,
      matchedByPosition: comparison.matchedByPosition,
      positionReviewRequired: comparison.matches.filter(
        ({ positionReviewRequired }) => positionReviewRequired,
      ).length,
      altitudeReviewRequired: comparison.matches.filter(
        ({ altitudeReviewRequired }) => altitudeReviewRequired,
      ).length,
      unmatched: comparison.unmatched.length,
      unnamedUnmatched: comparison.unmatched.filter(({ name }) => !name).length,
    },
    matches: comparison.matches,
    unmatched: comparison.unmatched,
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
