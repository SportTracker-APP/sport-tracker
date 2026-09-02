"use client";

import { useMemo, useRef, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";

import type { ActivityFilter } from "./activities-types";
import {
  createActivityViewModel,
  createYearlySummary,
  filterActivities,
  getCompletedActivities,
  groupActivitiesByMonth,
} from "./activities-utils";
import styles from "./activities.module.css";
import { ActivitiesFilterToolbar } from "./components/activities-filter-toolbar";
import { ActivitiesPageHeader } from "./components/activities-page-header";
import { ActivitiesPagination } from "./components/activities-pagination";
import {
  ActivitiesEmpty,
  ActivitiesError,
  ActivitiesFilterEmpty,
  ActivitiesSkeleton,
} from "./components/activities-states";
import { ActivityJournal } from "./components/activity-journal";
import { FeaturedActivityCard } from "./components/featured-activity-card";
import { YearlyJournalSummary } from "./components/yearly-journal-summary";

const ACTIVITIES_PER_PAGE = 10;

export function ActivitiesView() {
  const activitiesQuery = useActivities();
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("Tous");
  const [currentPage, setCurrentPage] = useState(1);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const completedActivities = useMemo(
    () => getCompletedActivities(activitiesQuery.data ?? []),
    [activitiesQuery.data],
  );
  const filteredActivities = useMemo(
    () => filterActivities(completedActivities, activeFilter),
    [activeFilter, completedActivities],
  );
  const globalSummary = useMemo(
    () => createYearlySummary(completedActivities, currentYear),
    [completedActivities, currentYear],
  );
  const filteredSummary = useMemo(
    () => createYearlySummary(filteredActivities, currentYear),
    [filteredActivities, currentYear],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstIndex = (safeCurrentPage - 1) * ACTIVITIES_PER_PAGE;
  const paginatedActivities = filteredActivities.slice(
    firstIndex,
    firstIndex + ACTIVITIES_PER_PAGE,
  );
  const visibleViewModels = paginatedActivities.map(createActivityViewModel);
  const featuredActivity =
    safeCurrentPage === 1 ? visibleViewModels[0] : undefined;
  const journalActivities = featuredActivity
    ? visibleViewModels.slice(1)
    : visibleViewModels;
  const monthGroups = groupActivitiesByMonth(journalActivities);

  function handleFilterChange(filter: ActivityFilter) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    workspaceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        <ActivitiesPageHeader
          totalCount={completedActivities.length}
          summary={globalSummary}
          isLoading={activitiesQuery.isLoading}
        />

        {activitiesQuery.isLoading ? <ActivitiesSkeleton /> : null}

        {activitiesQuery.isError ? (
          <ActivitiesError
            onRetry={() => {
              void activitiesQuery.refetch();
            }}
          />
        ) : null}

        {!activitiesQuery.isLoading && !activitiesQuery.isError ? (
          completedActivities.length === 0 ? (
            <ActivitiesEmpty />
          ) : (
            <div ref={workspaceRef} className={styles.workspace}>
              <ActivitiesFilterToolbar
                activeFilter={activeFilter}
                resultCount={filteredActivities.length}
                onChange={handleFilterChange}
              />

              <YearlyJournalSummary summary={filteredSummary} />

              <main className={styles.journalColumn}>
                {filteredActivities.length === 0 ? (
                  <ActivitiesFilterEmpty
                    filter={activeFilter}
                    onReset={() => handleFilterChange("Tous")}
                  />
                ) : (
                  <>
                    {featuredActivity ? (
                      <FeaturedActivityCard activity={featuredActivity} />
                    ) : null}

                    {monthGroups.length > 0 ? (
                      <ActivityJournal groups={monthGroups} />
                    ) : null}

                    <ActivitiesPagination
                      currentPage={safeCurrentPage}
                      totalPages={totalPages}
                      firstVisible={firstIndex + 1}
                      lastVisible={Math.min(
                        firstIndex + ACTIVITIES_PER_PAGE,
                        filteredActivities.length,
                      )}
                      totalCount={filteredActivities.length}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </main>
            </div>
          )
        ) : null}
      </div>
    </DashboardLayout>
  );
}
