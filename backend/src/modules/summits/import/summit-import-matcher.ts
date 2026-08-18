import {
  IGN_BD_TOPO_PROVIDER,
  LEGACY_ALTITUDE_TOLERANCE_METERS,
  LEGACY_CERTAIN_MATCH_MAX_DISTANCE_METERS,
  LEGACY_NAME_MATCH_MAX_DISTANCE_METERS,
} from './summit-import.constants';
import { normalizeSummitNameForMatch } from './summit-import-source';
import type {
  ExistingSummitForMatch,
  NormalizedIgnSummit,
  SummitMatchDecision,
} from './summit-import.types';

export function haversineDistanceMeters(
  first: readonly [number, number],
  second: readonly [number, number],
) {
  const earthRadius = 6_371_000;
  const toRadians = Math.PI / 180;
  const firstLatitude = first[1] * toRadians;
  const secondLatitude = second[1] * toRadians;
  const latitudeDelta = (second[1] - first[1]) * toRadians;
  const longitudeDelta = (second[0] - first[0]) * toRadians;
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(value));
}

function normalizedNames(summit: ExistingSummitForMatch) {
  return new Set(
    [summit.name, ...summit.aliases].map(normalizeSummitNameForMatch),
  );
}

function candidateNames(candidate: NormalizedIgnSummit) {
  return new Set([
    candidate.normalizedName,
    ...candidate.aliases.map(normalizeSummitNameForMatch),
  ]);
}

function sharesName(
  candidate: NormalizedIgnSummit,
  summit: ExistingSummitForMatch,
) {
  const existingNames = normalizedNames(summit);
  return [...candidateNames(candidate)].some((name) => existingNames.has(name));
}

function altitudeCompatible(
  candidate: NormalizedIgnSummit,
  summit: ExistingSummitForMatch,
) {
  return (
    candidate.elevation !== null &&
    Math.abs(candidate.elevation - summit.altitude) <=
      LEGACY_ALTITUDE_TOLERANCE_METERS
  );
}

export function matchIgnCandidate(
  candidate: NormalizedIgnSummit,
  existingSummits: ExistingSummitForMatch[],
): SummitMatchDecision {
  const externalMatches = existingSummits.filter((summit) =>
    summit.externalReferences.some(
      (reference) =>
        reference.provider === IGN_BD_TOPO_PROVIDER &&
        reference.externalId === candidate.externalId,
    ),
  );

  if (externalMatches.length === 1) {
    return {
      candidate,
      status: 'MATCHED',
      matchedSummitId: externalMatches[0].id,
      reason: 'Référence externe IGN identique',
    };
  }

  if (externalMatches.length > 1) {
    return {
      candidate,
      status: 'CONFLICT',
      matchedSummitId: null,
      reason: 'Plusieurs sommets portent la même référence IGN',
    };
  }

  if (candidate.boundaryReview) {
    return {
      candidate,
      status: 'CONFLICT',
      matchedSummitId: null,
      reason: `Sommet frontalier à ${candidate.boundaryDistanceMeters.toFixed(1)} m de la limite officielle`,
    };
  }

  if (candidate.elevation === null) {
    return {
      candidate,
      status: 'REJECTED',
      matchedSummitId: null,
      reason: 'Altitude IGN indisponible',
    };
  }

  const nearby = existingSummits
    .map((summit) => ({
      summit,
      distance: haversineDistanceMeters(
        [candidate.longitude, candidate.latitude],
        [summit.longitude, summit.latitude],
      ),
    }))
    .filter(
      ({ distance }) => distance <= LEGACY_NAME_MATCH_MAX_DISTANCE_METERS,
    );
  const nameMatches = nearby.filter(({ summit }) =>
    sharesName(candidate, summit),
  );

  if (nameMatches.length === 1) {
    const [{ summit, distance }] = nameMatches;
    if (
      distance <= LEGACY_CERTAIN_MATCH_MAX_DISTANCE_METERS &&
      altitudeCompatible(candidate, summit)
    ) {
      return {
        candidate,
        status: 'MATCHED',
        matchedSummitId: summit.id,
        reason: `Nom, position (${Math.round(distance)} m) et altitude concordants`,
      };
    }

    return {
      candidate,
      status: 'CONFLICT',
      matchedSummitId: summit.id,
      reason: `Nom concordant mais position/altitude à vérifier (${Math.round(distance)} m)`,
    };
  }

  if (nameMatches.length > 1) {
    return {
      candidate,
      status: 'CONFLICT',
      matchedSummitId: null,
      reason: 'Plusieurs sommets historiques portent un nom compatible',
    };
  }

  const positionalConflicts = nearby.filter(
    ({ summit, distance }) =>
      distance <= LEGACY_CERTAIN_MATCH_MAX_DISTANCE_METERS &&
      altitudeCompatible(candidate, summit),
  );

  if (positionalConflicts.length > 0) {
    return {
      candidate,
      status: 'CONFLICT',
      matchedSummitId:
        positionalConflicts.length === 1
          ? positionalConflicts[0].summit.id
          : null,
      reason: 'Sommet historique très proche mais nom différent',
    };
  }

  return {
    candidate,
    status: 'READY',
    matchedSummitId: null,
    reason: 'Nouveau candidat IGN complet sans doublon détecté',
  };
}

export function matchIgnCandidates(
  candidates: NormalizedIgnSummit[],
  existingSummits: ExistingSummitForMatch[],
) {
  return candidates.map((candidate) =>
    matchIgnCandidate(candidate, existingSummits),
  );
}
