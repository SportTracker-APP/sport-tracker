import type { ActivityChartPeriod } from "@/lib/activity-chart-period";
import type { Activity } from "@/lib/activities";

export type ActivityTotals = {
  count: number;
  distance: number;
  duration: number;
  elevation: number;
  calories: number;
};

export type SportDistribution = {
  sport: string;
  label: string;
  count: number;
  distance: number;
  percent: number;
};

export type CalendarDay = {
  date: Date;
  dateKey: string;
  count: number;
  distance: number;
  duration: number;
  elevation: number;
  activities: Activity[];
  sports: string[];
};

const SPORT_LABELS: Record<string, string> = {
  FITNESS: "Musculation",
  GRAVEL: "Gravel",
  HIKING: "Randonnée",
  MTB: "VTT",
  ROAD_CYCLING: "Cyclisme",
  RUNNING: "Course",
  TRAIL: "Trail",
  WALKING: "Marche",
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getCompletedActivities(activities: Activity[]) {
  return activities.filter((activity) => activity.status !== "PLANNED");
}

export function sumActivities(activities: Activity[]): ActivityTotals {
  return activities.reduce<ActivityTotals>(
    (totals, activity) => ({
      count: totals.count + 1,
      distance: totals.distance + (activity.distance ?? 0),
      duration: totals.duration + (activity.duration ?? 0),
      elevation: totals.elevation + (activity.elevationGain ?? 0),
      calories: totals.calories + (activity.calories ?? 0),
    }),
    {
      count: 0,
      distance: 0,
      duration: 0,
      elevation: 0,
      calories: 0,
    },
  );
}

export function getPeriodBounds(period: ActivityChartPeriod, now = new Date()) {
  const today = startOfDay(now);
  const end = addDays(today, 1);

  if (period === "7d") {
    return { start: addDays(today, -6), end };
  }

  if (period === "30d") {
    return { start: addDays(today, -29), end };
  }

  if (period === "3m") {
    return { start: addDays(today, -89), end };
  }

  return {
    start: new Date(today.getFullYear(), today.getMonth() - 11, 1),
    end,
  };
}

function activitiesBetween(
  activities: Activity[],
  start: Date,
  end: Date,
) {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return activities.filter((activity) => {
    const startedAt = new Date(activity.startedAt).getTime();
    return startedAt >= startTime && startedAt < endTime;
  });
}

export function getPeriodComparison(
  activities: Activity[],
  period: ActivityChartPeriod,
  now = new Date(),
) {
  const currentBounds = getPeriodBounds(period, now);
  const duration = currentBounds.end.getTime() - currentBounds.start.getTime();
  const previousBounds = {
    start: new Date(currentBounds.start.getTime() - duration),
    end: currentBounds.start,
  };
  const currentActivities = activitiesBetween(
    activities,
    currentBounds.start,
    currentBounds.end,
  );
  const previousActivities = activitiesBetween(
    activities,
    previousBounds.start,
    previousBounds.end,
  );

  return {
    current: sumActivities(currentActivities),
    previous: sumActivities(previousActivities),
  };
}

export function getTrendPercent(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export function getSportLabel(sport: string) {
  return SPORT_LABELS[sport] ?? sport;
}

export function getSportDistribution(
  activities: Activity[],
): SportDistribution[] {
  const grouped = new Map<
    string,
    { sport: string; count: number; distance: number }
  >();

  activities.forEach((activity) => {
    const current = grouped.get(activity.sport) ?? {
      sport: activity.sport,
      count: 0,
      distance: 0,
    };

    grouped.set(activity.sport, {
      sport: activity.sport,
      count: current.count + 1,
      distance: current.distance + (activity.distance ?? 0),
    });
  });

  const total = Math.max(activities.length, 1);

  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      label: getSportLabel(entry.sport),
      percent: Math.round((entry.count / total) * 100),
    }))
    .sort((first, second) => second.count - first.count);
}

export function getCalendarDays(
  activities: Activity[],
  now = new Date(),
  numberOfDays = 28,
): CalendarDay[] {
  const today = startOfDay(now);
  const firstDay = addDays(today, -(numberOfDays - 1));

  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = addDays(firstDay, index);
    const dateKey = getDateKey(date);
    const dayActivities = activities.filter(
      (activity) => getDateKey(new Date(activity.startedAt)) === dateKey,
    );
    const totals = sumActivities(dayActivities);

    return {
      date,
      dateKey,
      count: totals.count,
      distance: totals.distance,
      duration: totals.duration,
      elevation: totals.elevation,
      activities: dayActivities,
      sports: Array.from(new Set(dayActivities.map((activity) => activity.sport))),
    };
  });
}

