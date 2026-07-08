"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Eye,
  Info,
  Lock,
  Mountain,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { dismissDashboardCelebrationForSummit } from "@/components/summits/summit-celebration-monitor";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { FadeIn } from "@/components/ui/fade-in";
import {
  useRemoveSummitDiscovery,
  useSummits,
  useUpdateSummitDiscovery,
} from "@/hooks/use-summits";
import {
  getMassifProgress,
  getSummitSearchNames,
  type MassifProgress,
  type SummitView,
} from "@/lib/summit-discovery";
import {
  normalizeSummitName,
  type Summit,
} from "@/lib/summits";

import styles from "./sommets.module.css";

type Filter = "DISCOVERED" | "PENDING" | "ALL" | "MISSING";
type ViewMode = "CARDS" | "TABLE";
type AltitudeFilter = "ALL" | "LOW" | "MID" | "HIGH" | "ALPINE";
type SortMode = "DISCOVERY" | "ALTITUDE_DESC" | "ALTITUDE_ASC" | "NAME" | "PASSES";

const DEFAULT_FILTER: Filter = "DISCOVERED";
const DEFAULT_VIEW_MODE: ViewMode = "CARDS";
const DEFAULT_ALTITUDE_FILTER: AltitudeFilter = "ALL";
const DEFAULT_SORT_MODE: SortMode = "DISCOVERY";
const DEFAULT_SELECT_FILTER = "ALL";

const FILTER_QUERY_VALUES: Record<Filter, string> = {
  ALL: "tous",
  DISCOVERED: "decouverts",
  PENDING: "a-confirmer",
  MISSING: "a-decouvrir",
};

const VIEW_QUERY_VALUES: Record<ViewMode, string> = {
  CARDS: "grille",
  TABLE: "liste",
};

const FALLBACK_MOUNTAIN_IMAGES = [
  "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/355241/pexels-photo-355241.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/67517/pexels-photo-67517.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1400",
];

function getFallbackMountainImage(seed: string) {
  const seedValue = [...seed].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return FALLBACK_MOUNTAIN_IMAGES[
    seedValue % FALLBACK_MOUNTAIN_IMAGES.length
  ];
}

function formatDistanceMeters(distance: number | null) {
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Pas encore visité";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function isRecentDiscovery(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const discoveredAt = new Date(value).getTime();

  if (Number.isNaN(discoveredAt)) {
    return false;
  }

  return Date.now() - discoveredAt <= 7 * 86_400_000;
}

function getSummitHref(summit: Pick<SummitView, "id">) {
  return `/sommets?sommet=${summit.id}#sommet-${summit.id}`;
}

function getFilterFromQuery(value: string | null): Filter {
  const match = Object.entries(FILTER_QUERY_VALUES).find(
    ([, queryValue]) => queryValue === value,
  );

  return (match?.[0] as Filter | undefined) ?? DEFAULT_FILTER;
}

function getViewModeFromQuery(value: string | null): ViewMode {
  const match = Object.entries(VIEW_QUERY_VALUES).find(
    ([, queryValue]) => queryValue === value,
  );

  return (match?.[0] as ViewMode | undefined) ?? DEFAULT_VIEW_MODE;
}

function getAltitudeFilterFromQuery(value: string | null): AltitudeFilter {
  if (
    value === "LOW" ||
    value === "MID" ||
    value === "HIGH" ||
    value === "ALPINE"
  ) {
    return value;
  }

  return DEFAULT_ALTITUDE_FILTER;
}

function getSortModeFromQuery(value: string | null): SortMode {
  if (
    value === "ALTITUDE_DESC" ||
    value === "ALTITUDE_ASC" ||
    value === "NAME" ||
    value === "PASSES"
  ) {
    return value;
  }

  return DEFAULT_SORT_MODE;
}

function getSummitStory(summit: SummitView) {
  if (summit.discovered && summit.latestActivity) {
    return `Dernière trace liée : ${summit.latestActivity.title ?? "une sortie"}.`;
  }

  return `Encore à aller chercher dans le massif ${summit.massif}. Une bonne excuse pour tracer une nouvelle boucle.`;
}

