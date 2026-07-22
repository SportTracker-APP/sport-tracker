import type { Activity } from "@/lib/activities";
import {
  calculateGoalProgress,
  formatGoalValue,
  getGoalPeriodEndDate,
  selectPrimaryGoal,
} from "@/lib/goal-progress";
import type { Goal } from "@/lib/goals";
import type { SummitBadge } from "@/lib/summit-api";
import type { SummitView } from "@/lib/summit-discovery";

export type RefugeActivity = {
  id: string;
  title: string;
  place: string;
  date: string;
  distance: string;
  elevation: string;
  imageUrl: string;
};

export type RefugeViewModel = {
  activityCount: number;
  summitCount: number;
  badgeCount: number;
  carnetProgress: number;
  latestSummit: {
    id: string;
    name: string;
    altitude: string;
    massif: string;
    description: string;
    imageUrl: string;
  } | null;
  nextBadge: {
    name: string;
    remainingLabel: string;
  } | null;
  recentActivities: RefugeActivity[];
  challenge: {
    title: string;
    description: string;
    currentLabel: string;
    targetLabel: string;
    deadlineLabel: string;
    progress: number;
    completed: boolean;
  };
};

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date(value))
    .replace(".", "");
}

function getActivityTitle(activity: Activity) {
  return activity.title?.trim() || "Sortie outdoor";
}

function getActivityPlace(activity: Activity) {
  if (activity.city && activity.country) {
    return `${activity.city} · ${activity.country}`;
  }

  return activity.city || activity.country || "Trace HOVREN";
}

function getSafeImageUrl(value: string | null | undefined) {
  if (!value) {
    return "/landing/alpine-forest-card.png";
  }

  if (value.startsWith("/") || value.includes(".supabase.co/")) {
    return value;
  }

  return "/landing/alpine-forest-card.png";
}

function mapActivity(activity: Activity): RefugeActivity {
  return {
    id: activity.id,
    title: getActivityTitle(activity),
    place: getActivityPlace(activity),
    date: formatDate(activity.startedAt),
    distance: `${numberFormatter.format(activity.distance || 0)} km`,
    elevation: `${integerFormatter.format(activity.elevationGain || 0)} m D+`,
    imageUrl: getSafeImageUrl(activity.coverImageUrl),
  };
}

function getBadgeRemainingLabel(badge: SummitBadge) {
  if (!badge.progress) {
    return badge.hint;
  }

  const remaining = Math.max(0, badge.progress.target - badge.progress.current);

  if (remaining === 0) {
    return "Prêt à rejoindre ta collection.";
  }

  return `Plus que ${integerFormatter.format(remaining)} ${badge.progress.unit} avant de le débloquer.`;
}

function getDeadlineLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const days = Math.max(
    0,
    Math.ceil((end.getTime() - today.getTime()) / 86_400_000),
  );

  return days === 0 ? "Aujourd’hui" : `${days} j`;
}

export function createRefugeViewModel(input: {
  activities: Activity[];
  summits: SummitView[];
  badges: SummitBadge[];
  goals: Goal[];
}): RefugeViewModel {
  const completedActivities = input.activities
    .filter((activity) => activity.status !== "PLANNED")
    .sort(
      (first, second) =>
        new Date(second.startedAt).getTime() -
        new Date(first.startedAt).getTime(),
    );
  const discoveredSummits = input.summits
    .filter((summit) => summit.discovered)
    .sort(
      (first, second) =>
        new Date(second.latestDiscoveredAt || 0).getTime() -
        new Date(first.latestDiscoveredAt || 0).getTime(),
    );
  const latestSummit = discoveredSummits[0] ?? null;
  const unlockedBadges = input.badges.filter((badge) => badge.unlocked);
  const nextBadge = input.badges
    .filter((badge) => !badge.unlocked)
    .sort((first, second) => {
      const firstProgress = first.progress
        ? first.progress.current / Math.max(1, first.progress.target)
        : 0;
      const secondProgress = second.progress
        ? second.progress.current / Math.max(1, second.progress.target)
        : 0;

      return secondProgress - firstProgress;
    })[0];
  const primaryGoal = selectPrimaryGoal(input.goals);
  const goalProgress = calculateGoalProgress(primaryGoal, completedActivities);

  return {
    activityCount: completedActivities.length,
    summitCount: discoveredSummits.length,
    badgeCount: unlockedBadges.length,
    carnetProgress:
      input.summits.length > 0
        ? Math.round((discoveredSummits.length / input.summits.length) * 100)
        : 0,
    latestSummit: latestSummit
      ? {
          id: latestSummit.id,
          name: latestSummit.name,
          altitude: `${integerFormatter.format(latestSummit.altitude)} m`,
          massif: latestSummit.massif,
          description: `Une trace qui enrichit ton carnet dans le massif ${latestSummit.massif}.`,
          imageUrl: getSafeImageUrl(
            latestSummit.imageUrl || latestSummit.latestActivity?.coverImageUrl,
          ),
        }
      : null,
    nextBadge: nextBadge
      ? {
          name: nextBadge.name,
          remainingLabel: getBadgeRemainingLabel(nextBadge),
        }
      : null,
    recentActivities: completedActivities.slice(0, 4).map(mapActivity),
    challenge: {
      title: primaryGoal.title,
      description: `Avance à ton rythme vers ${formatGoalValue(primaryGoal.target, primaryGoal.type)} sur la période.`,
      currentLabel: formatGoalValue(goalProgress.current, primaryGoal.type),
      targetLabel: formatGoalValue(goalProgress.target, primaryGoal.type),
      deadlineLabel: getDeadlineLabel(getGoalPeriodEndDate(primaryGoal)),
      progress: goalProgress.progress,
      completed: goalProgress.progress >= 100,
    },
  };
}
