"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { dismissDashboardCelebrationForSummit } from "@/components/summits/summit-celebration-monitor";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
  getMassifVisualSource,
  getNextSummitForMassif,
  getRecommendedSummit,
  getSummitCardViewModels,
  getSummitOptions,
  getSummitSummary,
  getSummitVisualSources,
  hasActiveSummitFilters,
  parseSummitFilters,
  serializeSummitFilters,
} from "./summits-utils";
import styles from "./summits.module.css";

const EMPTY_SUMMITS: SummitView[] = [];

export function SummitsView() {
  const summitsQuery = useSummits();
  const updateDiscovery = useUpdateSummitDiscovery();
  const removeDiscovery = useRemoveSummitDiscovery();
  const [filters, setFilters] = useState<SummitFilterState>(() =>
    typeof window === "undefined"
      ? DEFAULT_SUMMIT_FILTERS
      : parseSummitFilters(window.location.search),
  );
  const [summitToRemove, setSummitToRemove] = useState<SummitView | null>(null);
  const [removeError, setRemoveError] = useState<string | undefined>();
  const catalogRef = useRef<HTMLElement>(null);
  const summits = summitsQuery.data ?? EMPTY_SUMMITS;

  useEffect(() => {
    const nextQuery = serializeSummitFilters(filters, window.location.search);
    const nextUrl = `${window.location.pathname}${
      nextQuery ? `?${nextQuery}` : ""
    }${window.location.hash}`;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [filters]);

  const summary = useMemo(() => getSummitSummary(summits), [summits]);
  const massifProgress = useMemo(() => getMassifProgress(summits), [summits]);
  const visibleSummits = useMemo(
    () => filterSummits(summits, filters),
    [filters, summits],
  );
  const summitCardViewModels = useMemo(
    () => getSummitCardViewModels(visibleSummits, summits, massifProgress),
    [massifProgress, summits, visibleSummits],
  );
  const latestSummit = useMemo(
    () => getLatestDiscoveredSummit(summits),
    [summits],
  );
  const latestSummitVisual = useMemo(
    () =>
      latestSummit
        ? getSummitVisualSources([latestSummit], summits)[latestSummit.id]
        : undefined,
    [latestSummit, summits],
  );
  const recommendedSummit = useMemo(
    () => getRecommendedSummit(summits, massifProgress),
    [massifProgress, summits],
  );
  const featuredMassif = useMemo(
    () => getFeaturedMassif(massifProgress, recommendedSummit, latestSummit),
    [latestSummit, massifProgress, recommendedSummit],
  );
  const featuredMassifSummit = useMemo(
    () => getNextSummitForMassif(summits, featuredMassif),
    [featuredMassif, summits],
  );
  const featuredMassifVisual = useMemo(
    () =>
      featuredMassif
        ? getMassifVisualSource(summits, featuredMassif.massif)
        : null,
    [featuredMassif, summits],
  );
  const nextDiscoverySummit = featuredMassifSummit ?? recommendedSummit;
  const options = useMemo(() => getSummitOptions(summits), [summits]);
  const recommendedMassif = recommendedSummit
    ? massifProgress.find(
        (massif) => massif.massif === recommendedSummit.massif,
      )
    : undefined;
  const hasActiveFilters = hasActiveSummitFilters(filters);
  const isUpdating = updateDiscovery.isPending || removeDiscovery.isPending;

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function selectStatus(status: SummitFilterState["status"]) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      status,
      viewMode: status === "PENDING" ? "CARDS" : currentFilters.viewMode,
    }));
    window.requestAnimationFrame(scrollToCatalog);
  }

  function selectMassif(massif: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      status: "ALL",
      massif,
    }));
    window.requestAnimationFrame(scrollToCatalog);
  }

  function resetFilters() {
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
              : "Cette détection a été ignorée.",
          ),
        onError: () =>
          toast.error("Impossible d’enregistrer cette correction."),
      },
    );
  }

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        {summitsQuery.isLoading ? <SummitsSkeleton /> : null}

        {summitsQuery.isError ? (
          <SummitsError onRetry={() => void summitsQuery.refetch()} />
        ) : null}

        {!summitsQuery.isLoading && !summitsQuery.isError ? (
          <>
            <SummitsHeader
              summary={summary}
              onExplore={() => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  status:
                    summary.missingCount > 0 ? "MISSING" : "DISCOVERED",
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
                difficultyOptions={options.difficulties}
                hasActiveFilters={hasActiveFilters}
                onChange={setFilters}
                onReset={resetFilters}
              />

              {visibleSummits.length > 0 ? (
                <SummitResults
                  viewModels={summitCardViewModels}
                  viewMode={filters.viewMode}
                  isUpdating={isUpdating}
                  onRemove={(summit) => {
                    setRemoveError(undefined);
                    setSummitToRemove(summit);
                  }}
                  onReview={reviewDiscovery}
                />
              ) : (
                <SummitsEmpty
                  filtered={hasActiveFilters || summits.length > 0}
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
