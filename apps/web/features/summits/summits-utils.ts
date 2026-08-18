import {
  getMassifProgress,
  getSummitSearchNames,
  type MassifProgress,
  type SummitView,
} from "@/lib/summit-discovery";
import {
  getEditorialMountainImage,
  isApprovedSummitImageUrl,
} from "@/lib/mountain-visuals";
import { normalizeSummitName } from "@/lib/summits";

import type {
  SummitAltitudeFilter,
  SummitCardSecondaryInfo,
  SummitCardViewModel,
  SummitCollectionSummary,
  SummitFilterState,
  SummitSortMode,
  SummitStatusFilter,
  SummitVisualSource,
  SummitViewMode,
} from "./summits-types";

export const DEFAULT_SUMMIT_FILTERS: SummitFilterState = {
  status: "DISCOVERED",
  viewMode: "CARDS",
  searchQuery: "",
  massif: "ALL",
  difficulty: "ALL",
  altitude: "ALL",
  sort: "DISCOVERY",
};

const STATUS_QUERY_VALUES: Record<SummitStatusFilter, string> = {
  ALL: "tous",
  DISCOVERED: "decouverts",
  PENDING: "a-confirmer",
  MISSING: "a-decouvrir",
};

const VIEW_QUERY_VALUES: Record<SummitViewMode, string> = {
  CARDS: "grille",
  TABLE: "liste",
};

export function formatSummitDate(value: string | null | undefined) {
  if (!value) {
    return "Pas encore visité";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatSummitDistance(distance: number | null) {
  if (distance === null) {
    return "—";
  }

  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance / 1000)} km`;
}

export function formatSummitAltitude(altitude: number) {
  return `${new Intl.NumberFormat("fr-FR").format(altitude)} m`;
}

export function formatActivityDistance(distance: number | null) {
  if (distance === null) {
    return null;
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance)} km`;
}

export function formatElevationGain(elevationGain: number | null) {
  if (elevationGain === null) {
    return null;
  }

  return `${new Intl.NumberFormat("fr-FR").format(elevationGain)} m D+`;
}

export function getSummitHref(summit: Pick<SummitView, "id">) {
  return `/sommets?sommet=${summit.id}#sommet-${summit.id}`;
}

export function isRecentSummitDiscovery(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const discoveredAt = new Date(value).getTime();

  return (
    !Number.isNaN(discoveredAt) && Date.now() - discoveredAt <= 7 * 86_400_000
  );
}

export function getSummitStatus(summit: SummitView) {
  if (summit.discovered) {
    return "DISCOVERED" as const;
  }

  if (summit.pendingDiscoveries.length > 0) {
    return "PENDING" as const;
  }

  return "MISSING" as const;
}

export function getSummitStory(summit: SummitView) {
  if (summit.discovered && summit.latestActivity) {
    return `Cette page de ton carnet est liée à « ${
      summit.latestActivity.title ?? "une sortie"
    } ».`;
  }

  if (summit.pendingDiscoveries[0]) {
    return `Ta trace est passée à ${formatSummitDistance(
      summit.pendingDiscoveries[0].closestDistance,
    )} de ce sommet.`;
  }

  return `Encore à explorer dans le massif ${summit.massif}.`;
}

export function getSummitDistanceLabel(summit: SummitView) {
  if (summit.discovered) {
    return summit.activityCount > 1
      ? `${summit.activityCount} passages`
      : "1 passage";
  }

  return summit.closestDistance === null
    ? "À placer sur une trace"
    : `${formatSummitDistance(summit.closestDistance)} au plus proche`;
}

function matchesAltitude(
  summit: SummitView,
  altitudeFilter: SummitAltitudeFilter,
) {
  if (altitudeFilter === "LOW") {
    return summit.altitude < 1500;
  }

  if (altitudeFilter === "MID") {
    return summit.altitude >= 1500 && summit.altitude < 2200;
  }

  if (altitudeFilter === "HIGH") {
    return summit.altitude >= 2200 && summit.altitude < 3000;
  }

  if (altitudeFilter === "ALPINE") {
    return summit.altitude >= 3000;
  }

  return true;
}

function getDiscoveryTime(summit: SummitView) {
  return new Date(
    summit.firstDiscoveredAt ??
      summit.firstActivity?.startedAt ??
      summit.latestDiscoveredAt ??
      summit.latestActivity?.startedAt ??
      0,
  ).getTime();
}

