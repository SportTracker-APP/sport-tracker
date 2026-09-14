import type {
  RefugeActivity,
  RefugeBadge,
  RefugeGoal,
  RefugeGoalType,
  RefugeSummit,
} from '@/src/features/refuge/contracts';

export type RefugeHighlight =
  | {
      date: string;
      id: string;
      kind: 'activity';
      meta: string[];
      title: string;
    }
  | {
      date: string;
      id: string;
      kind: 'summit';
      meta: string[];
      summitName: string;
      title: string;
    };

export type RefugeRecentActivity = {
  date: string;
  id: string;
  meta: string;
  sport: string;
  title: string;
};

export type RefugeGoalProgress = {
  completed: boolean;
  currentLabel: string;
  deadlineLabel: string;
  progress: number;
  targetLabel: string;
  title: string;
};

export type RefugeViewModel = {
  activityCount: number | null;
  badgeCount: number | null;
  carnetProgress: number | null;
  catalogCount: number | null;
  goal: RefugeGoalProgress | null;
  highlight: RefugeHighlight | null;
  recentActivities: RefugeRecentActivity[] | null;
  summitCount: number | null;
  welcomeMessage: string;
};

const decimalFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

function toTimestamp(value: string | null | undefined) {
  const timestamp = value ? new Date(value).getTime() : Number.NaN;

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function positiveNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

export function formatDate(value: string) {
  const timestamp = toTimestamp(value);

  if (!timestamp) {
    return 'Date non renseignée';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(timestamp))
    .replace('.', '');
}

export function isRecordedCompletedActivity(
  activity: RefugeActivity,
  now = Date.now(),
) {
  const startedAt = toTimestamp(activity.startedAt);

  if (
    activity.status !== 'COMPLETED' ||
    activity.completedActivityId ||
    !startedAt ||
    startedAt > now
  ) {
    return false;
  }

  return Boolean(
    activity.stravaActivityId ||
    activity.routePolyline ||
    positiveNumber(activity.distance) > 0 ||
    positiveNumber(activity.duration) > 0 ||
    positiveNumber(activity.elevationGain) > 0,
  );
}

function isStrengthActivity(activity: RefugeActivity) {
  return activity.sport.trim().toUpperCase() === 'GYM';
}

export function getActivityTitle(activity: RefugeActivity) {
  return (
    activity.title?.trim() ||
    (isStrengthActivity(activity) ? 'Séance de musculation' : 'Sortie outdoor')
  );
}

function getActivityPlace(activity: RefugeActivity) {
  return [activity.city?.trim(), activity.country?.trim()]
    .filter(Boolean)
    .join(' · ');
}

export function getActivityMeta(activity: RefugeActivity) {
  const meta: string[] = [];
  const distance = positiveNumber(activity.distance);
  const elevation = positiveNumber(activity.elevationGain);
  const place = getActivityPlace(activity);

  if (distance > 0) meta.push(`${decimalFormatter.format(distance)} km`);
  if (elevation > 0) meta.push(`${integerFormatter.format(elevation)} m D+`);
  if (place) meta.push(place);

  return meta;
}

function getSummitMassif(summit: RefugeSummit) {
  return (
    summit.primaryMassif?.name?.trim() ||
    summit.geoAreas?.find((area) => area.type === 'MASSIF')?.name.trim() ||
    summit.massif?.trim() ||
    ''
  );
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfWeek(date: Date) {
  const result = startOfWeek(date);

  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);

  return result;
}

function getGoalBounds(goal: RefugeGoal, now: Date) {
  if (goal.period === 'WEEKLY') {
    return { start: startOfWeek(now), end: endOfWeek(now) };
  }

  if (goal.period === 'MONTHLY') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  return { start: new Date(goal.startDate), end: new Date(goal.endDate) };
}

function selectPrimaryGoal(goals: RefugeGoal[], now: Date) {
  const nowTimestamp = now.getTime();

  return [...goals]
    .filter((goal) => {
      if (!goal.isActive || goal.target <= 0) return false;
      if (goal.period !== 'CUSTOM') return true;

      const { start, end } = getGoalBounds(goal, now);

      return start.getTime() <= nowTimestamp && end.getTime() >= nowTimestamp;
    })
    .sort((first, second) => {
      if (Boolean(first.isPrimary) !== Boolean(second.isPrimary)) {
        return first.isPrimary ? -1 : 1;
      }

      const firstBounds = getGoalBounds(first, now);
      const secondBounds = getGoalBounds(second, now);
      const firstIsCurrent =
        firstBounds.start.getTime() <= nowTimestamp &&
        firstBounds.end.getTime() >= nowTimestamp;
      const secondIsCurrent =
        secondBounds.start.getTime() <= nowTimestamp &&
        secondBounds.end.getTime() >= nowTimestamp;

      if (firstIsCurrent !== secondIsCurrent) {
        return firstIsCurrent ? -1 : 1;
      }

      if (first.type !== second.type) {
        return first.type === 'DISTANCE_KM' ? -1 : 1;
      }

      const endDateDifference =
        firstBounds.end.getTime() - secondBounds.end.getTime();

      if (endDateDifference !== 0) {
        return endDateDifference;
      }

      return toTimestamp(second.createdAt) - toTimestamp(first.createdAt);
    })[0];
}

function getGoalActivityValue(activity: RefugeActivity, type: RefugeGoalType) {
  if (type === 'DISTANCE_KM') return positiveNumber(activity.distance);
  if (type === 'ELEVATION_M') return positiveNumber(activity.elevationGain);
  if (type === 'CALORIES') return positiveNumber(activity.calories);
  if (type === 'DURATION_MIN') return positiveNumber(activity.duration);

  return 1;
}

function formatGoalValue(value: number, type: RefugeGoalType) {
  if (type === 'DISTANCE_KM') return `${decimalFormatter.format(value)} km`;
  if (type === 'ELEVATION_M') return `${integerFormatter.format(value)} m`;
  if (type === 'DURATION_MIN') {
    const minutes = Math.round(value);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (!hours) return `${minutes} min`;
    return remainingMinutes
      ? `${hours} h ${remainingMinutes} min`
      : `${hours} h`;
  }
  if (type === 'ACTIVITY_COUNT') {
    const count = Math.round(value);
    return `${count} sortie${count > 1 ? 's' : ''}`;
  }

  return integerFormatter.format(value);
}

export function createGoalProgress(
  goals: RefugeGoal[],
  activities: RefugeActivity[],
): RefugeGoalProgress | null {
  const now = new Date();
  const goal = selectPrimaryGoal(goals, now);

  if (!goal) return null;

  const { start, end } = getGoalBounds(goal, now);
  const current = activities
    .filter((activity) => {
      if (!isRecordedCompletedActivity(activity)) return false;
      if (goal.sport && activity.sport !== goal.sport) return false;

      const startedAt = toTimestamp(activity.startedAt);
      return startedAt >= start.getTime() && startedAt <= end.getTime();
    })
    .reduce(
      (total, activity) => total + getGoalActivityValue(activity, goal.type),
      0,
    );
  const progress = Math.min(100, Math.round((current / goal.target) * 100));
  const remainingDays = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / 86_400_000),
  );

  return {
    completed: progress >= 100,
    currentLabel: formatGoalValue(current, goal.type),
    deadlineLabel:
      remainingDays === 0 ? 'Dernier jour' : `${remainingDays} j restants`,
    progress,
    targetLabel: formatGoalValue(goal.target, goal.type),
    title: goal.title,
  };
}

