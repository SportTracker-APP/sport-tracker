import { readFile } from 'node:fs/promises';

import { z } from 'zod';

import { haversineDistanceMeters } from './summit-import-matcher';
import { normalizeSummitNameForMatch } from './summit-import-source';
import type { NormalizedIgnSummit } from './summit-import.types';
import type { SummitCatalogTierSignals } from './summit-catalog-tier';

const OSM_NAME_MAX_DISTANCE_METERS = 1_500;
const OSM_POSITION_MAX_DISTANCE_METERS = 80;

const osmElementSchema = z.object({
  type: z.enum(['node', 'way', 'relation']),
  id: z.number().int().positive(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).default({}),
});

const osmSnapshotSchema = z.object({ elements: z.array(osmElementSchema) });

type OsmPeak = {
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  latitude: number;
  longitude: number;
  elevation: number | null;
  normalizedName: string;
  tags: Record<string, string>;
};

export type CandidateClassificationSignals = SummitCatalogTierSignals & {
  nearestHigherName: string | null;
  osmName: string | null;
  osmType: OsmPeak['osmType'] | null;
  osmId: number | null;
  osmLatitude: number | null;
  osmLongitude: number | null;
  osmElevation: number | null;
  osmWikidata: string | null;
  osmWikipedia: string | null;
};

function parseImportance(candidate: NormalizedIgnSummit) {
  const parsed = Number(candidate.sourceProperties.IMPORTANCE);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 9 ? parsed : null;
}

function parseProminence(tags: Record<string, string>) {
  const value = Number(tags.prominence?.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function candidateNames(candidate: NormalizedIgnSummit) {
  return new Set(
    [candidate.name, ...candidate.aliases].map(normalizeSummitNameForMatch),
  );
}

function distanceToPeak(candidate: NormalizedIgnSummit, peak: OsmPeak) {
  return haversineDistanceMeters(
    [candidate.longitude, candidate.latitude],
    [peak.longitude, peak.latitude],
  );
}

async function readOsmPeaks(snapshotPath: string): Promise<OsmPeak[]> {
  const parsed = osmSnapshotSchema.parse(
    JSON.parse(await readFile(snapshotPath, 'utf8')) as unknown,
  );

  return parsed.elements.flatMap((element) => {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (latitude === undefined || longitude === undefined) return [];
    const elevation = Number.parseFloat(element.tags.ele ?? '');
    return [
      {
        osmType: element.type,
        osmId: element.id,
        latitude,
        longitude,
        elevation: Number.isFinite(elevation) ? Math.round(elevation) : null,
        normalizedName: normalizeSummitNameForMatch(element.tags.name ?? ''),
        tags: element.tags,
      },
    ];
  });
}

export async function calculateCandidateClassificationSignals(input: {
  candidates: NormalizedIgnSummit[];
  osmSnapshotPath: string;
  legacyCertainExternalIds: Set<string>;
}) {
  const osmPeaks = await readOsmPeaks(input.osmSnapshotPath);

  return new Map(
    input.candidates.map((candidate) => {
      const names = candidateNames(candidate);
      const nameMatch = osmPeaks
        .filter(
          (peak) =>
            peak.normalizedName &&
            names.has(peak.normalizedName) &&
            distanceToPeak(candidate, peak) <= OSM_NAME_MAX_DISTANCE_METERS,
        )
        .map((peak) => ({ peak, distance: distanceToPeak(candidate, peak) }))
        .sort((first, second) => first.distance - second.distance)[0];
      const nearestPeak = nameMatch
        ? null
        : osmPeaks
            .map((peak) => ({
              peak,
              distance: distanceToPeak(candidate, peak),
            }))
            .sort((first, second) => first.distance - second.distance)[0];
      const osmMatch =
        nameMatch ??
        (nearestPeak && nearestPeak.distance <= OSM_POSITION_MAX_DISTANCE_METERS
          ? nearestPeak
          : null);
      const higher = input.candidates
        .filter(
          (other) =>
            other.externalId !== candidate.externalId &&
            other.elevation !== null &&
            candidate.elevation !== null &&
            other.elevation > candidate.elevation,
        )
        .map((other) => ({
          candidate: other,
          distance: haversineDistanceMeters(
            [candidate.longitude, candidate.latitude],
            [other.longitude, other.latitude],
          ),
        }))
        .sort((first, second) => first.distance - second.distance)[0];

      const signals: CandidateClassificationSignals = {
        legacyCertain: input.legacyCertainExternalIds.has(candidate.externalId),
        ignImportance: parseImportance(candidate),
        osmMatched: Boolean(osmMatch),
        osmMatchMethod: nameMatch ? 'NAME' : osmMatch ? 'POSITION' : null,
        osmDistanceMeters: osmMatch ? Math.round(osmMatch.distance) : null,
        osmProminenceMeters: osmMatch
          ? parseProminence(osmMatch.peak.tags)
          : null,
        osmProminenceSource: osmMatch?.peak.tags['source:prominence'] ?? null,
        osmName: osmMatch?.peak.tags.name ?? null,
        osmType: osmMatch?.peak.osmType ?? null,
        osmId: osmMatch?.peak.osmId ?? null,
        osmLatitude: osmMatch?.peak.latitude ?? null,
        osmLongitude: osmMatch?.peak.longitude ?? null,
        osmElevation: osmMatch?.peak.elevation ?? null,
        osmWikidata: osmMatch?.peak.tags.wikidata ?? null,
        osmWikipedia: osmMatch?.peak.tags.wikipedia ?? null,
        nearestHigherName: higher?.candidate.name ?? null,
        nearestHigherDistanceMeters: higher
          ? Math.round(higher.distance)
          : null,
      };
      return [candidate.externalId, signals] as const;
    }),
  );
}
