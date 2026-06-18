import { Activity, Bike, Footprints, Mountain } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Activity as SportActivity } from "@/lib/activities";

import type { ChartMetric } from "../types";

export function getSportLabel(activity: SportActivity | null) {
  if (!activity) {
    return "Aucune sortie";
  }

  const labels: Record<string, string> = {
    FITNESS: "Fitness",
    GRAVEL: "Gravel",
    GYM: "Musculation",
    HIKING: "Randonnée",
    MTB: "VTT",
    ROAD_CYCLING: "Cyclisme",
    RUNNING: "Course",
    TRAIL: "Trail",
    WALKING: "Marche",
  };

  return labels[activity.sport] ?? "Sport";
}

export function getSportIcon(sport: SportActivity["sport"]): LucideIcon {
  if (["MTB", "ROAD_CYCLING", "GRAVEL"].includes(sport)) {
    return Bike;
  }

  if (["TRAIL", "HIKING"].includes(sport)) {
    return Mountain;
  }

  if (["RUNNING", "WALKING"].includes(sport)) {
    return Footprints;
  }

  return Activity;
}

export function isChartMetric(value: string | null): value is ChartMetric {
  return value === "distance" || value === "elevation" || value === "duration";
}

export function getCompletedActivities(activities: SportActivity[]) {
  return activities
    .filter((activity) => activity.status !== "PLANNED")
    .sort(
      (firstActivity, secondActivity) =>
        new Date(secondActivity.startedAt).getTime() -
        new Date(firstActivity.startedAt).getTime(),
    );
}

export function getActivitiesBetween(
  activities: SportActivity[],
  startDate: Date,
  endDate: Date,
) {
  return activities.filter((activity) => {
    const startedAt = new Date(activity.startedAt);
    return startedAt >= startDate && startedAt <= endDate;
  });
}

export function getElevationTotal(activities: SportActivity[]) {
  return activities.reduce(
    (total, activity) => total + (activity.elevationGain || 0),
    0,
  );
}

export function isOutdoorActivity(activity: SportActivity) {
  return [
    "RUNNING",
    "TRAIL",
    "HIKING",
    "MTB",
    "ROAD_CYCLING",
    "GRAVEL",
  ].includes(activity.sport);
}

export function getDaysSinceLastActivity(activity: SportActivity | null) {
  if (!activity) {
    return null;
  }

  const today = new Date();
  const lastDate = new Date(activity.startedAt);
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000),
  );
}

export function calculateCurrentStreak(activities: SportActivity[]) {
  if (activities.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      activities.map((activity) => {
        const date = new Date(activity.startedAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }),
    ),
  ).sort((first, second) => second - first);

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const difference =
      (uniqueDays[index - 1]! - uniqueDays[index]!) / 86_400_000;

    if (difference !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function getAdventureName(activities: SportActivity[]) {
  const lastOutdoor = activities.find(isOutdoorActivity);

  if (!lastOutdoor) {
    return "un tour du lac ou une montée aux Aravis";
  }

  if (lastOutdoor.sport === "RUNNING") {
    return "la prochaine boucle autour du lac";
  }

  if (["TRAIL", "HIKING"].includes(lastOutdoor.sport)) {
    return "la prochaine ligne de crête";
  }

  return "la prochaine trace à explorer";
}
