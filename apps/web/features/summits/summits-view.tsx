"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { dismissDashboardCelebrationForSummit } from "@/components/summits/summit-celebration-monitor";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  SummitScopeSwitch,
  type SummitCatalogScope,
} from "@/components/summits/summit-scope-switch";
import { useGeoPreferences } from "@/hooks/use-geo-preferences";
import {
  useRemoveSummitDiscovery,
  useSummits,
  useUpdateSummitDiscovery,
} from "@/hooks/use-summits";
import { getMassifProgress, type SummitView } from "@/lib/summit-discovery";

import { LatestSummitDiscovery } from "./components/latest-summit-discovery";
import {
  SummitResults,
  SummitsEmpty,
  SummitsError,
  SummitsSkeleton,
} from "./components/summit-results";
import { SummitsHeader } from "./components/summits-header";
import {
  MassifAtlas,
  NextDiscovery,
  SummitsProgressStrip,
} from "./components/summits-progress-atlas";
import { SummitsToolbar } from "./components/summits-toolbar";
import type { SummitFilterState } from "./summits-types";
import {
  DEFAULT_SUMMIT_FILTERS,
  filterSummits,
  getFeaturedMassif,
  getLatestDiscoveredSummit,
  getNextSummitForMassif,
  getRecommendedSummit,
  getSummitCardViewModels,
  getSummitOptions,
  getSummitSummary,
  getSummitVisualSource,
  getSummitVisualSources,
  hasActiveSummitFilters,
  parseSummitFilters,
  serializeSummitFilters,
} from "./summits-utils";
import styles from "./summits.module.css";

const EMPTY_SUMMITS: SummitView[] = [];
const SUMMIT_RESULT_BATCH_SIZE = 60;