function getClosestDistanceValue(summit: SummitView) {
  return summit.closestDistance ?? Number.POSITIVE_INFINITY;
}

export function sortSummits(summits: SummitView[], sortMode: SummitSortMode) {
  return summits.slice().sort((firstSummit, secondSummit) => {
    if (sortMode === "ALTITUDE_DESC") {
      return secondSummit.altitude - firstSummit.altitude;
    }

    if (sortMode === "ALTITUDE_ASC") {
      return firstSummit.altitude - secondSummit.altitude;
    }

    if (sortMode === "NAME") {
      return firstSummit.name.localeCompare(secondSummit.name, "fr");
    }

    if (sortMode === "PASSES") {
      return secondSummit.activityCount - firstSummit.activityCount;
    }

    return getDiscoveryTime(secondSummit) - getDiscoveryTime(firstSummit);
  });
}

export function filterSummits(
  summits: SummitView[],
  filters: SummitFilterState,
) {
  const normalizedSearch = normalizeSummitName(filters.searchQuery);

  return sortSummits(
    summits.filter((summit) => {
      const status = getSummitStatus(summit);
      const searchedSecondary =
        Boolean(normalizedSearch) && summit.catalogTier === "SECONDARY";

      if (
        !searchedSecondary &&
        filters.status !== "ALL" &&
        status !== filters.status
      ) {
        return false;
      }

      if (filters.massif !== "ALL" && summit.massif !== filters.massif) {
        return false;
      }

      if (
        filters.difficulty !== "ALL" &&
        summit.difficulty !== filters.difficulty
      ) {
        return false;
      }

      if (!matchesAltitude(summit, filters.altitude)) {
        return false;
      }

      return (
        !normalizedSearch ||
        getSummitSearchNames(summit).some((summitName) =>
          summitName.includes(normalizedSearch),
        )
      );
    }),
    filters.sort,
  );
}

export function getSummitSummary(
  summits: SummitView[],
): SummitCollectionSummary {
  const discoveredSummits = summits.filter((summit) => summit.discovered);
  const pendingSummits = summits.filter(
    (summit) => getSummitStatus(summit) === "PENDING",
  );
  const missingSummits = summits.filter(
    (summit) => getSummitStatus(summit) === "MISSING",
  );
  const massifProgress = getMassifProgress(summits);

  return {
    discoveredCount: discoveredSummits.length,
    pendingCount: pendingSummits.length,
    missingCount: missingSummits.length,
    totalCount: summits.length,
    coveredMassifs: new Set(discoveredSummits.map((summit) => summit.massif))
      .size,
    completedMassifs: massifProgress.filter((massif) => massif.progress === 100)
      .length,
    totalPassages: discoveredSummits.reduce(
      (total, summit) => total + summit.activityCount,
      0,
    ),
    discoveryProgress:
      summits.length === 0
        ? 0
        : Math.round((discoveredSummits.length / summits.length) * 100),
    highestAltitude:
      discoveredSummits.length === 0
        ? null
        : Math.max(...discoveredSummits.map((summit) => summit.altitude)),
  };
}

function isGenericEditorialCredit(credit: string | undefined) {
  if (!credit) {
    return true;
  }

  const normalizedCredit = normalizeSummitName(credit);

  return [
    "image montagne",
    "photo montagne",
    "pexels",
    "unsplash",
    "image generique",
  ].some((genericCredit) => normalizedCredit.includes(genericCredit));
}

function getVerifiedSummitVisual(
  summit: SummitView,
): SummitVisualSource | null {
  if (
    !summit.imageUrl ||
    !isApprovedSummitImageUrl(summit.imageUrl) ||
    isGenericEditorialCredit(summit.imageCredit)
  ) {
    return null;
  }

  return {
    kind: "editorial",
    src: summit.imageUrl,
    alt: `Vue de ${summit.name}`,
    credit: summit.imageCredit ?? "Source éditoriale",
    creditUrl: summit.sourceUrl ?? null,
  };
}

function getEditorialFallbackVisual(summit: SummitView): SummitVisualSource {
  return {
    kind: "editorial",
    src: getEditorialMountainImage(
      `summit:${summit.id}:${summit.name}:${summit.massif}`,
    ),
    alt: `Paysage alpin sélectionné pour ${summit.name}`,
    credit: "Sélection HOVREN",
    creditUrl: null,
  };
}

export function getSummitVisualSource(summit: SummitView): SummitVisualSource {
  return getVerifiedSummitVisual(summit) ?? getEditorialFallbackVisual(summit);
}

