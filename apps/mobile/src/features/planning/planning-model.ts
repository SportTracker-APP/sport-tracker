import type { RefugeActivity } from '@/src/features/refuge/contracts';

export type PlanningDay = {
  activities: RefugeActivity[];
  date: Date;
  key: string;
};

export type PlanningSummary = {
  activeDays: number;
  completedDistance: number;
  completedDuration: number;
  plannedCount: number;
};

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});

const pad = (value: number) => String(value).padStart(2, '0');

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(first: Date, second: Date) {
  return localDateKey(first) === localDateKey(second);
}

export function activityDate(activity: RefugeActivity) {
  return new Date(activity.startedAt);
}

export function isCalendarActivity(activity: RefugeActivity) {
  return !activity.plannedWorkoutId;
}

export function createPlanningWeek(
  weekStart: Date,
  activities: RefugeActivity[],
): PlanningDay[] {
  const calendarActivities = activities.filter(isCalendarActivity);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      key: localDateKey(date),
      activities: calendarActivities
        .filter((activity) => {
          const startedAt = activityDate(activity);
          return !Number.isNaN(startedAt.getTime()) && isSameDay(startedAt, date);
        })
        .sort(
          (first, second) =>
            activityDate(first).getTime() - activityDate(second).getTime(),
        ),
    };
  });
}

export function getWeekSummary(days: PlanningDay[]): PlanningSummary {
  const activities = days.flatMap((day) => day.activities);
  const completed = activities.filter(
    (activity) =>
      activity.status === 'COMPLETED' && !activity.completedActivityId,
  );
  return {
    completedDistance: completed.reduce(
      (total, activity) => total + finitePositive(activity.distance),
      0,
    ),
    completedDuration: completed.reduce(
      (total, activity) => total + finitePositive(activity.duration),
      0,
    ),
    plannedCount: activities.filter((activity) => activity.status === 'PLANNED')
      .length,
    activeDays: days.filter((day) => day.activities.length > 0).length,
  };
}

export function getNextPlannedActivity(
  activities: RefugeActivity[],
  now = new Date(),
) {
  return (
    activities
      .filter(isCalendarActivity)
      .filter((activity) => activity.status === 'PLANNED')
      .filter((activity) => {
        const date = activityDate(activity);
        return !Number.isNaN(date.getTime()) && date.getTime() >= now.getTime();
      })
      .sort(
        (first, second) =>
          activityDate(first).getTime() - activityDate(second).getTime(),
      )[0] ?? null
  );
}

export function formatWeekPeriod(weekStart: Date) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const sameYear = weekStart.getFullYear() === end.getFullYear();
  if (sameMonth && sameYear)
    return `${weekStart.getDate()} — ${end.getDate()} ${monthFormatter.format(end)}`;
  const endLabel = `${end.getDate()} ${monthFormatter.format(end)}`;
  const startLabel = `${weekStart.getDate()} ${monthFormatter.format(weekStart)}`;
  return sameYear
    ? `${startLabel} — ${endLabel}`
    : `${startLabel} ${weekStart.getFullYear()} — ${endLabel} ${end.getFullYear()}`;
}

export function formatDuration(minutes?: number | null) {
  if (!Number.isFinite(minutes) || !minutes || minutes <= 0) return null;
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} h ${pad(remainder)}` : `${hours} h`;
}

export function formatDistance(distance?: number | null) {
  return Number.isFinite(distance) && distance != null && distance > 0
    ? `${numberFormatter.format(distance)} km`
    : null;
}

export function formatElevation(elevation?: number | null) {
  return Number.isFinite(elevation) && elevation != null && elevation > 0
    ? `${numberFormatter.format(elevation)} m D+`
    : null;
}

export function formatClock(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function getActivityTitle(activity: RefugeActivity) {
  return activity.title?.trim() || getSportLabel(activity.sport);
}

export function getSportLabel(sport: string) {
  return (
    {
      CLIMBING: 'Escalade',
      FITNESS: 'Fitness',
      GRAVEL: 'Gravel',
      GYM: 'Musculation',
      HIKING: 'Randonnée',
      MTB: 'VTT',
      ROAD_CYCLING: 'Vélo de route',
      RUNNING: 'Course à pied',
      SKI: 'Ski',
      SNOWBOARD: 'Snowboard',
      SWIMMING: 'Natation',
      TRAIL: 'Trail',
      WALKING: 'Marche',
    }[sport] ?? sport
  );
}

export function getActivityStatus(status: string) {
  if (status === 'PLANNED') return { label: 'Planifié', tone: 'planned' as const };
  if (status === 'MISSED') return { label: 'Manqué', tone: 'missed' as const };
  if (status === 'CANCELED') return { label: 'Annulé', tone: 'canceled' as const };
  return { label: 'Terminé', tone: 'completed' as const };
}

export function getActivityMeta(activity: RefugeActivity) {
  return [
    formatClock(activity.startedAt),
    formatDistance(activity.distance),
    formatDuration(activity.duration),
    activity.status === 'COMPLETED'
      ? formatElevation(activity.elevationGain)
      : null,
  ].filter((value): value is string => Boolean(value));
}

function finitePositive(value?: number | null) {
  return Number.isFinite(value) && value != null && value > 0 ? value : 0;
}