export function getCalendarMonthDays(
  activities: Activity[],
  month: Date,
): CalendarDay[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const daysBeforeMonth = (firstOfMonth.getDay() + 6) % 7;
  const daysAfterMonth = 6 - ((lastOfMonth.getDay() + 6) % 7);
  const gridStart = addDays(firstOfMonth, -daysBeforeMonth);
  const gridLength = lastOfMonth.getDate() + daysBeforeMonth + daysAfterMonth;
  const activitiesByDay = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const dateKey = getDateKey(new Date(activity.startedAt));
    const dayActivities = activitiesByDay.get(dateKey) ?? [];
    dayActivities.push(activity);
    activitiesByDay.set(dateKey, dayActivities);
  });

  return Array.from({ length: gridLength }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateKey = getDateKey(date);
    const dayActivities = activitiesByDay.get(dateKey) ?? [];
    const totals = sumActivities(dayActivities);

    return {
      date,
      dateKey,
      count: totals.count,
      distance: totals.distance,
      duration: totals.duration,
      elevation: totals.elevation,
      activities: dayActivities,
      sports: Array.from(new Set(dayActivities.map((activity) => activity.sport))),
    };
  });
}

export function getActiveDayCount(activities: Activity[]) {
  return new Set(
    activities.map((activity) => getDateKey(new Date(activity.startedAt))),
  ).size;
}

export function getLongestDistanceActivity(activities: Activity[]) {
  return activities.reduce<Activity | null>(
    (record, activity) =>
      !record || (activity.distance ?? 0) > (record.distance ?? 0)
        ? activity
        : record,
    null,
  );
}

export function getHighestElevationActivity(activities: Activity[]) {
  return activities.reduce<Activity | null>(
    (record, activity) =>
      !record || (activity.elevationGain ?? 0) > (record.elevationGain ?? 0)
        ? activity
        : record,
    null,
  );
}

export function getHighestAltitudeActivity(activities: Activity[]) {
  return activities.reduce<Activity | null>(
    (record, activity) =>
      !record || (activity.maxAltitude ?? 0) > (record.maxAltitude ?? 0)
        ? activity
        : record,
    null,
  );
}

export function getPeriodHighlightActivity(activities: Activity[]) {
  if (activities.length === 0) {
    return null;
  }

  const maxima = activities.reduce(
    (values, activity) => ({
      distance: Math.max(values.distance, activity.distance ?? 0),
      duration: Math.max(values.duration, activity.duration ?? 0),
      elevation: Math.max(values.elevation, activity.elevationGain ?? 0),
      altitude: Math.max(values.altitude, activity.maxAltitude ?? 0),
    }),
    { distance: 0, duration: 0, elevation: 0, altitude: 0 },
  );
  const ratio = (value: number | null | undefined, maximum: number) =>
    maximum > 0 ? (value ?? 0) / maximum : 0;

  return [...activities].sort((first, second) => {
    const score = (activity: Activity) =>
      ratio(activity.distance, maxima.distance) * 0.28 +
      ratio(activity.duration, maxima.duration) * 0.18 +
      ratio(activity.elevationGain, maxima.elevation) * 0.34 +
      ratio(activity.maxAltitude, maxima.altitude) * 0.12 +
      (activity.coverImageUrl || activity.photoUrls?.[0] ? 0.05 : 0) +
      (activity.routePolyline ? 0.03 : 0);
    const difference = score(second) - score(first);

    return difference !== 0
      ? difference
      : new Date(second.startedAt).getTime() -
          new Date(first.startedAt).getTime();
  })[0];
}

export function getWeekdayActivityCounts(activities: Activity[]) {
  const counts = Array.from({ length: 7 }, () => 0);

  activities.forEach((activity) => {
    const weekday = (new Date(activity.startedAt).getDay() + 6) % 7;
    counts[weekday] += 1;
  });

  return counts;
}

export function getPeriodNarrative({
  totals,
  activeDays,
  dominantSport,
  trendPercent,
}: {
  totals: ActivityTotals;
  activeDays: number;
  dominantSport: SportDistribution | null;
  trendPercent: number;
}) {
  const terrain =
    totals.elevation >= 3000
      ? "Le relief occupe une vraie place dans cette période."
      : totals.elevation >= 1000
        ? "Tes traces commencent à prendre de la hauteur."
        : "La régularité dessine le terrain avant les grands reliefs.";
  const rhythm =
    activeDays >= 12
      ? `${activeDays} jours actifs : ton carnet montre une belle constance.`
      : activeDays >= 5
        ? `${activeDays} jours actifs : un rythme posé et déjà bien installé.`
        : `${activeDays} jour${activeDays > 1 ? "s" : ""} actif${activeDays > 1 ? "s" : ""} : chaque nouvelle trace comptera.`;
  const mix = dominantSport
    ? `${dominantSport.label} donne le ton avec ${dominantSport.percent} % des activités.`
    : "Ton terrain favori se révélera au fil de tes prochaines activités.";
  const comparison =
    trendPercent > 0
      ? `La distance progresse de ${trendPercent} % par rapport à la période précédente.`
      : trendPercent < 0
        ? `Une période plus calme de ${Math.abs(trendPercent)} %, idéale pour préparer la suite.`
        : "Ton volume reste stable par rapport à la période précédente.";

  return { terrain, rhythm, mix, comparison };
}