function getMassifVisualCandidate(
  summit: SummitView,
  catalogSummits: SummitView[],
) {
  const sourceSummit = catalogSummits.find((candidate) => {
    return (
      candidate.id !== summit.id &&
      candidate.massif === summit.massif &&
      getVerifiedSummitVisual(candidate) !== null
    );
  });
  const sourceVisual = sourceSummit
    ? getVerifiedSummitVisual(sourceSummit)
    : null;

  if (!sourceVisual?.src) {
    return null;
  }

  return {
    kind: "massif",
    src: sourceVisual.src,
    alt: `Vue du massif ${summit.massif}`,
    credit: sourceVisual.credit,
    creditUrl: sourceVisual.creditUrl,
  } satisfies SummitVisualSource;
}

export function getSummitVisualSources(
  summits: SummitView[],
  catalogSummits: SummitView[] = summits,
) {
  const usedSources = new Set<string>();

  return summits.reduce<Record<string, SummitVisualSource>>(
    (visuals, summit) => {
      const summitVisual = getVerifiedSummitVisual(summit);
      const massifVisual = getMassifVisualCandidate(summit, catalogSummits);
      const candidates = [
        ...(summitVisual ? [summitVisual] : []),
        ...(massifVisual ? [massifVisual] : []),
        getEditorialFallbackVisual(summit),
      ];
      const selectedVisual = candidates.find(
        (candidate) => candidate.src && !usedSources.has(candidate.src),
      );

      if (selectedVisual?.src) {
        usedSources.add(selectedVisual.src);
      }

      visuals[summit.id] = selectedVisual ?? getEditorialFallbackVisual(summit);
      return visuals;
    },
    {},
  );
}

export function getMassifVisualSource(
  summits: SummitView[],
  massif: string,
): SummitVisualSource | null {
  const massifSummits = summits
    .filter((summit) => summit.massif === massif)
    .sort(
      (firstSummit, secondSummit) =>
        Number(secondSummit.discovered) - Number(firstSummit.discovered),
    );
  const source = massifSummits
    .map(getVerifiedSummitVisual)
    .find((candidate) => candidate?.src);

  if (!source?.src) {
    return {
      kind: "massif",
      src: getEditorialMountainImage(`massif:${massif}`),
      alt: `Paysage alpin sélectionné pour le massif ${massif}`,
      credit: "Sélection HOVREN",
      creditUrl: null,
    };
  }

  return {
    kind: "massif",
    src: source.src,
    alt: `Vue du massif ${massif}`,
    credit: source.credit,
    creditUrl: source.creditUrl,
  };
}

function getMassifProgressForSummit(
  summit: SummitView,
  massifProgress: MassifProgress[],
) {
  return massifProgress.find((massif) => massif.massif === summit.massif);
}

function getSummitSecondaryInfo(
  summit: SummitView,
  massifProgress: MassifProgress[],
): SummitCardSecondaryInfo {
  if (summit.catalogTier === "SECONDARY") {
    return {
      kind: "distance",
      label: "Sommet secondaire · repère informatif",
    };
  }

  const status = getSummitStatus(summit);
  const discoveryActivity = summit.firstActivity ?? summit.latestActivity;
  const pendingActivity = summit.pendingDiscoveries[0]?.activity;
  const activity = status === "PENDING" ? pendingActivity : discoveryActivity;

  if (activity?.title) {
    return {
      kind: "activity",
      label:
        status === "PENDING"
          ? `Proposé pendant « ${activity.title} »`
          : `Découvert pendant « ${activity.title} »`,
    };
  }

  const activityMetrics = [
    formatActivityDistance(activity?.distance ?? null),
    formatElevationGain(activity?.elevationGain ?? null),
  ].filter((metric): metric is string => Boolean(metric));

  if (activityMetrics.length > 0) {
    return {
      kind: "metrics",
      label: activityMetrics.join(" · "),
    };
  }

  const massif = getMassifProgressForSummit(summit, massifProgress);
  const remaining = massif ? massif.total - massif.discovered : null;

  if (remaining && remaining > 0) {
    return {
      kind: "massif",
      label: `Encore ${remaining} sommet${remaining > 1 ? "s" : ""} pour compléter ${summit.massif}`,
    };
  }

  return {
    kind: "distance",
    label:
      summit.closestDistance === null
        ? "Repère du catalogue HOVREN"
        : `${formatSummitDistance(summit.closestDistance)} au plus proche`,
  };
}

