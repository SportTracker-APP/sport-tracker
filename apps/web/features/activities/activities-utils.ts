import type { Activity } from "@/lib/activities";
import { isRecordedCompletedActivity } from "@/lib/activity-visibility";

import type {
  ActivityFilter,
  ActivityMetric,
  ActivityMonthGroup,
  ActivityRoutePoint,
  ActivityViewModel,
  YearlyJournalSummary,
} from "./activities-types";

const SPORT_FILTERS: Record<Exclude<ActivityFilter, "Tous">, string[]> = {
  Course: ["RUNNING"],
  Cyclisme: ["ROAD_CYCLING", "GRAVEL"],
  VTT: ["MTB"],
  Trail: ["TRAIL"],
  Musculation: ["GYM", "FITNESS"],
  Randonnée: ["HIKING", "WALKING"],
};

export const SPORT_LABELS: Record<string, string> = {
  RUNNING: "Course",
  ROAD_CYCLING: "Cyclisme",
  GRAVEL: "Gravel",
  MTB: "VTT",
  TRAIL: "Trail",
  HIKING: "Randonnée",
  WALKING: "Marche",
  GYM: "Musculation",
  FITNESS: "Fitness",
  SWIMMING: "Natation",
  SKI: "Ski",
  SNOWBOARD: "Snowboard",
  CLIMBING: "Escalade",
};

const SUPPORTED_ACTIVITY_IMAGE_HOSTS = new Set([
  "hkzkzprcofhanjendhct.supabase.co",
  "images.pexels.com",
  "commons.wikimedia.org",
  "upload.wikimedia.org",
  "dgtzuqphqg23d.cloudfront.net",
]);

const frNumber = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

function formatDuration(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${String(remainingMinutes).padStart(2, "0")}`;
}

function isSupportedImageUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      SUPPORTED_ACTIVITY_IMAGE_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function getActivityPhoto(activity: Activity) {
  const candidates = [activity.coverImageUrl, ...(activity.photoUrls ?? [])];

  return candidates.find(isSupportedImageUrl) ?? null;
}

function getLocationLabel(activity: Activity) {
  const locationParts = [activity.city, activity.country].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  return locationParts.length > 0 ? locationParts.join(" · ") : null;
}

function getMetrics(activity: Activity): ActivityMetric[] {
  const metrics: ActivityMetric[] = [];

  if (activity.distance !== null && activity.distance > 0) {
    metrics.push({
      key: "distance",
      label: `${frNumber.format(activity.distance)} km`,
    });
  }

  if (activity.duration > 0) {
    metrics.push({
      key: "duration",
      label: formatDuration(activity.duration),
    });
  }

  if (activity.elevationGain !== null && activity.elevationGain > 0) {
    metrics.push({
      key: "elevation",
      label: `${new Intl.NumberFormat("fr-FR").format(
        Math.round(activity.elevationGain),
      )} m D+`,
    });
  }

  if (activity.calories !== null && activity.calories > 0) {
    metrics.push({
      key: "calories",
      label: `${new Intl.NumberFormat("fr-FR").format(
        Math.round(activity.calories),
      )} kcal`,
    });
  }

  return metrics;
}

export function createRouteSketch(
  polyline: string | null,
): ActivityRoutePoint[] {
  if (!polyline) {
    return [];
  }

  const coordinates: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  try {
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

      latitude += result & 1 ? ~(result >> 1) : result >> 1;
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

      longitude += result & 1 ? ~(result >> 1) : result >> 1;
      coordinates.push({
        lat: latitude / 1e5,
        lng: longitude / 1e5,
      });
    }
  } catch {
    return [];
  }

  if (coordinates.length < 2) {
    return [];
  }

  const latitudes = coordinates.map((point) => point.lat);
  const longitudes = coordinates.map((point) => point.lng);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.00001);
  const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.00001);
  const padding = 9;
  const drawableSize = 100 - padding * 2;

  return coordinates.map((point) => ({
    x: padding + ((point.lng - minLongitude) / longitudeSpan) * drawableSize,
    y: padding + (1 - (point.lat - minLatitude) / latitudeSpan) * drawableSize,
  }));
}

export function getCompletedActivities(activities: Activity[]) {
  const now = Date.now();

  return activities
    .filter((activity) => isRecordedCompletedActivity(activity, now))
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() -
        new Date(left.startedAt).getTime(),
    );
}

export function filterActivities(
  activities: Activity[],
  filter: ActivityFilter,
) {
  if (filter === "Tous") {
    return activities;
  }

  const sports = SPORT_FILTERS[filter];

  return activities.filter((activity) => sports.includes(activity.sport));
}

export function createActivityViewModel(activity: Activity): ActivityViewModel {
  const date = new Date(activity.startedAt);
  const sportLabel = SPORT_LABELS[activity.sport] ?? activity.sport;

  return {
    id: activity.id,
    title: activity.title?.trim() || "Sortie sans titre",
    sport: activity.sport,
    sportLabel,
    typeLabel: activity.type === "TRAINING" ? null : activity.type,
    startedAt: activity.startedAt,
    dateLabel: date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    dateDay: date.toLocaleDateString("fr-FR", { day: "2-digit" }),
    dateMonth: date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
    dateYear: date.toLocaleDateString("fr-FR", { year: "numeric" }),
    locationLabel: getLocationLabel(activity),
    metrics: getMetrics(activity),
    routePolyline: activity.routePolyline,
    photoUrl: getActivityPhoto(activity),
    isFromStrava: Boolean(activity.stravaActivityId),
  };
}

export function groupActivitiesByMonth(
  activities: ActivityViewModel[],
): ActivityMonthGroup[] {
  const groups = new Map<string, ActivityMonthGroup>();

  activities.forEach((activity) => {
    const date = new Date(activity.startedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.activities.push(activity);
      return;
    }

    groups.set(key, {
      key,
      label: date
        .toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })
        .toUpperCase(),
      activities: [activity],
    });
  });

  return Array.from(groups.values());
}

export function createYearlySummary(
  activities: Activity[],
  year: number,
): YearlyJournalSummary {
  const yearlyActivities = activities.filter(
    (activity) => new Date(activity.startedAt).getFullYear() === year,
  );
  const distance = yearlyActivities.reduce(
    (total, activity) => total + (activity.distance ?? 0),
    0,
  );
  const duration = yearlyActivities.reduce(
    (total, activity) => total + activity.duration,
    0,
  );
  const elevation = yearlyActivities.reduce(
    (total, activity) => total + (activity.elevationGain ?? 0),
    0,
  );
  const calories = yearlyActivities.reduce(
    (total, activity) => total + (activity.calories ?? 0),
    0,
  );
  const sports = yearlyActivities.reduce<Map<string, number>>(
    (counts, activity) => {
      counts.set(activity.sport, (counts.get(activity.sport) ?? 0) + 1);
      return counts;
    },
    new Map(),
  );
  const favoriteSport = Array.from(sports.entries()).sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0];

  return {
    year,
    activityCount: yearlyActivities.length,
    distanceLabel: `${frNumber.format(distance)} km`,
    durationLabel: formatDuration(duration),
    elevationLabel:
      elevation > 0
        ? `${new Intl.NumberFormat("fr-FR").format(Math.round(elevation))} m`
        : null,
    caloriesLabel:
      calories > 0
        ? new Intl.NumberFormat("fr-FR").format(Math.round(calories))
        : null,
    favoriteSportLabel: favoriteSport
      ? (SPORT_LABELS[favoriteSport] ?? favoriteSport)
      : null,
  };
}
