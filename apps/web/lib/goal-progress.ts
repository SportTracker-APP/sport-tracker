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

  return `${Math.round(roundedValue)} sortie${Math.round(roundedValue) > 1 ? "s" : ""}`;
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

export function selectPrimaryGoal(goals: Goal[]) {
  const now = Date.now();
  const activeGoals = goals
    .filter((goal) => goal.isActive)
    .sort((firstGoal, secondGoal) => {
      const firstIsCurrent =
        new Date(firstGoal.startDate).getTime() <= now &&
        new Date(firstGoal.endDate).getTime() >= now;
      const secondIsCurrent =
        new Date(secondGoal.startDate).getTime() <= now &&
        new Date(secondGoal.endDate).getTime() >= now;

      if (firstIsCurrent !== secondIsCurrent) {
        return firstIsCurrent ? -1 : 1;
      }

      if (firstGoal.type !== secondGoal.type) {
        return firstGoal.type === "DISTANCE_KM" ? -1 : 1;
      }

      return (
        new Date(firstGoal.endDate).getTime() -
        new Date(secondGoal.endDate).getTime()
      );
    });

  return activeGoals[0] ?? getCurrentMonthSuggestedGoal();
}

export function calculateGoalProgress(goal: GoalLike, activities: Activity[]) {
  const startDate = new Date(goal.startDate);
  const endDate = new Date(goal.endDate);
  const goalActivities = activities.filter((activity) => {
    if (activity.status === "PLANNED") {
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
      return total + (activity.duration || 0);
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