export function getSummitCardViewModels(
  summits: SummitView[],
  catalogSummits: SummitView[],
  massifProgress: MassifProgress[],
): SummitCardViewModel[] {
  const visualSources = getSummitVisualSources(summits, catalogSummits);

  return summits.map((summit) => {
    const status = getSummitStatus(summit);
    const pending = summit.pendingDiscoveries[0];
    const discoveryActivity = summit.firstActivity ?? summit.latestActivity;
    const linkedActivity =
      status === "PENDING" ? pending?.activity : discoveryActivity;
    const date =
      status === "DISCOVERED"
        ? (summit.firstDiscoveredAt ?? discoveryActivity?.startedAt)
        : status === "PENDING"
          ? pending?.activity.startedAt
          : null;
    const massif = getMassifProgressForSummit(summit, massifProgress);

    return {
      summit,
      summitId: summit.id,
      name: summit.name,
      massif: summit.massif,
      altitude: formatSummitAltitude(summit.altitude),
      difficulty: summit.difficulty,
      type: summit.type,
      status,
      statusLabel:
        summit.catalogTier === "SECONDARY"
          ? "Point remarquable"
          : status === "DISCOVERED"
            ? "Découvert"
            : status === "PENDING"
              ? "À confirmer"
              : "À découvrir",
      isNew:
        status === "DISCOVERED" &&
        isRecentSummitDiscovery(
          summit.firstDiscoveredAt ?? summit.firstActivity?.startedAt,
        ),
      dateLabel:
        date === null || date === undefined
          ? null
          : `${status === "PENDING" ? "Sortie du" : "Découvert le"} ${formatSummitDate(date)}`,
      passageLabel:
        summit.catalogTier === "SECONDARY"
          ? "Hors progression principale"
          : status === "DISCOVERED"
            ? `${summit.activityCount} passage${summit.activityCount > 1 ? "s" : ""}`
            : status === "PENDING"
              ? "Détection proche"
              : massif
                ? `${massif.discovered}/${massif.total} dans ${summit.massif}`
                : "À explorer",
      secondaryInfo: getSummitSecondaryInfo(summit, massifProgress),
      visual: visualSources[summit.id] ?? getEditorialFallbackVisual(summit),
      href: linkedActivity
        ? `/activites/${linkedActivity.id}`
        : getSummitHref(summit),
      ctaLabel: linkedActivity
        ? "Voir la trace"
        : summit.catalogTier === "SECONDARY"
          ? "Voir le repère"
          : status === "DISCOVERED"
            ? "Voir dans le carnet"
            : "Voir le sommet",
      pendingDiscoveryId: pending?.id ?? null,
    };
  });
}

export function getLatestDiscoveredSummit(summits: SummitView[]) {
  return summits
    .filter((summit) => summit.discovered)
    .slice()
    .sort(
      (firstSummit, secondSummit) =>
        getDiscoveryTime(secondSummit) - getDiscoveryTime(firstSummit),
    )[0];
}

export function getRecommendedSummit(
  summits: SummitView[],
  massifProgress: MassifProgress[] = getMassifProgress(summits),
) {
  const missingSummits = summits.filter(
    (summit) => getSummitStatus(summit) === "MISSING",
  );
  const nextMassif =
    massifProgress.find(
      (massif) => massif.progress > 0 && massif.progress < 100,
    ) ?? massifProgress.find((massif) => massif.progress < 100);

  const candidates = nextMassif
    ? missingSummits.filter((summit) => summit.massif === nextMassif.massif)
    : missingSummits;

  return candidates.slice().sort((firstSummit, secondSummit) => {
    const distanceDelta =
      getClosestDistanceValue(firstSummit) -
      getClosestDistanceValue(secondSummit);

    return distanceDelta !== 0
      ? distanceDelta
      : firstSummit.altitude - secondSummit.altitude;
  })[0];
}

export function getFeaturedMassif(
  massifProgress: MassifProgress[],
  recommendedSummit: SummitView | undefined,
  latestSummit: SummitView | undefined,
) {
  const incompleteMassifs = massifProgress.filter(
    (massif) => massif.progress < 100,
  );
  const recommendedMassif = recommendedSummit
    ? incompleteMassifs.find(
        (massif) => massif.massif === recommendedSummit.massif,
      )
    : undefined;

  if (recommendedMassif && recommendedMassif.discovered > 0) {
    return recommendedMassif;
  }

  const mostExploredIncomplete = incompleteMassifs.find(
    (massif) => massif.discovered > 0,
  );

  if (mostExploredIncomplete) {
    return mostExploredIncomplete;
  }

  const latestMassif = latestSummit
    ? incompleteMassifs.find((massif) => massif.massif === latestSummit.massif)
    : undefined;

  return (
    latestMassif ??
    recommendedMassif ??
    incompleteMassifs[0] ??
    massifProgress[0]
  );
}

