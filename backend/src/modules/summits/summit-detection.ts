export const SUMMIT_ALTITUDE_TOLERANCE_METERS = 80;
export const SUMMIT_DISCOVERY_RADIUS_METERS = 250;
export const SUMMIT_AUTO_CONFIRM_RADIUS_METERS = 100;
export const SUMMIT_NO_ALTITUDE_DETECTION_RADIUS_METERS = 120;
export const SUMMIT_TITLE_MATCH_RADIUS_METERS = 1_200;
export const SUMMIT_AUTO_CONFIRM_CONFIDENCE = 0.72;
export const SUMMIT_DETECTION_VERSION = 2;
export const SUMMIT_MIN_ROUTE_POINTS_FOR_AUTO_CONFIRM = 2;

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type SummitDetectionInput = {
  title: string | null;
  maxAltitude: number | null;
  routePolyline: string;
};

export type SummitDetectionTarget = {
  id: string;
  name: string;
  aliases: string[];
  altitude: number;
  latitude: number;
  longitude: number;
};

export type SummitDetectionMatch = {
  summitId: string;
  confidence: number;
  closestDistance: number;
  altitudeMatched: boolean;
  titleMatched: boolean;
  autoConfirmed: boolean;
  routePointCount: number;
  nearbyPointCount: number;
  detectionVersion: number;
};

export function decodePolyline(polyline: string): GeoPoint[] {
  if (!polyline) {
    return [];
  }

  const points: GeoPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      if (index >= polyline.length) {
        return [];
      }

      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      if (index >= polyline.length) {
        return [];
      }

      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

export function getDistanceMeters(
  firstPoint: GeoPoint,
  secondPoint: GeoPoint,
): number {
  const earthRadius = 6_371_000;
  const firstLat = (firstPoint.lat * Math.PI) / 180;
  const secondLat = (secondPoint.lat * Math.PI) / 180;
  const deltaLat = ((secondPoint.lat - firstPoint.lat) * Math.PI) / 180;
  const deltaLng = ((secondPoint.lng - firstPoint.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function normalizeSummitName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleRefersToNearbyLandmark(
  normalizedTitle: string,
  normalizedSummitNames: string[],
) {
  return normalizedSummitNames.some((name) => {
    const nameIndex = normalizedTitle.indexOf(name);
    if (nameIndex < 0) return false;

    const prefix = normalizedTitle.slice(
      Math.max(0, nameIndex - 28),
      nameIndex,
    );
    return /\b(?:pieds?|refuge|lac|col|tour)(?:\s+(?:de|du|des|d))?\s*$/.test(
      prefix,
    );
  });
}

export function detectSummits(
  activity: SummitDetectionInput,
  summits: SummitDetectionTarget[],
): SummitDetectionMatch[] {
  const points = decodePolyline(activity.routePolyline);

  if (points.length === 0) {
    return [];
  }

  const normalizedTitle = normalizeSummitName(activity.title ?? '');

  return summits.flatMap((summit) => {
    const summitPoint = { lat: summit.latitude, lng: summit.longitude };
    const closestDistance = Math.round(
      Math.min(...points.map((point) => getDistanceMeters(point, summitPoint))),
    );
    const nearbyPointCount = points.filter(
      (point) =>
        getDistanceMeters(point, summitPoint) <= SUMMIT_DISCOVERY_RADIUS_METERS,
    ).length;
    const normalizedSummitNames = [summit.name, ...summit.aliases]
      .map(normalizeSummitName)
      .filter(Boolean);
    const titleMatched =
      !titleRefersToNearbyLandmark(normalizedTitle, normalizedSummitNames) &&
      normalizedSummitNames.some((name) => normalizedTitle.includes(name));
    const altitudeMatched =
      activity.maxAltitude === null
        ? closestDistance <= SUMMIT_NO_ALTITUDE_DETECTION_RADIUS_METERS
        : activity.maxAltitude >=
          summit.altitude - SUMMIT_ALTITUDE_TOLERANCE_METERS;
    const withinDetectionRadius =
      closestDistance <= SUMMIT_DISCOVERY_RADIUS_METERS ||
      (titleMatched && closestDistance <= SUMMIT_TITLE_MATCH_RADIUS_METERS);

    if (!withinDetectionRadius || !altitudeMatched) {
      return [];
    }

    let confidence = closestDistance <= 100 ? 0.65 : 0;

    if (closestDistance > 100 && closestDistance <= 250) {
      confidence = 0.55;
    } else if (closestDistance > 250 && closestDistance <= 500) {
      confidence = 0.4;
    } else if (closestDistance > 500) {
      confidence = 0.25;
    }

    confidence += activity.maxAltitude === null ? 0.15 : 0.25;
    confidence += titleMatched ? 0.15 : 0;
    confidence = Math.min(1, Number(confidence.toFixed(2)));

    return [
      {
        summitId: summit.id,
        confidence,
        closestDistance,
        altitudeMatched,
        titleMatched,
        routePointCount: points.length,
        nearbyPointCount,
        detectionVersion: SUMMIT_DETECTION_VERSION,
        autoConfirmed:
          activity.maxAltitude !== null &&
          points.length >= SUMMIT_MIN_ROUTE_POINTS_FOR_AUTO_CONFIRM &&
          closestDistance <= SUMMIT_AUTO_CONFIRM_RADIUS_METERS &&
          confidence >= SUMMIT_AUTO_CONFIRM_CONFIDENCE,
      },
    ];
  });
}