function createActivityHighlight(activity: RefugeActivity): RefugeHighlight {
  return {
    date: formatDate(activity.startedAt),
    id: activity.id,
    kind: 'activity',
    meta: getActivityMeta(activity),
    title: getActivityTitle(activity),
  };
}

function createSummitHighlight(summit: RefugeSummit): RefugeHighlight {
  const massif = getSummitMassif(summit);
  const altitude = positiveNumber(summit.altitude);

  return {
    date: formatDate(summit.latestDiscoveredAt ?? ''),
    id: summit.id,
    kind: 'summit',
    meta: [
      ...(altitude > 0 ? [`${integerFormatter.format(altitude)} m`] : []),
      ...(massif ? [massif] : []),
    ],
    summitName: summit.name,
    title: summit.name,
  };
}

export function createRefugeViewModel(input: {
  activities: RefugeActivity[] | null;
  badges: RefugeBadge[] | null;
  goals: RefugeGoal[] | null;
  summits: RefugeSummit[] | null;
}): RefugeViewModel {
  const completedActivities = input.activities
    ? input.activities
        .filter((activity) => isRecordedCompletedActivity(activity))
        .sort(
          (first, second) =>
            toTimestamp(second.startedAt) - toTimestamp(first.startedAt),
        )
    : null;
  const discoveredSummits = input.summits
    ? input.summits
        .filter((summit) => summit.discovered)
        .sort(
          (first, second) =>
            toTimestamp(second.latestDiscoveredAt) -
            toTimestamp(first.latestDiscoveredAt),
        )
    : null;
  const unlockedBadges =
    input.badges?.filter((badge) => badge.unlocked) ?? null;
  const latestActivity = completedActivities?.[0];
  const latestSummit = discoveredSummits?.[0];
  const latestActivityTime = toTimestamp(latestActivity?.startedAt);
  const latestSummitTime = toTimestamp(latestSummit?.latestDiscoveredAt);
  const highlight =
    latestSummit && latestSummitTime >= latestActivityTime
      ? createSummitHighlight(latestSummit)
      : latestActivity
        ? createActivityHighlight(latestActivity)
        : null;
  const summitCount = discoveredSummits?.length ?? null;
  const catalogCount = input.summits?.length ?? null;
  const carnetProgress =
    summitCount !== null && catalogCount !== null
      ? catalogCount > 0
        ? Math.round((summitCount / catalogCount) * 100)
        : 0
      : null;

  let welcomeMessage = 'Ton histoire outdoor commence ici.';

  if (highlight?.kind === 'summit') {
    welcomeMessage = 'Une nouvelle cime a rejoint ton carnet.';
  } else if (highlight?.kind === 'activity') {
    welcomeMessage = 'Ta dernière trace continue d’écrire ton histoire.';
  } else if (
    completedActivities?.length === 0 &&
    discoveredSummits?.length === 0
  ) {
    welcomeMessage = 'Ton carnet est prêt à accueillir sa première trace.';
  }

  return {
    activityCount: completedActivities?.length ?? null,
    badgeCount: unlockedBadges?.length ?? null,
    carnetProgress,
    catalogCount,
    goal:
      input.goals && completedActivities
        ? createGoalProgress(input.goals, completedActivities)
        : null,
    highlight,
    recentActivities:
      completedActivities?.slice(0, 3).map((activity) => ({
        date: formatDate(activity.startedAt),
        id: activity.id,
        meta: getActivityMeta(activity).slice(0, 2).join(' · '),
        sport: activity.sport,
        title: getActivityTitle(activity),
      })) ?? null,
    summitCount,
    welcomeMessage,
  };
}
