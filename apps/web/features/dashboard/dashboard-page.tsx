"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";
import { useGoals } from "@/hooks/use-goals";
import { api } from "@/lib/api";
import {
  calculateGoalProgress,
  formatGoalValue,
  selectPrimaryGoal,
} from "@/lib/goal-progress";

import { DashboardActivityPanel } from "./components/dashboard-activity-panel";
import { DashboardBadges } from "./components/dashboard-badges";
import { EmptyStravaDashboard } from "./components/dashboard-empty-state";
import { DashboardHeatmap } from "./components/dashboard-heatmap";
import { DashboardHero } from "./components/dashboard-hero";
import { DashboardMetricsGrid } from "./components/dashboard-metrics-grid";
import { DashboardMonthlyGoal } from "./components/dashboard-monthly-goal";
import { DashboardQuickPanel } from "./components/dashboard-quick-panel";
import { DashboardRecentTracesPanel } from "./components/dashboard-recent-traces-panel";
import { DashboardRecommendations } from "./components/dashboard-recommendations";
import { DashboardRefugeMessage } from "./components/dashboard-refuge-message";
import { DashboardSyncBanner } from "./components/dashboard-sync-banner";
import styles from "./dashboard.module.css";
import { getDailyRefugeMessage, REFUGE_MESSAGES } from "./refuge-messages";
import type { ChartMetric, StravaStatus } from "./types";
import {
  getAdventureName,
  getDaysSinceLastActivity,
  isChartMetric,
} from "./utils/activity-calculations";
import { getUnlockedBadges } from "./utils/badges";
import {
  buildMetricDefinitions,
  buildRecommendationDefinitions,
} from "./utils/dashboard-definitions";
import { buildDashboardData } from "./utils/dashboard-data";
import {
  formatGoalDeadline,
  getGoalDeadline,
} from "./utils/date-format";

const CHART_METRIC_STORAGE_KEY = "montaro.dashboard2.chartMetric";