export function getNextSummitForMassif(
  summits: SummitView[],
  massif: MassifProgress | undefined,
) {
  if (!massif) {
    return undefined;
  }

  return summits
    .filter(
      (summit) =>
        summit.massif === massif.massif &&
        getSummitStatus(summit) === "MISSING",
    )
    .sort((firstSummit, secondSummit) => {
      const distanceDelta =
        getClosestDistanceValue(firstSummit) -
        getClosestDistanceValue(secondSummit);

      return distanceDelta !== 0
        ? distanceDelta
        : firstSummit.altitude - secondSummit.altitude;
    })[0];
}

export function getSummitOptions(summits: SummitView[]) {
  return {
    massifs: Array.from(new Set(summits.map((summit) => summit.massif))).sort(),
    difficulties: Array.from(
      new Set(summits.map((summit) => summit.difficulty)),
    ).sort(),
  };
}

export function parseSummitFilters(search: string): SummitFilterState {
  const params = new URLSearchParams(search);
  const statusEntry = Object.entries(STATUS_QUERY_VALUES).find(
    ([, queryValue]) => queryValue === params.get("statut"),
  );
  const viewEntry = Object.entries(VIEW_QUERY_VALUES).find(
    ([, queryValue]) => queryValue === params.get("vue"),
  );
  const altitude = params.get("altitude");
  const sort = params.get("tri");
  const status =
    (statusEntry?.[0] as SummitStatusFilter | undefined) ??
    DEFAULT_SUMMIT_FILTERS.status;

  return {
    status,
    viewMode:
      status === "PENDING"
        ? "CARDS"
        : ((viewEntry?.[0] as SummitViewMode | undefined) ??
          DEFAULT_SUMMIT_FILTERS.viewMode),
    searchQuery: params.get("recherche") ?? "",
    massif: params.get("massif") ?? "ALL",
    difficulty: params.get("difficulte") ?? "ALL",
    altitude:
      altitude === "LOW" ||
      altitude === "MID" ||
      altitude === "HIGH" ||
      altitude === "ALPINE"
        ? altitude
        : "ALL",
    sort:
      sort === "ALTITUDE_DESC" ||
      sort === "ALTITUDE_ASC" ||
      sort === "NAME" ||
      sort === "PASSES"
        ? sort
        : "DISCOVERY",
  };
}

export function serializeSummitFilters(
  filters: SummitFilterState,
  currentSearch = "",
) {
  const params = new URLSearchParams(currentSearch);

  const syncParam = (name: string, value: string, defaultValue: string) => {
    if (value === defaultValue || value.trim() === "") {
      params.delete(name);
    } else {
      params.set(name, value);
    }
  };

  syncParam(
    "statut",
    STATUS_QUERY_VALUES[filters.status],
    STATUS_QUERY_VALUES[DEFAULT_SUMMIT_FILTERS.status],
  );
  syncParam(
    "vue",
    VIEW_QUERY_VALUES[filters.viewMode],
    VIEW_QUERY_VALUES[DEFAULT_SUMMIT_FILTERS.viewMode],
  );
  syncParam("recherche", filters.searchQuery.trim(), "");
  syncParam("massif", filters.massif, "ALL");
  syncParam("difficulte", filters.difficulty, "ALL");
  syncParam("altitude", filters.altitude, "ALL");
  syncParam("tri", filters.sort, "DISCOVERY");

  return params.toString();
}

export function hasActiveSummitFilters(filters: SummitFilterState) {
  return (
    filters.status !== DEFAULT_SUMMIT_FILTERS.status ||
    filters.searchQuery.trim() !== "" ||
    filters.massif !== DEFAULT_SUMMIT_FILTERS.massif ||
    filters.difficulty !== DEFAULT_SUMMIT_FILTERS.difficulty ||
    filters.altitude !== DEFAULT_SUMMIT_FILTERS.altitude ||
    filters.sort !== DEFAULT_SUMMIT_FILTERS.sort
  );
}
