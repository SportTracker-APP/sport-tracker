import type { Activity } from "./activities";
import {
  SUMMIT_CATALOG,
  SUMMIT_DISCOVERY_ALTITUDE_TOLERANCE_METERS,
  SUMMIT_DISCOVERY_RADIUS_METERS,
  SUMMIT_TITLE_MATCH_RADIUS_METERS,
  getDistanceMeters,
  normalizeSummitName,
  type Summit,
} from "./summits";

export type SummitView = Summit & {
  discovered: boolean;
  closestDistance: number | null;
  activityCount: number;
  firstActivity: Activity | null;
  latestActivity: Activity | null;
};

type Point = {
  lat: number;
  lng: number;
};

export type MassifProgress = {
  massif: string;
  total: number;
  discovered: number;
  progress: number;
};

export function decodePolyline(polyline: string | null) {
  if (!polyline) {
    return [];
  }

  const points: Point[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

export function getSummitSearchNames(summit: Summit) {
  return [summit.name, ...(summit.aliases ?? [])]
    .map((name) => normalizeSummitName(name))
    .filter(Boolean);
}

function getActivityMaxAltitude(activity: Activity) {
  if (typeof activity.maxAltitude === "number") {
    return activity.maxAltitude;
  }

  if (activity.altitudeStream && activity.altitudeStream.length > 0) {
    return Math.max(...activity.altitudeStream);
  }

  return null;
}

function hasReachedSummitAltitude(activity: Activity, summit: Summit) {
  const maxAltitude = getActivityMaxAltitude(activity);

  if (maxAltitude === null) {
    return true;
  }

  return maxAltitude >= summit.altitude - SUMMIT_DISCOVERY_ALTITUDE_TOLERANCE_METERS;
}

export function getSummitViews(activities: Activity[]) {
  const completedActivities = activities.filter(
    (activity) => activity.status !== "PLANNED" && activity.routePolyline,
  );
  const routeActivities = completedActivities.map((activity) => ({
    activity,
    points: decodePolyline(activity.routePolyline),
    normalizedTitle: normalizeSummitName(activity.title ?? ""),
  }));

  return SUMMIT_CATALOG.map((summit) => {
    const summitPoint = {
      lat: summit.coordinates[1],
      lng: summit.coordinates[0],
    };
    const normalizedSummitNames = getSummitSearchNames(summit);
    const matches = routeActivities
      .map(({ activity, points, normalizedTitle }) => {
        const closestDistance =
          points.length > 0
            ? Math.min(
                ...points.map((point) => getDistanceMeters(point, summitPoint)),
              )
            : Number.POSITIVE_INFINITY;
        const titleMatch =
          normalizedSummitNames.length > 0 &&
          normalizedSummitNames.some((summitName) =>
            normalizedTitle.includes(summitName),
          );
        const nearSummit =
          closestDistance <= SUMMIT_DISCOVERY_RADIUS_METERS ||
          (titleMatch && closestDistance <= SUMMIT_TITLE_MATCH_RADIUS_METERS);
        const discovered =
          nearSummit && hasReachedSummitAltitude(activity, summit);

        return {
          activity,
          closestDistance,
          discovered,
        };
      })
      .filter((match) => match.discovered)
      .sort(
        (firstMatch, secondMatch) =>
          new Date(secondMatch.activity.startedAt).getTime() -
          new Date(firstMatch.activity.startedAt).getTime(),
      );
    const oldestMatches = matches
      .slice()
      .sort(
        (firstMatch, secondMatch) =>
          new Date(firstMatch.activity.startedAt).getTime() -
          new Date(secondMatch.activity.startedAt).getTime(),
      );
    const closestDistance =
      routeActivities.length > 0
        ? Math.min(
            ...routeActivities.map(({ points }) =>
              points.length > 0
                ? Math.min(
                    ...points.map((point) =>
                      getDistanceMeters(point, summitPoint),
                    ),
                  )
                : Number.POSITIVE_INFINITY,
            ),
          )
        : null;

    return {
      ...summit,
      activityCount: matches.length,
      closestDistance:
        closestDistance === Number.POSITIVE_INFINITY ? null : closestDistance,
      discovered: matches.length > 0,
      firstActivity: oldestMatches[0]?.activity ?? null,
      latestActivity: matches[0]?.activity ?? null,
    } satisfies SummitView;
  }).sort((firstSummit, secondSummit) => {
    if (firstSummit.discovered !== secondSummit.discovered) {
      return firstSummit.discovered ? -1 : 1;
    }

    return firstSummit.altitude - secondSummit.altitude;
  });
}

export function getMassifProgress(summits: SummitView[]) {
  return Object.values(
    summits.reduce<Record<string, MassifProgress>>((accumulator, summit) => {
      const current = accumulator[summit.massif] ?? {
        massif: summit.massif,
        total: 0,
        discovered: 0,
        progress: 0,
      };

      current.total += 1;
      current.discovered += summit.discovered ? 1 : 0;
      current.progress = Math.round((current.discovered / current.total) * 100);
      accumulator[summit.massif] = current;

      return accumulator;
    }, {}),
  ).sort((firstMassif, secondMassif) => {
    if (secondMassif.progress !== firstMassif.progress) {
      return secondMassif.progress - firstMassif.progress;
    }

    return secondMassif.total - firstMassif.total;
  });
}