export default function DashboardPage() {
  const { data: activities = [], isLoading, error } = useActivities();
  const { data: goals = [] } = useGoals();
  const [stravaStatus, setStravaStatus] = useState<StravaStatus | null>(null);
  const [isLoadingStravaStatus, setIsLoadingStravaStatus] = useState(true);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("distance");
  const [refugeMessage, setRefugeMessage] = useState(REFUGE_MESSAGES[0]);

  useEffect(() => {
    const storedMetric = window.localStorage.getItem(CHART_METRIC_STORAGE_KEY);

    if (isChartMetric(storedMetric)) {
      setChartMetric(storedMetric);
    }
  }, []);

  useEffect(() => {
    setRefugeMessage(getDailyRefugeMessage(new Date()));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadStravaStatus() {
      try {
        const { data } = await api.get<StravaStatus>("/strava/status");
        if (isMounted) {
          setStravaStatus(data);
        }
      } catch {
        if (isMounted) {
          setStravaStatus({
            connected: false,
            hasSyncedActivities: false,
            syncedActivitiesCount: 0,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingStravaStatus(false);
        }
      }
    }

    void loadStravaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChartMetricChange = (metric: ChartMetric) => {
    setChartMetric(metric);
    window.localStorage.setItem(CHART_METRIC_STORAGE_KEY, metric);
  };

  const dashboardData = useMemo(
    () => buildDashboardData(activities),
    [activities],
  );
  const primaryGoal = useMemo(() => selectPrimaryGoal(goals), [goals]);
  const goalProgress = useMemo(
    () => calculateGoalProgress(primaryGoal, dashboardData.completedActivities),
    [dashboardData.completedActivities, primaryGoal],
  );
  const goalDeadline = useMemo(
    () => getGoalDeadline(primaryGoal),
    [primaryGoal],
  );

  const goalCurrentLabel = formatGoalValue(
    goalProgress.current,
    primaryGoal.type,
  );
  const goalTargetLabel = formatGoalValue(
    goalProgress.target,
    primaryGoal.type,
  );
  const goalRemainingLabel = formatGoalValue(
    goalProgress.remaining,
    primaryGoal.type,
  );
  const goalDeadlineLabel = formatGoalDeadline(goalDeadline);
  const hasSyncedStrava =
    Boolean(stravaStatus?.hasSyncedActivities) ||
    dashboardData.completedActivities.some((activity) =>
      Boolean(activity.stravaActivityId),
    );
  const hasAnyActivity = dashboardData.completedActivities.length > 0;
  const showEmptyStravaState =
    !isLoading && !isLoadingStravaStatus && !hasSyncedStrava && !hasAnyActivity;
  const weeklyDelta =
    dashboardData.weeklyDistance - dashboardData.previousWeeklyDistance;
  const nextAdventure = getAdventureName(dashboardData.completedActivities);
  const daysSinceLastActivity = getDaysSinceLastActivity(
    dashboardData.latestActivity,
  );
  const unlockedBadges = getUnlockedBadges(
    dashboardData.completedActivities,
    dashboardData.rollingActivities,
  );
  const unlockedBadgesCount = unlockedBadges.filter(
    (badge) => badge.unlocked,
  ).length;
  const averageElevation =
    dashboardData.rollingActivities.length > 0
      ? dashboardData.rollingElevation / dashboardData.rollingActivities.length
      : 0;
  const metrics = buildMetricDefinitions({
    dashboardData,
    averageElevation,
    goalProgress,
    goalRemainingLabel,
    daysSinceLastActivity,
  });
  const recommendations = buildRecommendationDefinitions({
    hasSyncedStrava,
    goalProgress,
    goalRemainingLabel,
    weeklyDelta,
  });

  return (
    <DashboardLayout>
      <div className={styles.dashboardPage} data-dashboard-theme="adaptive">
        {isLoading ? (
          <div className={styles.loadingState}>
            Chargement de votre dashboard…
          </div>
        ) : null}

        {error ? (
          <div className={styles.errorState}>
            Impossible de charger les activités pour le moment.
          </div>
        ) : null}

        {showEmptyStravaState ? (
          <EmptyStravaDashboard />
        ) : (
          <>
            {!isLoadingStravaStatus && !hasSyncedStrava && hasAnyActivity ? (
              <DashboardSyncBanner />
            ) : null}

            <DashboardHero
              dashboardData={dashboardData}
              nextAdventure={nextAdventure}
              primaryGoal={primaryGoal}
              goalProgress={goalProgress}
              goalCurrentLabel={goalCurrentLabel}
              goalTargetLabel={goalTargetLabel}
              goalRemainingLabel={goalRemainingLabel}
            />

            <DashboardMetricsGrid metrics={metrics} />

            <div className={styles.dashboardGrid}>
              <DashboardActivityPanel
                dashboardData={dashboardData}
                chartMetric={chartMetric}
                onChartMetricChange={handleChartMetricChange}
              />
              <DashboardRecentTracesPanel dashboardData={dashboardData} />
              <DashboardMonthlyGoal
                progress={goalProgress}
                title={primaryGoal.title}
                currentLabel={goalCurrentLabel}
                targetLabel={goalTargetLabel}
                remainingLabel={goalRemainingLabel}
                deadlineLabel={goalDeadlineLabel}
              />
              <DashboardQuickPanel
                dashboardData={dashboardData}
                averageElevation={averageElevation}
              />
              <DashboardHeatmap
                description={dashboardData.heatmapDescription}
                monthLabel={dashboardData.heatmapMonthLabel}
                activities={dashboardData.completedActivities}
              />
              <DashboardBadges
                badges={unlockedBadges}
                unlockedCount={unlockedBadgesCount}
              />
              <DashboardRefugeMessage
                refugeMessage={refugeMessage}
                daysSinceLastActivity={daysSinceLastActivity}
              />
              <DashboardRecommendations recommendations={recommendations} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
