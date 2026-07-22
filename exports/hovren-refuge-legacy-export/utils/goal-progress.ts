import type { Activity } from "./activities";
import type { Goal, GoalPeriod, GoalType } from "./goals";

export type GoalLike = Goal & {
  isSuggested?: boolean;
};

export type GoalProgress = {
  current: number;
  target: number;
  progress: number;
  remaining: number;
  activities: Activity[];
};

export const DEFAULT_MONTHLY_DISTANCE_TARGET = 30;

type GoalProgressOptions = {
  bounds?: {
    startDate: Date;
    endDate: Date;
  };
  useStoredDates?: boolean;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function endOfWeek(date: Date) {
  const nextDate = startOfWeek(date);

  nextDate.setDate(nextDate.getDate() + 6);
  nextDate.setHours(23, 59, 59, 999);

  return nextDate;
}

export function formatGoalValue(value: number, type: GoalType) {
  const roundedValue = Math.max(0, value);

  if (type === "DISTANCE_KM") {
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 1,
    }).format(roundedValue)} km`;
  }

  if (type === "ELEVATION_M") {
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(roundedValue)} m`;
  }

  if (type === "CALORIES") {
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(roundedValue);
  }

  if (type === "DURATION_MIN") {
    const minutes = Math.round(roundedValue);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    }

    return remainingMinutes === 0
      ? `${hours}H`
      : `${hours}H${String(remainingMinutes).padStart(2, "0")}`;
  }

  return `${Math.round(roundedValue)} sortie${
    Math.round(roundedValue) > 1 ? "s" : ""
  }`;
}

export function getGoalTypeLabel(type: GoalType) {
  const labels: Record<GoalType, string> = {
    ACTIVITY_COUNT: "Nombre de sorties",
    CALORIES: "Calories",
    DISTANCE_KM: "Distance",
    DURATION_MIN: "Temps sportif",
    ELEVATION_M: "Dénivelé",
  };

  return labels[type];
}

export function getGoalPeriodLabel(period: GoalPeriod) {
  const labels: Record<GoalPeriod, string> = {
    CUSTOM: "Période personnalisée",
    MONTHLY: "Objectif mensuel",
    WEEKLY: "Objectif hebdomadaire",
  };

  return labels[period];
}

export function getCurrentMonthSuggestedGoal(): GoalLike {
  const now = new Date();

  return {
    id: "suggested-monthly-distance",
    title: "30 km cette semaine",
    type: "DISTANCE_KM",
    sport: null,
    target: DEFAULT_MONTHLY_DISTANCE_TARGET,
    period: "WEEKLY",
    startDate: startOfWeek(now).toISOString(),
    endDate: endOfWeek(now).toISOString(),
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    isSuggested: true,
  };
}

export function getGoalPeriodBounds(goal: GoalLike, referenceDate = new Date()) {
  if (goal.period === "WEEKLY") {
    return {
      startDate: startOfWeek(referenceDate),
      endDate: endOfWeek(referenceDate),
    };
  }

  if (goal.period === "MONTHLY") {
    return {
      startDate: startOfMonth(referenceDate),
      endDate: endOfMonth(referenceDate),
    };
  }

  return {
    startDate: new Date(goal.startDate),
    endDate: new Date(goal.endDate),
  };
}

export function getStoredGoalPeriodBounds(goal: GoalLike) {
  return {
    startDate: new Date(goal.startDate),
    endDate: new Date(goal.endDate),
  };
}

export function getGoalPeriodEndDate(goal: GoalLike) {
  return getGoalPeriodBounds(goal).endDate;
}

export function selectPrimaryGoal(goals: Goal[]) {
  const now = Date.now();
  const activeGoals = goals
    .filter((goal) => {
      if (!goal.isActive) {
        return false;
      }

      if (goal.period === "WEEKLY" || goal.period === "MONTHLY") {
        return true;
      }

      const { startDate, endDate } = getGoalPeriodBounds(goal);

      return startDate.getTime() <= now && endDate.getTime() >= now;
    })
    .sort((firstGoal, secondGoal) => {
      const firstBounds = getGoalPeriodBounds(firstGoal);
      const secondBounds = getGoalPeriodBounds(secondGoal);
      const firstIsCurrent =
        firstBounds.startDate.getTime() <= now &&
        firstBounds.endDate.getTime() >= now;
      const secondIsCurrent =
        secondBounds.startDate.getTime() <= now &&
        secondBounds.endDate.getTime() >= now;

      if (Boolean(firstGoal.isPrimary) !== Boolean(secondGoal.isPrimary)) {
        return firstGoal.isPrimary ? -1 : 1;
      }

      if (firstIsCurrent !== secondIsCurrent) {
        return firstIsCurrent ? -1 : 1;
      }

      if (firstGoal.type !== secondGoal.type) {
        return firstGoal.type === "DISTANCE_KM" ? -1 : 1;
      }

      const endDateDiff =
        firstBounds.endDate.getTime() - secondBounds.endDate.getTime();

      if (endDateDiff !== 0) {
        return endDateDiff;
      }

      return (
        new Date(secondGoal.createdAt).getTime() -
        new Date(firstGoal.createdAt).getTime()
      );
    });

  return activeGoals[0] ?? getCurrentMonthSuggestedGoal();
}

export function calculateGoalProgress(
  goal: GoalLike,
  activities: Activity[],
  options: GoalProgressOptions = {},
) {
  const { startDate, endDate } =
    options.bounds ??
    (options.useStoredDates
      ? getStoredGoalPeriodBounds(goal)
      : getGoalPeriodBounds(goal));

  const goalActivities = activities.filter((activity) => {
    if (activity.status === "PLANNED") {
      return false;
    }

    if (goal.sport && activity.sport !== goal.sport) {
      return false;
    }

    const startedAt = new Date(activity.startedAt);

    return startedAt >= startDate && startedAt <= endDate;
  });

  const current = goalActivities.reduce((total, activity) => {
    if (goal.type === "DISTANCE_KM") {
      return total + (activity.distance || 0);
    }

    if (goal.type === "ELEVATION_M") {
      return total + (activity.elevationGain || 0);
    }

    if (goal.type === "CALORIES") {
      return total + (activity.calories || 0);
    }

    if (goal.type === "DURATION_MIN") {
      return total + (activity.duration || 0) / 60;
    }

    return total + 1;
  }, 0);

  const progress =
    goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;

  return {
    current,
    target: goal.target,
    progress,
    remaining: Math.max(0, goal.target - current),
    activities: goalActivities,
  } satisfies GoalProgress;
}
