import type { Activity } from "@/lib/activities";

export type ActivityChartPeriod = "7d" | "30d" | "3m" | "1y";

export type ActivityChartDatum = {
  day: string;
  distance: number;
  elevation: number;
  duration: number;
};

type ChartActivity = Pick<
  Activity,
  "distance" | "duration" | "elevationGain" | "startedAt"
>;

type ActivityChartPeriodConfiguration = {
  label: string;
  title: string;
  granularityLabel: string;
};

type ActivityBucket = {
  start: Date;
  end: Date;
  label: string;
};

export const ACTIVITY_CHART_PERIOD_STORAGE_KEY = "hovren.activityChart.period";

export const ACTIVITY_CHART_PERIOD_OPTIONS: ReadonlyArray<{
  value: ActivityChartPeriod;
  label: string;
}> = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "3m", label: "3 derniers mois" },
  { value: "1y", label: "12 derniers mois" },
];

const PERIOD_CONFIGURATIONS: Record<
  ActivityChartPeriod,
  ActivityChartPeriodConfiguration
> = {
  "7d": {
    label: "7 derniers jours",
    title: "Activité sur les 7 derniers jours",
    granularityLabel: "jour par jour",
  },
  "30d": {
    label: "30 derniers jours",
    title: "Activité sur les 30 derniers jours",
    granularityLabel: "jour par jour",
  },
  "3m": {
    label: "3 derniers mois",
    title: "Activité sur les 3 derniers mois",
    granularityLabel: "semaine par semaine",
  },
  "1y": {
    label: "12 derniers mois",
    title: "Activité sur les 12 derniers mois",
    granularityLabel: "mois par mois",
  },
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

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function createDailyBuckets(start: Date, count: number): ActivityBucket[] {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = addDays(start, index);

    return {
      start: bucketStart,
      end: addDays(bucketStart, 1),
      label: formatDayLabel(bucketStart),
    };
  });
}

function createWeeklyBuckets(start: Date, end: Date): ActivityBucket[] {
  const buckets: ActivityBucket[] = [];
  let bucketStart = start;

  while (bucketStart.getTime() < end.getTime()) {
    const nextStart = addDays(bucketStart, 7);

    buckets.push({
      start: bucketStart,
      end: nextStart.getTime() < end.getTime() ? nextStart : end,
      label: formatDayLabel(bucketStart),
    });
    bucketStart = nextStart;
  }

  return buckets;
}

function createMonthlyBuckets(start: Date, count: number): ActivityBucket[] {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = addMonths(start, index);

    return {
      start: bucketStart,
      end: addMonths(bucketStart, 1),
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(
        bucketStart,
      ),
    };
  });
}

function getPeriodBounds(period: ActivityChartPeriod, now: Date) {
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

function getBuckets(period: ActivityChartPeriod, start: Date, end: Date) {
  if (period === "7d") {
    return createDailyBuckets(start, 7);
  }

  if (period === "30d") {
    return createDailyBuckets(start, 30);
  }

  if (period === "3m") {
    return createWeeklyBuckets(start, end);
  }

  return createMonthlyBuckets(start, 12);
}

export function isActivityChartPeriod(
  value: string | null,
): value is ActivityChartPeriod {
  return value === "7d" || value === "30d" || value === "3m" || value === "1y";
}

export function getActivityChartSummary<TActivity extends ChartActivity>(
  activities: TActivity[],
  period: ActivityChartPeriod,
  now = new Date(),
) {
  const configuration = PERIOD_CONFIGURATIONS[period];
  const { start, end } = getPeriodBounds(period, now);
  const periodActivities = activities.filter((activity) => {
    const startedAt = new Date(activity.startedAt).getTime();
    return startedAt >= start.getTime() && startedAt < end.getTime();
  });
  const buckets = getBuckets(period, start, end);
  const chartData = buckets.map<ActivityChartDatum>((bucket) => {
    const bucketActivities = periodActivities.filter((activity) => {
      const startedAt = new Date(activity.startedAt).getTime();
      return (
        startedAt >= bucket.start.getTime() && startedAt < bucket.end.getTime()
      );
    });

    return {
      day: bucket.label,
      distance: Number(
        bucketActivities
          .reduce((total, activity) => total + (activity.distance ?? 0), 0)
          .toFixed(2),
      ),
      elevation: Math.round(
        bucketActivities.reduce(
          (total, activity) => total + (activity.elevationGain ?? 0),
          0,
        ),
      ),
      duration: Number(
        (
          bucketActivities.reduce(
            (total, activity) => total + activity.duration,
            0,
          ) / 60
        ).toFixed(2),
      ),
    };
  });
  const totalDistance = periodActivities.reduce(
    (total, activity) => total + (activity.distance ?? 0),
    0,
  );
  const totalDuration = periodActivities.reduce(
    (total, activity) => total + activity.duration,
    0,
  );
  const totalElevation = periodActivities.reduce(
    (total, activity) => total + (activity.elevationGain ?? 0),
    0,
  );
  const bestActivity = periodActivities.reduce<TActivity | null>(
    (best, activity) =>
      !best || (activity.distance ?? 0) > (best.distance ?? 0)
        ? activity
        : best,
    null,
  );

  return {
    bestActivity,
    chartData,
    configuration,
    periodActivities,
    totalDistance,
    totalDuration,
    totalElevation,
  };
}