export function SummitsView() {
  const preferencesQuery = useGeoPreferences();
  const [catalogScope, setCatalogScope] = useState<SummitCatalogScope>("MINE");
  const preferredGeoAreaIds =
    preferencesQuery.data?.discovery.map(({ id }) => id) ?? [];
  const hasPreferredGeoAreas = preferredGeoAreaIds.length > 0;
  const effectiveCatalogScope = hasPreferredGeoAreas ? catalogScope : "ALL";
  const summitsQuery = useSummits(
    effectiveCatalogScope === "MINE" ? preferredGeoAreaIds : [],
    !preferencesQuery.isLoading,
    true,
  );
  const updateDiscovery = useUpdateSummitDiscovery();
  const removeDiscovery = useRemoveSummitDiscovery();
  const [filters, setFilters] = useState<SummitFilterState>(() =>
    typeof window === "undefined"
      ? DEFAULT_SUMMIT_FILTERS
      : parseSummitFilters(window.location.search),
  );
  const [summitToRemove, setSummitToRemove] = useState<SummitView | null>(null);
  const [removeError, setRemoveError] = useState<string | undefined>();
  const [visibleResultLimit, setVisibleResultLimit] = useState(
    SUMMIT_RESULT_BATCH_SIZE,
  );
  const catalogRef = useRef<HTMLElement>(null);
  const summits = summitsQuery.data ?? EMPTY_SUMMITS;
  const coreSummits = useMemo(
    () => summits.filter(({ catalogTier }) => catalogTier !== "SECONDARY"),
    [summits],
  );

  useEffect(() => {
    const nextQuery = serializeSummitFilters(filters, window.location.search);
    const nextUrl = `${window.location.pathname}${
      nextQuery ? `?${nextQuery}` : ""
    }${window.location.hash}`;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [filters]);

  const summary = useMemo(() => getSummitSummary(coreSummits), [coreSummits]);
  const massifProgress = useMemo(
    () => getMassifProgress(coreSummits),
    [coreSummits],
  );
  const searchableSummits = filters.searchQuery.trim() ? summits : coreSummits;
  const visibleSummits = useMemo(
    () => filterSummits(searchableSummits, filters),
    [filters, searchableSummits],
  );
  const summitCardViewModels = useMemo(
    () => getSummitCardViewModels(visibleSummits, massifProgress),
    [massifProgress, visibleSummits],
  );
  const renderedSummitCardViewModels = useMemo(() => {
    const focusedSummitId =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("sommet");
    const focusedSummitIndex = focusedSummitId
      ? summitCardViewModels.findIndex(
          ({ summitId }) => summitId === focusedSummitId,
        )
      : -1;

    return summitCardViewModels.slice(
      0,
      Math.max(visibleResultLimit, focusedSummitIndex + 1),
    );
  }, [summitCardViewModels, visibleResultLimit]);
  const latestSummit = useMemo(
    () => getLatestDiscoveredSummit(coreSummits),
    [coreSummits],
  );
  const latestSummitVisual = useMemo(
    () =>
      latestSummit
        ? getSummitVisualSources([latestSummit])[latestSummit.id]
        : undefined,
    [latestSummit],
  );
  const recommendedSummit = useMemo(
    () => getRecommendedSummit(coreSummits, massifProgress),
    [coreSummits, massifProgress],
  );
  const featuredMassif = useMemo(
    () => getFeaturedMassif(massifProgress, recommendedSummit, latestSummit),
    [latestSummit, massifProgress, recommendedSummit],
  );
  const featuredMassifSummit = useMemo(
    () => getNextSummitForMassif(coreSummits, featuredMassif),
    [coreSummits, featuredMassif],
  );
  const featuredMassifVisual = useMemo(
    () =>
      featuredMassifSummit ? getSummitVisualSource(featuredMassifSummit) : null,
    [featuredMassifSummit],
  );
  const nextDiscoverySummit = featuredMassifSummit ?? recommendedSummit;
  const options = useMemo(() => getSummitOptions(coreSummits), [coreSummits]);
  const recommendedMassif = recommendedSummit
    ? massifProgress.find(
        (massif) => massif.massif === recommendedSummit.massif,
      )
    : undefined;
  const hasActiveFilters = hasActiveSummitFilters(filters);
  const isUpdating = updateDiscovery.isPending || removeDiscovery.isPending;
  const isCatalogLoading = preferencesQuery.isLoading || summitsQuery.isLoading;
  const isCatalogError = preferencesQuery.isError || summitsQuery.isError;

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function selectStatus(status: SummitFilterState["status"]) {
    setVisibleResultLimit(SUMMIT_RESULT_BATCH_SIZE);
    setFilters((currentFilters) => ({
      ...currentFilters,
      status,
      viewMode: status === "PENDING" ? "CARDS" : currentFilters.viewMode,
    }));
    window.requestAnimationFrame(scrollToCatalog);
  }

  function selectMassif(massif: string) {
    setVisibleResultLimit(SUMMIT_RESULT_BATCH_SIZE);
    setFilters((currentFilters) => ({
      ...currentFilters,
      status: "ALL",
      massif,
    }));
    window.requestAnimationFrame(scrollToCatalog);
  }

  function resetFilters() {
    setVisibleResultLimit(SUMMIT_RESULT_BATCH_SIZE);
    setFilters((currentFilters) => ({
      ...DEFAULT_SUMMIT_FILTERS,
      viewMode: currentFilters.viewMode,
    }));
  }

  function reviewDiscovery(
    discoveryId: string,
    status: "CONFIRMED" | "DISMISSED",
  ) {
    updateDiscovery.mutate(
      { discoveryId, status },
      {
        onSuccess: () =>
          toast.success(
            status === "CONFIRMED"
              ? "Sommet ajouté à ton carnet."
              : "Ce passage proche n’a pas été validé.",
          ),
        onError: () =>
          toast.error("Impossible d’enregistrer cette correction."),
      },
    );
  }

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        {isCatalogLoading ? <SummitsSkeleton /> : null}

        {isCatalogError ? (
          <SummitsError
            onRetry={() => {
              void preferencesQuery.refetch();
              void summitsQuery.refetch();
            }}
          />
        ) : null}

        {!isCatalogLoading && !isCatalogError ? (
          <>
            <SummitsHeader
              summary={summary}
              onExplore={() => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  status: summary.missingCount > 0 ? "MISSING" : "DISCOVERED",
                }));
                window.requestAnimationFrame(scrollToCatalog);
              }}
              onReviewPending={() => selectStatus("PENDING")}
            />

            <LatestSummitDiscovery
              summit={latestSummit}
              fallbackSummit={recommendedSummit}
              visual={latestSummitVisual}
            />

            <SummitsProgressStrip summary={summary} />

            <div className={styles.discoveryLayout}>
              <NextDiscovery
                summit={nextDiscoverySummit}
                massifProgress={featuredMassif ?? recommendedMassif}
              />
              <MassifAtlas
                massifs={massifProgress}
                featuredMassif={featuredMassif}
                featuredSummit={featuredMassifSummit}
                featuredVisual={featuredMassifVisual}
                onSelect={selectMassif}
              />
            </div>

            <section
              ref={catalogRef}
              className={styles.catalogSection}
              aria-label="Catalogue des sommets"
            >
              <div className={styles.catalogScope}>
                <div>
                  <strong>Périmètre du catalogue</strong>
                  <span>
                    {effectiveCatalogScope === "MINE"
                      ? "Tes territoires sont affichés en priorité."
                      : "Tout le catalogue public est accessible."}
                  </span>
                </div>
                <SummitScopeSwitch
                  value={effectiveCatalogScope}
                  disabled={!hasPreferredGeoAreas}
                  onChange={setCatalogScope}
                />
              </div>
              <SummitsToolbar
                filters={filters}
                counts={{
                  discovered: summary.discoveredCount,
                  pending: summary.pendingCount,
                  missing: summary.missingCount,
                  all: summary.totalCount,
                }}
                resultCount={visibleSummits.length}
                massifOptions={options.massifs}
                hasActiveFilters={hasActiveFilters}
                onChange={(nextFilters) => {
                  setVisibleResultLimit(SUMMIT_RESULT_BATCH_SIZE);
                  setFilters(nextFilters);
                }}
                onReset={resetFilters}
              />

              {visibleSummits.length > 0 ? (
                <>
                  <SummitResults
                    viewModels={renderedSummitCardViewModels}
                    viewMode={filters.viewMode}
                    isUpdating={isUpdating}
                    onRemove={(summit) => {
                      setRemoveError(undefined);
                      setSummitToRemove(summit);
                    }}
                    onReview={reviewDiscovery}
                  />
                  {renderedSummitCardViewModels.length <
                  summitCardViewModels.length ? (
                    <div className={styles.catalogLoadMore}>
                      <p aria-live="polite">
                        {renderedSummitCardViewModels.length} sur{" "}
                        {summitCardViewModels.length} sommets affichés
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleResultLimit((currentLimit) =>
                            Math.min(
                              currentLimit + SUMMIT_RESULT_BATCH_SIZE,
                              summitCardViewModels.length,
                            ),
                          )
                        }
                      >
                        Afficher plus de sommets
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <SummitsEmpty
                  filtered={hasActiveFilters || coreSummits.length > 0}
                  onReset={resetFilters}
                />
              )}
            </section>
          </>
        ) : null}
      </div>

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
              toast.success(
                `${summitToRemove.name} a été retiré de ton carnet.`,
              );
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
