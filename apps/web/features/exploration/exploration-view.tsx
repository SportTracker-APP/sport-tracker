"use client";

import { useMemo, useRef, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";
import { useSummits } from "@/hooks/use-summits";
import type { SummitView } from "@/lib/summit-discovery";

import { ExplorationHeader } from "./components/exploration-header";
import { ExplorationMap } from "./components/exploration-map";
import {
  ExplorationEmpty,
  ExplorationError,
  ExplorationNoResults,
  ExplorationSkeleton,
} from "./components/exploration-states";
import { ExploredTerritoriesSection } from "./components/explored-territories-section";
import { NotableTracesSection } from "./components/notable-traces-section";
import { SelectedTraceInspector } from "./components/selected-trace-inspector";
import { SportFilterBar } from "./components/sport-filter-bar";
import { TerritoryStatsStrip } from "./components/territory-stats-strip";
import type {
  ExplorationFilter,
  ExplorationSourceActivity,
} from "./exploration-types";
import { createExplorationViewModel } from "./exploration-utils";
import styles from "./exploration.module.css";

export function ExplorationView() {
  const activitiesQuery = useActivities();
  const summitsQuery = useSummits();

  return (
    <DashboardLayout variant="refuge">
      {activitiesQuery.isLoading ? (
        <div className={styles.page}>
          <ExplorationSkeleton />
        </div>
      ) : activitiesQuery.isError ? (
        <div className={styles.page}>
          <ExplorationError onRetry={() => void activitiesQuery.refetch()} />
        </div>
      ) : (
        <ExplorationExperience
          activities={activitiesQuery.data ?? []}
          summits={summitsQuery.data ?? []}
        />
      )}
    </DashboardLayout>
  );
}

export function ExplorationExperience({
  activities,
  summits,
}: {
  activities: ExplorationSourceActivity[];
  summits: SummitView[];
}) {
  const [activeFilter, setActiveFilter] = useState<ExplorationFilter>("ALL");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [activeTerritory, setActiveTerritory] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLElement>(null);

  const viewModel = useMemo(
    () =>
      createExplorationViewModel({
        activities,
        filter: activeFilter,
        selectedRouteId,
        territory: activeTerritory,
      }),
    [activeFilter, activeTerritory, activities, selectedRouteId],
  );

  function changeFilter(filter: ExplorationFilter) {
    setActiveFilter(filter);
    setSelectedRouteId(null);
  }

  function selectTerritory(territory: string) {
    setActiveTerritory((current) => (current === territory ? null : territory));
    setSelectedRouteId(null);
    window.requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  }

  function resetFilters() {
    setActiveFilter("ALL");
    setActiveTerritory(null);
    setSelectedRouteId(null);
  }

  return (
    <div className={styles.page}>
      {viewModel.allRoutes.length === 0 ? (
        <>
          <ExplorationHeader distance={0} routeCount={0} />
          <ExplorationEmpty />
        </>
      ) : (
        <>
          <ExplorationHeader
            distance={viewModel.allDistance}
            routeCount={viewModel.allRoutes.length}
          />

          <section
            ref={mapSectionRef}
            className={styles.mapSection}
            aria-labelledby="exploration-map-title"
          >
            <div className={styles.mapSectionHeading}>
              <div>
                <p>Carte d’expédition</p>
                <h2 id="exploration-map-title">
                  Les reliefs que tes traces ont révélés.
                </h2>
              </div>
              <p>
                Sélectionne une trace pour retrouver les reliefs et les repères
                de cette aventure.
              </p>
            </div>

            <SportFilterBar
              activeFilter={activeFilter}
              visibleCount={viewModel.filteredRoutes.length}
              territory={activeTerritory}
              onChange={changeFilter}
              onClearTerritory={() => {
                setActiveTerritory(null);
                setSelectedRouteId(null);
              }}
            />

            <TerritoryStatsStrip
              distance={viewModel.totalDistance}
              elevation={viewModel.totalElevation}
              departureCount={viewModel.departureCount}
            />

            {viewModel.filteredRoutes.length === 0 ? (
              <ExplorationNoResults onReset={resetFilters} />
            ) : (
              <div className={styles.mapWorkspace}>
                <ExplorationMap
                  routes={viewModel.visibleMapRoutes}
                  summits={summits}
                  selectedRouteId={viewModel.selectedRoute?.id ?? null}
                  onSelectRoute={setSelectedRouteId}
                  onClearSelection={() => setSelectedRouteId(null)}
                  inspector={
                    <SelectedTraceInspector
                      route={viewModel.selectedRoute}
                      onClose={() => setSelectedRouteId(null)}
                    />
                  }
                />
              </div>
            )}
          </section>

          <NotableTracesSection
            routes={viewModel.notableRoutes}
            selectedRouteId={viewModel.selectedRoute?.id ?? null}
            onSelect={(routeId) => {
              setSelectedRouteId(routeId);
              window.requestAnimationFrame(() => {
                mapSectionRef.current?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "auto"
                    : "smooth",
                  block: "start",
                });
              });
            }}
          />

          <ExploredTerritoriesSection
            territories={viewModel.availableTerritories}
            activeTerritory={activeTerritory}
            onSelect={selectTerritory}
          />
        </>
      )}
    </div>
  );
}
