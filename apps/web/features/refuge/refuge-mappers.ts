import type { Activity } from "@/lib/activities";
import {
  calculateGoalProgress,
  formatGoalValue,
  getGoalPeriodEndDate,
  selectPrimaryGoal,
} from "@/lib/goal-progress";
import type { Goal } from "@/lib/goals";
import { getEditorialMountainImage } from "@/lib/mountain-visuals";
import type { SummitBadge } from "@/lib/summit-api";
import {
  getMassifProgress,
  type MassifProgress,
  type SummitView,
} from "@/lib/summit-discovery";

export type RefugeActivity = {
  id: string;
  title: string;
  place: string;
  date: string;
  distance: string;
  elevation: string;
  imageUrl: string;
};

export type RefugeStoryEvent = {
  id: string;
  kind: "activity" | "summit" | "badge" | "progress";
  label: string;
  title: string;
  description: string;
  date: string;
  href: string;
};

export type RefugeCollectionTerritory = {
  name: string;
  countLabel: string;
  progress: number;
};

export type RefugePrimaryAction = {
  kind: "sync" | "discovery" | "plan" | "explore";
  contextLabel: string;
  href: string;
  label: string;
  description: string;
};

export type RefugeViewModel = {
  welcomeMessage: string;
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
    progressLabel: string;
    progress: number;
  } | null;
  strongestMassif: RefugeCollectionTerritory | null;
  nextZone: RefugeCollectionTerritory | null;
  latestMilestone: {
    name: string;
    date: string;
  } | null;
  primaryAction: RefugePrimaryAction;
  storyEvents: RefugeStoryEvent[];
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

function mapActivity(activity: Activity): RefugeActivity {
  return {
    id: activity.id,
    title: getActivityTitle(activity),
    place: getActivityPlace(activity),
    date: formatDate(activity.startedAt),
    distance: `${numberFormatter.format(activity.distance || 0)} km`,
    elevation: `${integerFormatter.format(activity.elevationGain || 0)} m D+`,
    imageUrl: getEditorialMountainImage(`refuge-activity:${activity.id}`),
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

function getBadgeProgressLabel(badge: SummitBadge) {
  if (!badge.progress) {
    return "À découvrir";
  }

  return `${integerFormatter.format(badge.progress.current)} / ${integerFormatter.format(badge.progress.target)} ${badge.progress.unit}`;
}

function getBadgeProgress(badge: SummitBadge) {
  if (!badge.progress) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (badge.progress.current / Math.max(1, badge.progress.target)) * 100,
    ),
  );
}

