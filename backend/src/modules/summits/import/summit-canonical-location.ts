import type { NormalizedIgnSummit } from './summit-import.types';

export const OSM_CANONICAL_NAME_MAX_DISTANCE_METERS = 500;

export type OsmCanonicalLocationSignals = {
  osmMatched: boolean;
  osmMatchMethod: 'NAME' | 'POSITION' | null;
  osmDistanceMeters: number | null;
  osmLatitude?: number | null;
  osmLongitude?: number | null;
  osmElevation?: number | null;
};

export type CanonicalSummitLocation = {
  latitude: number;
  longitude: number;
  elevation: number | null;
  source: 'IGN' | 'OSM';
};

function isFiniteCoordinate(value: number | null | undefined) {
  return value !== null && value !== undefined && Number.isFinite(value);
}

export function selectCanonicalSummitLocation(
  candidate: Pick<NormalizedIgnSummit, 'latitude' | 'longitude' | 'elevation'>,
  signals: OsmCanonicalLocationSignals,
): CanonicalSummitLocation {
  const distanceLimit =
    signals.osmMatchMethod === 'POSITION'
      ? 80
      : OSM_CANONICAL_NAME_MAX_DISTANCE_METERS;
  const canUseOsmPeak =
    signals.osmMatched &&
    signals.osmMatchMethod !== null &&
    signals.osmDistanceMeters !== null &&
    signals.osmDistanceMeters <= distanceLimit &&
    isFiniteCoordinate(signals.osmLatitude) &&
    isFiniteCoordinate(signals.osmLongitude);

  if (!canUseOsmPeak) {
    return {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      elevation: candidate.elevation,
      source: 'IGN',
    };
  }

  return {
    latitude: signals.osmLatitude as number,
    longitude: signals.osmLongitude as number,
    elevation: signals.osmElevation ?? candidate.elevation,
    source: 'OSM',
  };
}

export function osmNameMatchRequiresPositionReview(
  signals: OsmCanonicalLocationSignals,
) {
  return (
    signals.osmMatched &&
    signals.osmMatchMethod === 'NAME' &&
    signals.osmDistanceMeters !== null &&
    signals.osmDistanceMeters > OSM_CANONICAL_NAME_MAX_DISTANCE_METERS
  );
}