function getSummitDistanceLabel(summit: SummitView) {
  if (summit.discovered) {
    return summit.activityCount > 1
      ? `${summit.activityCount} passages`
      : "1 passage";
  }

  return `${formatDistanceMeters(summit.closestDistance)} au plus proche`;
}

function getSummitLastActivityTime(summit: SummitView) {
  return new Date(summit.latestActivity?.startedAt ?? 0).getTime();
}

function getClosestDistanceValue(summit: SummitView) {
  return summit.closestDistance ?? Number.POSITIVE_INFINITY;
}

function matchesAltitudeFilter(summit: SummitView, altitudeFilter: AltitudeFilter) {
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

function sortSummits(summits: SummitView[], sortMode: SortMode) {
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

    return getSummitLastActivityTime(secondSummit) - getSummitLastActivityTime(firstSummit);
  });
}

function SummitImage({
  alt,
  className,
  summit,
}: {
  alt: string;
  className: string;
  summit: Summit;
}) {
  const fallbackSrc = getFallbackMountainImage(summit.id);
  const [src, setSrc] = useState(
    summit.imageUrl ?? fallbackSrc,
  );

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setSrc(fallbackSrc)}
    />
  );
}

function SummitCard({
  summit,
  isUpdating,
  onRemove,
  onReview,
}: {
  summit: SummitView;
  isUpdating: boolean;
  onRemove: (summit: SummitView) => void;
  onReview: (discoveryId: string, status: "CONFIRMED" | "DISMISSED") => void;
}) {
  const summitHref = getSummitHref(summit);
  const isNew = summit.discovered && isRecentDiscovery(summit.firstActivity?.startedAt);
  const story = getSummitStory(summit);
  const pendingDiscovery = summit.pendingDiscoveries?.[0];

  return (
    <article
      id={`sommet-${summit.id}`}
      className={`${styles.summitCard} ${
        summit.discovered ? "" : styles.summitCardLocked
      }`}
    >
      <div className={styles.summitIllustration}>
        <SummitImage
          className={styles.summitPhoto}
          summit={summit}
          alt={`Vue du sommet ${summit.name}`}
        />
        <span
          className={`${styles.statusBadge} ${
            summit.discovered ? "" : styles.lockedBadge
          }`}
        >
          {summit.discovered ? (
            <CheckCircle2 aria-hidden="true" />
          ) : pendingDiscovery ? (
            <Info aria-hidden="true" />
          ) : (
            <Lock aria-hidden="true" />
          )}
          {summit.discovered
            ? "Découvert"
            : pendingDiscovery
              ? "À confirmer"
              : "À découvrir"}
        </span>
        {isNew ? <span className={styles.newBadge}>Nouveau</span> : null}
        {summit.discovered ? (
          <button
            type="button"
            className={styles.removeDiscoveryButton}
            disabled={isUpdating}
            onClick={() => onRemove(summit)}
            aria-label={`Retirer ${summit.name} de mes découvertes`}
            title="Retirer de mes découvertes"
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
        {summit.imageCredit ? (
          <span className={styles.imageCredit}>{summit.imageCredit}</span>
        ) : null}
      </div>

      <div className={styles.summitBody}>
        <div className={styles.summitTopline}>
          <span>{summit.massif}</span>
          <span>{getSummitDistanceLabel(summit)}</span>
        </div>

        <h2>{summit.name}</h2>

        <div className={styles.summitMeta}>
          <span>
            <Mountain aria-hidden="true" />
            {summit.altitude} m
          </span>
          <span>{summit.type}</span>
          <span>{summit.difficulty}</span>
        </div>

        <p title={story}>{story}</p>

        {pendingDiscovery ? (
          <div className={styles.reviewPanel}>
            <div>
              <strong>Ta trace est passée tout près</strong>
              <span>{pendingDiscovery.activity.title ?? "Sortie sans titre"}</span>
            </div>
            <div className={styles.reviewActions}>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onReview(pendingDiscovery.id, "CONFIRMED")}
              >
                <Check aria-hidden="true" />
                Confirmer
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onReview(pendingDiscovery.id, "DISMISSED")}
              >
                <X aria-hidden="true" />
                Ignorer
              </button>
            </div>
          </div>
        ) : null}

        {summit.discovered ? (
          <div className={styles.summitTimeline}>
            <span>
              <small>Première découverte</small>
              <strong>{formatDate(summit.firstActivity?.startedAt)}</strong>
            </span>
            <span>
              <small>Dernier passage</small>
              <strong>{formatDate(summit.latestActivity?.startedAt)}</strong>
            </span>
            <span>
              <small>Passages</small>
              <strong>{summit.activityCount}</strong>
            </span>
          </div>
        ) : null}

        <div className={styles.summitFooter}>
          <div>
            <strong>
              {summit.discovered ? "Sommet découvert" : "Sommet à découvrir"}
            </strong>
            <span> · {summit.massif}</span>
          </div>
          {summit.latestActivity ? (
            <Link href={`/activites/${summit.latestActivity.id}`}>
              Voir la trace
            </Link>
          ) : (
            <Link href={summitHref}>
              Voir le sommet
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function NextSummitCard({ summit }: { summit: SummitView | undefined }) {
  if (!summit) {
    return null;
  }

  return (
    <article className={styles.nextSummitCard}>
      <div>
        <span>Prochaine découverte</span>
        <h3>{summit.name}</h3>
        <p>
          {summit.altitude} m · {summit.massif} · {summit.difficulty}
        </p>
      </div>
      <div className={styles.nextSummitAside}>
        <strong>
          {summit.closestDistance !== null
            ? `Ta trace est passée à ${formatDistanceMeters(
                summit.closestDistance,
              )} à vol d’oiseau`
            : "À placer dans une prochaine boucle"}
          <span
            className={styles.infoTooltip}
            role="img"
            tabIndex={0}
            aria-label="Distance à vol d’oiseau : ne tient pas compte du dénivelé, du terrain ni de l’itinéraire réel."
            title="Distance à vol d’oiseau : ne tient pas compte du dénivelé, du terrain ni de l’itinéraire réel."
          >
            <Info aria-hidden="true" />
          </span>
        </strong>
        <Link href={getSummitHref(summit)}>Voir le sommet</Link>
      </div>
    </article>
  );
}

function LastSummitPill({ summit }: { summit: SummitView | undefined }) {
  if (!summit?.latestActivity) {
    return null;
  }

  const isLatestPassageFirstDiscovery =
    summit.latestActivity.id === summit.firstActivity?.id;

  return (
    <Link
      className={styles.lastSummit}
      href={`/activites/${summit.latestActivity.id}`}
    >
      <span>
        {isLatestPassageFirstDiscovery
          ? "Dernière découverte"
          : "Dernier sommet visité"}
      </span>
      <strong>{summit.name}</strong>
      <small>{formatDate(summit.latestActivity.startedAt)}</small>
    </Link>
  );
}

function MassifProgressCard({ massif }: { massif: MassifProgress }) {
  const isCompleted = massif.progress === 100;

  return (
    <article
      className={`${styles.massifCard} ${
        isCompleted ? styles.massifCardCompleted : ""
      }`}
    >
      <div className={styles.massifHeader}>
        <span>
          {isCompleted ? <Trophy aria-hidden="true" /> : null}
          {massif.massif}
        </span>
        <strong>{massif.progress}%</strong>
      </div>
      <div className={styles.massifTrack}>
        <span style={{ width: `${massif.progress}%` }} />
      </div>
      <p>
        {isCompleted
          ? "Collection complétée"
          : `${massif.discovered} / ${massif.total} sommets découverts`}
      </p>
    </article>
  );
}

export default function SummitsPage() {
  const { data: summits = [], isLoading, error } = useSummits();
  const updateDiscovery = useUpdateSummitDiscovery();
  const removeDiscovery = useRemoveSummitDiscovery();
  const [summitToRemove, setSummitToRemove] = useState<SummitView | null>(null);
  const [removeError, setRemoveError] = useState<string | undefined>();
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [searchQuery, setSearchQuery] = useState("");
  const [massifFilter, setMassifFilter] = useState(DEFAULT_SELECT_FILTER);
  const [difficultyFilter, setDifficultyFilter] = useState(DEFAULT_SELECT_FILTER);
  const [altitudeFilter, setAltitudeFilter] = useState<AltitudeFilter>(
    DEFAULT_ALTITUDE_FILTER,
  );
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE);
  const [isUrlStateReady, setIsUrlStateReady] = useState(false);
  const lastSyncedQuery = useRef("");
  const discoveredSummits = summits.filter((summit) => summit.discovered);
  const pendingSummits = summits.filter(
    (summit) => !summit.discovered && Boolean(summit.pendingDiscoveries?.length),
  );
  const missingSummits = summits.filter(
    (summit) => !summit.discovered && !summit.pendingDiscoveries?.length,
  );
  const massifOptions = useMemo(
    () => Array.from(new Set(summits.map((summit) => summit.massif))).sort(),
    [summits],
  );
  const difficultyOptions = useMemo(
    () => Array.from(new Set(summits.map((summit) => summit.difficulty))).sort(),
    [summits],
  );
  const normalizedSearchQuery = normalizeSummitName(searchQuery);
  const visibleSummits = sortSummits(
    summits.filter((summit) => {
      if (filter === "DISCOVERED" && !summit.discovered) {
        return false;
      }

      if (
        filter === "PENDING" &&
        (summit.discovered || !summit.pendingDiscoveries?.length)
      ) {
        return false;
      }

      if (
        filter === "MISSING" &&
        (summit.discovered || Boolean(summit.pendingDiscoveries?.length))
      ) {
        return false;
      }

      if (massifFilter !== "ALL" && summit.massif !== massifFilter) {
        return false;
      }

      if (difficultyFilter !== "ALL" && summit.difficulty !== difficultyFilter) {
        return false;
      }

      if (!matchesAltitudeFilter(summit, altitudeFilter)) {
        return false;
      }

      if (normalizedSearchQuery) {
        return getSummitSearchNames(summit).some((summitName) =>
          summitName.includes(normalizedSearchQuery),
        );
      }

      return true;
    }),
    sortMode,
  );
  const highestSummit = discoveredSummits
    .slice()
    .sort((firstSummit, secondSummit) => secondSummit.altitude - firstSummit.altitude)[0];
  const latestSummit = discoveredSummits
    .slice()
    .sort(
      (firstSummit, secondSummit) =>
        new Date(secondSummit.latestActivity?.startedAt ?? 0).getTime() -
        new Date(firstSummit.latestActivity?.startedAt ?? 0).getTime(),
    )[0];
  const coveredMassifs = new Set(
    discoveredSummits.map((summit) => summit.massif),
  ).size;
  const discoveryProgress =
    summits.length > 0
      ? Math.round((discoveredSummits.length / summits.length) * 100)
      : 0;
  const massifProgress = getMassifProgress(summits);
  const nextSummitMassif =
    massifProgress.find((massif) => massif.progress > 0 && massif.progress < 100) ??
    massifProgress.find((massif) => massif.progress < 100);
  const nextSummit = nextSummitMassif
    ? missingSummits
        .filter((summit) => summit.massif === nextSummitMassif.massif)
        .sort((firstSummit, secondSummit) => {
          const distanceDelta =
            getClosestDistanceValue(firstSummit) -
            getClosestDistanceValue(secondSummit);

          if (distanceDelta !== 0) {
            return distanceDelta;
          }

          return firstSummit.altitude - secondSummit.altitude;
        })[0]
    : missingSummits
        .slice()
        .sort(
          (firstSummit, secondSummit) =>
            getClosestDistanceValue(firstSummit) -
            getClosestDistanceValue(secondSummit),
        )[0];
  const hasActiveControls =
    filter !== DEFAULT_FILTER ||
    searchQuery.trim() !== "" ||
    massifFilter !== DEFAULT_SELECT_FILTER ||
    difficultyFilter !== DEFAULT_SELECT_FILTER ||
    altitudeFilter !== DEFAULT_ALTITUDE_FILTER ||
    sortMode !== DEFAULT_SORT_MODE;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialFilter = getFilterFromQuery(params.get("statut"));

    setFilter(initialFilter);
    setViewMode(
      initialFilter === "PENDING"
        ? "CARDS"
        : getViewModeFromQuery(params.get("vue")),
    );
    setSearchQuery(params.get("recherche") ?? "");
    setMassifFilter(params.get("massif") ?? DEFAULT_SELECT_FILTER);
    setDifficultyFilter(params.get("difficulte") ?? DEFAULT_SELECT_FILTER);
    setAltitudeFilter(getAltitudeFilterFromQuery(params.get("altitude")));
    setSortMode(getSortModeFromQuery(params.get("tri")));
    setIsUrlStateReady(true);
  }, []);

  useEffect(() => {
    if (!isUrlStateReady) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (filter === DEFAULT_FILTER) {
      params.delete("statut");
    } else {
      params.set("statut", FILTER_QUERY_VALUES[filter]);
    }

    if (viewMode === DEFAULT_VIEW_MODE) {
      params.delete("vue");
    } else {
      params.set("vue", VIEW_QUERY_VALUES[viewMode]);
    }

    if (searchQuery.trim()) {
      params.set("recherche", searchQuery.trim());
    } else {
      params.delete("recherche");
    }

    if (massifFilter === DEFAULT_SELECT_FILTER) {
      params.delete("massif");
    } else {
      params.set("massif", massifFilter);
    }

    if (difficultyFilter === DEFAULT_SELECT_FILTER) {
      params.delete("difficulte");
    } else {
      params.set("difficulte", difficultyFilter);
    }

    if (altitudeFilter === DEFAULT_ALTITUDE_FILTER) {
      params.delete("altitude");
    } else {
      params.set("altitude", altitudeFilter);
    }

    if (sortMode === DEFAULT_SORT_MODE) {
      params.delete("tri");
    } else {
      params.set("tri", sortMode);
    }

    const nextQuery = params.toString();

    if (nextQuery === lastSyncedQuery.current) {
      return;
    }

    lastSyncedQuery.current = nextQuery;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${
        window.location.hash
      }`,
    );
  }, [
    altitudeFilter,
    difficultyFilter,
    filter,
    isUrlStateReady,
    massifFilter,
    searchQuery,
    sortMode,
    viewMode,
  ]);

  const handleResetFilters = () => {
    setFilter(DEFAULT_FILTER);
    setSearchQuery("");
    setMassifFilter(DEFAULT_SELECT_FILTER);
    setDifficultyFilter(DEFAULT_SELECT_FILTER);
    setAltitudeFilter(DEFAULT_ALTITUDE_FILTER);
    setSortMode(DEFAULT_SORT_MODE);
  };

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <FadeIn delay={0.05}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div>
                <div className={styles.kicker}>
                  <Mountain aria-hidden="true" />
                  Carnet des sommets
                </div>
                <h1>Les sommets que tes traces ont déjà révélés.</h1>
                <p>
                  Chaque sortie avec un tracé est comparée aux sommets du
                  catalogue. Quand la trace passe près d’un sommet, il entre dans
                  ta collection.
                </p>

                <div className={styles.heroProgress}>
                  <div>
                    <span>Progression du carnet</span>
                    <strong>{discoveryProgress}%</strong>
                  </div>
                  <div
                    className={styles.heroProgressTrack}
                    aria-label={`${discoveryProgress}% des sommets découverts`}
                  >
                    <span style={{ width: `${discoveryProgress}%` }} />
                  </div>
                </div>

                <LastSummitPill summit={latestSummit} />
              </div>

              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span>Sommets découverts</span>
                  <strong>{discoveredSummits.length}</strong>
                </div>
                <div className={styles.heroStat}>
                  <span>Massifs explorés</span>
                  <strong>{coveredMassifs}</strong>
                </div>
                <div className={styles.heroStat}>
                  <span>Plus haut sommet</span>
                  <strong>{highestSummit ? `${highestSummit.altitude} m` : "—"}</strong>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section className={styles.progressSection}>
            <div className={styles.sectionTitle}>
              <div>
                <span>Zones à compléter</span>
                <h2>Ta carte de conquête prend forme.</h2>
              </div>
              <p>
                Chaque massif devient une petite collection à remplir au fil des
                traces.
              </p>
            </div>

            <div className={styles.massifGrid}>
              {massifProgress.map((massif) => (
                <MassifProgressCard key={massif.massif} massif={massif} />
              ))}
            </div>

            <NextSummitCard summit={nextSummit} />
          </section>
        </FadeIn>

        <section className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            <div className={styles.filters} role="group" aria-label="Filtrer les sommets">
              <button
                type="button"
                aria-pressed={filter === "DISCOVERED"}
                onClick={() => setFilter("DISCOVERED")}
              >
                Découverts · {discoveredSummits.length}
              </button>
              <button
                type="button"
                aria-pressed={filter === "PENDING"}
                onClick={() => {
                  setFilter("PENDING");
                  setViewMode("CARDS");
                }}
              >
                À confirmer · {pendingSummits.length}
              </button>
              <button
                type="button"
                aria-pressed={filter === "MISSING"}
                onClick={() => setFilter("MISSING")}
              >
                À découvrir · {missingSummits.length}
              </button>
              <button
                type="button"
                aria-pressed={filter === "ALL"}
                onClick={() => setFilter("ALL")}
              >
                Tous · {summits.length}
              </button>
              <span className={styles.resultCount}>
                {visibleSummits.length} sommets affichés
              </span>
            </div>

            <div className={styles.toolbarActions}>
              {hasActiveControls ? (
                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={handleResetFilters}
                >
                  <RotateCcw aria-hidden="true" />
                  Réinitialiser
                </button>
              ) : null}
              <div className={styles.viewSwitch} role="group" aria-label="Changer de vue">
                <button
                  type="button"
                  aria-pressed={viewMode === "CARDS"}
                  onClick={() => setViewMode("CARDS")}
                >
                  <Sparkles aria-hidden="true" /> Grille
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "TABLE"}
                  onClick={() => setViewMode("TABLE")}
                >
                  <Table2 aria-hidden="true" /> Liste
                </button>
              </div>
            </div>
          </div>

          <div className={styles.toolbarControls}>
            <label className={styles.searchField}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher un sommet"
              />
            </label>

            <label>
              <span>Massif</span>
              <select
                value={massifFilter}
                onChange={(event) => setMassifFilter(event.target.value)}
              >
                <option value="ALL">Tous</option>
                {massifOptions.map((massif) => (
                  <option key={massif} value={massif}>
                    {massif}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Difficulté</span>
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value)}
              >
                <option value="ALL">Toutes</option>
                {difficultyOptions.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Altitude</span>
              <select
                value={altitudeFilter}
                onChange={(event) =>
                  setAltitudeFilter(event.target.value as AltitudeFilter)
                }
              >
                <option value="ALL">Toutes</option>
                <option value="LOW">- 1500 m</option>
                <option value="MID">1500 - 2199 m</option>
                <option value="HIGH">2200 - 2999 m</option>
                <option value="ALPINE">3000 m +</option>
              </select>
            </label>

            <label>
              <span>Tri</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
              >
                <option value="DISCOVERY">Dernière découverte</option>
                <option value="ALTITUDE_DESC">Altitude décroissante</option>
                <option value="ALTITUDE_ASC">Altitude croissante</option>
                <option value="NAME">Nom</option>
                <option value="PASSES">Nombre de passages</option>
              </select>
            </label>
          </div>
        </section>

        {isLoading ? (
          <div className={styles.emptyState}>Chargement des sommets...</div>
        ) : null}

        {error ? (
          <div className={styles.emptyState}>
            Impossible de charger ton carnet de sommets.
          </div>
        ) : null}

        {!isLoading && !error && visibleSummits.length === 0 ? (
          <div className={styles.emptyState}>
            Aucun sommet dans cette catégorie pour le moment.
          </div>
        ) : null}

        {!isLoading && !error && viewMode === "CARDS" ? (
          <div className={styles.grid}>
            {visibleSummits.map((summit, index) => (
              <FadeIn key={summit.id} delay={0.04 * index}>
                <SummitCard
                  summit={summit}
                  isUpdating={
                    updateDiscovery.isPending || removeDiscovery.isPending
                  }
                  onRemove={(selectedSummit) => {
                    setRemoveError(undefined);
                    setSummitToRemove(selectedSummit);
                  }}
                  onReview={(discoveryId, status) => {
                    updateDiscovery.mutate(
                      { discoveryId, status },
                      {
                        onSuccess: () =>
                          toast.success(
                            status === "CONFIRMED"
                              ? "Sommet ajouté à ton carnet."
                              : "Cette détection a été ignorée.",
                          ),
                        onError: () =>
                          toast.error(
                            "Impossible d’enregistrer cette correction.",
                          ),
                      },
                    );
                  }}
                />
              </FadeIn>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && viewMode === "TABLE" ? (
          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <span>Sommet</span>
              <span>Altitude</span>
              <span>Massif</span>
              <span>Difficulté</span>
              <span>Dernier passage</span>
              <span>Statut</span>
            </div>
            {visibleSummits.map((summit) => (
              <Link
                key={summit.id}
                href={getSummitHref(summit)}
                className={`${styles.tableRow} ${
                  summit.discovered ? "" : styles.tableRowLocked
                }`}
                aria-label={`Voir le sommet ${summit.name}`}
              >
                <span className={styles.tableName}>
                  <span
                    className={styles.tableThumb}
                    aria-hidden="true"
                  >
                    <SummitImage
                      className={styles.tableThumbImage}
                      summit={summit}
                      alt=""
                    />
                  </span>
                  <span>
                    <strong>
                      {summit.name}
                      {summit.discovered &&
                      isRecentDiscovery(summit.firstActivity?.startedAt) ? (
                        <span className={styles.inlineNewBadge}>Nouveau</span>
                      ) : null}
                    </strong>
                    <small title={summit.type}>{summit.type}</small>
                  </span>
                </span>
                <span className={styles.tableMetric}>{summit.altitude} m</span>
                <span className={styles.tableMetric}>{summit.massif}</span>
                <span>
                  <span className={styles.pill}>{summit.difficulty}</span>
                </span>
                <span className={styles.tableLastVisit}>
                  {summit.latestActivity ? (
                    <>
                      <strong>{formatDate(summit.latestActivity.startedAt)}</strong>
                      <small
                        title={`Première découverte ${formatDate(
                          summit.firstActivity?.startedAt,
                        )} · ${
                          summit.activityCount > 1
                            ? `${summit.activityCount} passages`
                            : "1 passage"
                        }`}
                      >
                        1re découverte {formatDate(summit.firstActivity?.startedAt)}
                        {" · "}
                        {summit.activityCount > 1
                          ? `${summit.activityCount} passages`
                          : "1 passage"}
                      </small>
                    </>
                  ) : (
                    <>
                      <strong>Pas encore</strong>
                      <small
                        title={
                          summit.closestDistance
                            ? `${formatDistanceMeters(
                                summit.closestDistance,
                              )} à vol d’oiseau`
                            : "Sommet consultable"
                        }
                      >
                        {summit.closestDistance
                          ? `${formatDistanceMeters(
                              summit.closestDistance,
                            )} à vol d’oiseau`
                          : "Sommet consultable"}
                      </small>
                    </>
                  )}
                </span>
                <span>
                  <span
                    className={`${styles.pill} ${
                      summit.discovered ? styles.discoveredPill : ""
                    }`}
                  >
                    {summit.discovered ? "Découvert" : "À découvrir"}
                  </span>
                  <span
                    className={styles.tableAction}
                    aria-label={`Ouvrir la fiche du sommet ${summit.name}`}
                    title={`Ouvrir la fiche du sommet ${summit.name}`}
                  >
                    <Eye aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </main>

      <ConfirmationDialog
        open={Boolean(summitToRemove)}
        title={
          summitToRemove
            ? `Retirer ${summitToRemove.name} de tes découvertes ?`
            : "Retirer ce sommet de tes découvertes ?"
        }
        description="Ce sommet ne sera plus comptabilisé dans ton carnet. Une prochaine sortie passant à proximité pourra toutefois le faire apparaître à nouveau."
        confirmLabel="Retirer de mes découvertes"
        cancelLabel="Conserver le sommet"
        tone="default"
        icon={<Trash2 />}
        isLoading={removeDiscovery.isPending}
        errorMessage={removeError}
        onOpenChange={(open) => {
          if (!open) {
            setSummitToRemove(null);
            setRemoveError(undefined);
          }
        }}
        onConfirm={() => {
          if (!summitToRemove) {
            return;
          }

          removeDiscovery.mutate(summitToRemove.id, {
            onSuccess: () => {
              dismissDashboardCelebrationForSummit(summitToRemove.id);
              toast.success(`${summitToRemove.name} a été retiré de ton carnet.`);
              setSummitToRemove(null);
              setRemoveError(undefined);
            },
            onError: () => {
              setRemoveError(
                "Impossible de retirer ce sommet pour le moment. Réessaie dans quelques instants.",
              );
            },
          });
        }}
      />
    </DashboardLayout>
  );
}