function mapCollectionTerritory(
  massif: MassifProgress | undefined,
): RefugeCollectionTerritory | null {
  if (!massif) {
    return null;
  }

  const summitLabel = massif.total > 1 ? "sommets" : "sommet";

  return {
    name: massif.massif,
    countLabel: `${integerFormatter.format(massif.discovered)} / ${integerFormatter.format(massif.total)} ${summitLabel}`,
    progress: massif.progress,
  };
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

function isRecentDate(value: string | null, maximumAgeInDays: number) {
  if (!value) {
    return false;
  }

  const elapsed = Date.now() - new Date(value).getTime();

  return elapsed >= 0 && elapsed <= maximumAgeInDays * 86_400_000;
}

function getPrimaryAction(input: {
  completedActivities: Activity[];
  latestSummit: SummitView | null;
  nextZone: MassifProgress | undefined;
  plannedActivity: Activity | null;
}): RefugePrimaryAction {
  if (
    input.latestSummit?.latestDiscoveredAt &&
    isRecentDate(input.latestSummit.latestDiscoveredAt, 7)
  ) {
    return {
      kind: "discovery",
      contextLabel: "Nouvelle découverte",
      href: "/sommets",
      label: "Voir ma nouvelle découverte",
      description: `${input.latestSummit.name} vient de rejoindre ton carnet.`,
    };
  }

  if (input.plannedActivity) {
    return {
      kind: "plan",
      contextLabel: "Prochaine sortie",
      href: "/calendrier",
      label: "Préparer ma prochaine sortie",
      description: `${getActivityTitle(input.plannedActivity)} est la prochaine étape de ton carnet.`,
    };
  }

  if (input.completedActivities.length === 0) {
    return {
      kind: "sync",
      contextLabel: "Carnet à compléter",
      href: "/integrations/strava",
      label: "Synchroniser mes dernières sorties",
      description: "Importe tes traces pour révéler tes premiers sommets.",
    };
  }

  if (input.nextZone && input.nextZone.discovered > 0) {
    return {
      kind: "explore",
      contextLabel: "Massif à poursuivre",
      href: "/sommets",
      label: `Continuer le massif ${input.nextZone.massif}`,
      description: `${input.nextZone.discovered} sommet${input.nextZone.discovered > 1 ? "s" : ""} sur ${input.nextZone.total} déjà révélé${input.nextZone.discovered > 1 ? "s" : ""}.`,
    };
  }

  return {
    kind: "sync",
    contextLabel: "Carnet à actualiser",
    href: "/integrations/strava",
    label: "Synchroniser mes dernières sorties",
    description: "Récupère tes nouvelles traces et mets ton carnet à jour.",
  };
}

function getWelcomeMessage(action: RefugePrimaryAction) {
  if (action.kind === "discovery") {
    return "Une nouvelle découverte vient d’enrichir ton histoire.";
  }

  if (action.kind === "plan") {
    return "Ta prochaine aventure est déjà au programme.";
  }

  if (action.kind === "explore") {
    return "Ton carnet prend forme, massif après massif.";
  }

  if (action.contextLabel === "Carnet à compléter") {
    return "Ton carnet est prêt à accueillir ses premières traces.";
  }

  return "Tes dernières traces continuent de construire ton histoire.";
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
  const unlockedBadges = input.badges
    .filter((badge) => badge.unlocked)
    .sort(
      (first, second) =>
        new Date(second.unlockedAt || 0).getTime() -
        new Date(first.unlockedAt || 0).getTime(),
    );
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
  const latestActivity = completedActivities[0] ?? null;
  const plannedActivity =
    input.activities
      .filter(
        (activity) =>
          activity.status === "PLANNED" &&
          new Date(activity.startedAt).getTime() >= Date.now(),
      )
      .sort(
        (first, second) =>
          new Date(first.startedAt).getTime() -
          new Date(second.startedAt).getTime(),
      )[0] ?? null;
  const latestBadge = unlockedBadges[0] ?? null;
  const massifProgress = getMassifProgress(input.summits);
  const strongestMassif = [...massifProgress]
    .filter((massif) => massif.discovered > 0)
    .sort((first, second) => {
      if (second.discovered !== first.discovered) {
        return second.discovered - first.discovered;
      }

      if (second.progress !== first.progress) {
        return second.progress - first.progress;
      }

      return second.total - first.total;
    })[0];
  const nextZone = [...massifProgress]
    .filter((massif) => massif.progress < 100)
    .sort((first, second) => {
      const firstStarted = first.discovered > 0 ? 1 : 0;
      const secondStarted = second.discovered > 0 ? 1 : 0;

      if (secondStarted !== firstStarted) {
        return secondStarted - firstStarted;
      }

      if (second.progress !== first.progress) {
        return second.progress - first.progress;
      }

      const firstRemaining = first.total - first.discovered;
      const secondRemaining = second.total - second.discovered;

      if (firstRemaining !== secondRemaining) {
        return firstRemaining - secondRemaining;
      }

      return second.total - first.total;
    })[0];
  const carnetProgress =
    input.summits.length > 0
      ? Math.round((discoveredSummits.length / input.summits.length) * 100)
      : 0;
  const storyEvents: RefugeStoryEvent[] = [];

  if (latestActivity) {
    const activity = mapActivity(latestActivity);

    storyEvents.push({
      id: `activity-${activity.id}`,
      kind: "activity",
      label: latestActivity.stravaActivityId
        ? "Sortie synchronisée"
        : "Sortie enregistrée",
      title: activity.title,
      description: `${activity.distance} · ${activity.elevation} · ${activity.place}`,
      date: activity.date,
      href: `/activites/${activity.id}`,
    });
  }

  if (latestSummit?.latestDiscoveredAt) {
    storyEvents.push({
      id: `summit-${latestSummit.id}`,
      kind: "summit",
      label: "Sommet validé",
      title: latestSummit.name,
      description: `${integerFormatter.format(latestSummit.altitude)} m · ${latestSummit.massif}`,
      date: formatDate(latestSummit.latestDiscoveredAt),
      href: "/sommets",
    });
  }

  if (latestBadge?.unlockedAt) {
    storyEvents.push({
      id: `badge-${latestBadge.id}`,
      kind: "badge",
      label: "Badge débloqué",
      title: latestBadge.name,
      description: latestBadge.description,
      date: formatDate(latestBadge.unlockedAt),
      href: "/badges",
    });
  }

  if (storyEvents.length > 0 && input.summits.length > 0) {
    storyEvents.push({
      id: "carnet-progress",
      kind: "progress",
      label: "Carnet révélé",
      title: `${carnetProgress} % du carnet`,
      description: `${discoveredSummits.length} sommets validés sur ${input.summits.length} répertoriés.`,
      date: "État actuel",
      href: "/sommets",
    });
  }

  const primaryAction = getPrimaryAction({
    completedActivities,
    latestSummit,
    nextZone,
    plannedActivity,
  });

  return {
    welcomeMessage: getWelcomeMessage(primaryAction),
    activityCount: completedActivities.length,
    summitCount: discoveredSummits.length,
    badgeCount: unlockedBadges.length,
    carnetProgress,
    latestSummit: latestSummit
      ? {
          id: latestSummit.id,
          name: latestSummit.name,
          altitude: `${integerFormatter.format(latestSummit.altitude)} m`,
          massif: latestSummit.massif,
          description: `Une trace qui enrichit ton carnet dans le massif ${latestSummit.massif}.`,
          imageUrl: getEditorialMountainImage(
            `refuge-summit:${latestSummit.id}:${latestSummit.massif}`,
          ),
        }
      : null,
    nextBadge: nextBadge
      ? {
          name: nextBadge.name,
          remainingLabel: getBadgeRemainingLabel(nextBadge),
          progressLabel: getBadgeProgressLabel(nextBadge),
          progress: getBadgeProgress(nextBadge),
        }
      : null,
    strongestMassif: mapCollectionTerritory(strongestMassif),
    nextZone: mapCollectionTerritory(nextZone),
    latestMilestone: latestBadge?.unlockedAt
      ? {
          name: latestBadge.name,
          date: formatDate(latestBadge.unlockedAt),
        }
      : null,
    primaryAction,
    storyEvents,
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
