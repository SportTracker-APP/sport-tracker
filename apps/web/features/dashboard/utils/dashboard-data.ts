import type { Activity as SportActivity } from "@/lib/activities";

import type { ChartDatum } from "../types";
import {
  calculateCurrentStreak,
  getActivitiesBetween,
  getCompletedActivities,
  getElevationTotal,
  isOutdoorActivity,
} from "./activity-calculations";
import {
  addDays,
  formatMonthName,
  formatMonthYear,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "./date-format";

export function buildDashboardData(activities: SportActivity[]) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 6);
  weekEnd.setHours(23, 59, 59, 999);
  const previousWeekStart = addDays(weekStart, -7);
  const previousWeekEnd = addDays(weekStart, -1);
  previousWeekEnd.setHours(23, 59, 59, 999);
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(now);
  monthEnd.setHours(23, 59, 59, 999);
  const rollingPeriodStart = addDays(now, -30);
  rollingPeriodStart.setHours(0, 0, 0, 0);
  const rollingPeriodEnd = new Date(now);
  rollingPeriodEnd.setHours(23, 59, 59, 999);

  const completedActivities = getCompletedActivities(activities);
  const weekActivities = getActivitiesBetween(
    completedActivities,
    weekStart,
    weekEnd,
  );
  const previousWeekActivities = getActivitiesBetween(
    completedActivities,
    previousWeekStart,
    previousWeekEnd,
  );
  const currentMonthActivities = getActivitiesBetween(
    completedActivities,
    monthStart,
    monthEnd,
  );
  const rollingActivities = getActivitiesBetween(
    completedActivities,
    rollingPeriodStart,
    rollingPeriodEnd,
  );

  const weeklyDistance = weekActivities.reduce(
    (total, activity) => total + (activity.distance || 0),
    0,
  );
  const previousWeeklyDistance = previousWeekActivities.reduce(
    (total, activity) => total + (activity.distance || 0),
    0,
  );
  const currentMonthDistance = currentMonthActivities.reduce(
    (total, activity) => total + (activity.distance || 0),
    0,
  );
  const currentMonthElevation = getElevationTotal(currentMonthActivities);
  const rollingDistance = rollingActivities.reduce(
    (total, activity) => total + (activity.distance || 0),
    0,
  );
  const rollingDuration = rollingActivities.reduce(
    (total, activity) => total + activity.duration,
    0,
  );
  const rollingElevation = getElevationTotal(rollingActivities);
  const activeDays = new Set(
    rollingActivities.map((activity) =>
      new Date(activity.startedAt).toDateString(),
    ),
  ).size;
  const bestActivity = rollingActivities.reduce<SportActivity | null>(
    (currentBest, activity) => {
      if (!currentBest) {
        return activity;
      }

      return (activity.distance || 0) > (currentBest.distance || 0)
        ? activity
        : currentBest;
    },
    null,
  );
  const currentMonthBestActivity =
    currentMonthActivities.reduce<SportActivity | null>(
      (currentBest, activity) => {
        if (!currentBest) {
          return activity;
        }

        return (activity.distance || 0) > (currentBest.distance || 0)
          ? activity
          : currentBest;
      },
      null,
    );
  const exploredSectors = completedActivities.filter(
    (activity) =>
      isOutdoorActivity(activity) &&
      ((activity.elevationGain || 0) >= 250 ||
        ["RUNNING", "TRAIL", "HIKING"].includes(activity.sport)),
  ).length;
  const chartData: ChartDatum[] = Array.from({ length: 31 }, (_, index) => {
    const day = addDays(rollingPeriodStart, index);
    const dayActivities = rollingActivities.filter((activity) =>
      isSameDay(new Date(activity.startedAt), day),
    );

    return {
      day: new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      }).format(day),
      distance: Number(
        dayActivities
          .reduce((total, activity) => total + (activity.distance || 0), 0)
          .toFixed(2),
      ),
      elevation: Math.round(getElevationTotal(dayActivities)),
      duration: Number(
        (
          dayActivities.reduce(
            (total, activity) => total + activity.duration,
            0,
          ) / 60
        ).toFixed(2),
      ),
    };
  });

  return {
    completedActivities,
    weekActivities,
    rollingActivities,
    currentMonthActivities,
    weeklyDistance,
    previousWeeklyDistance,
    currentMonthDistance,
    currentMonthElevation,
    rollingDistance,
    rollingDuration,
    rollingElevation,
    activeDays,
    bestActivity,
    currentMonthBestActivity,
    latestActivity: completedActivities[0] ?? null,
    recentActivities: completedActivities.slice(0, 4),
    exploredSectors,
    currentStreak: calculateCurrentStreak(completedActivities),
    chartData,
    heatmapMonthLabel: formatMonthYear(now),
    heatmapDescription: `Données réelles du 1er au ${Math.min(
      28,
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    )} ${formatMonthName(now)}.`,
  };
}

export type DashboardData = ReturnType<typeof buildDashboardData>;
