import { ChevronDown, Mountain } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { ChartMetric } from "../types";
import type { DashboardData } from "../utils/dashboard-data";
import {
  formatDistance,
  formatDuration,
  formatNumber,
} from "../utils/date-format";
import { ActivityChart } from "./dashboard-activity-chart";
import { SurfaceHeader } from "./dashboard-surface-header";

const CHART_TABS: readonly [ChartMetric, string][] = [
  ["distance", "Distance"],
  ["elevation", "Dénivelé"],
  ["duration", "Durée"],
];

export function DashboardActivityPanel({
  dashboardData,
  chartMetric,
  onChartMetricChange,
}: {
  dashboardData: DashboardData;
  chartMetric: ChartMetric;
  onChartMetricChange: (metric: ChartMetric) => void;
}) {
  return (
    <div className={styles.activityPanelWrap}>
      <FadeIn delay={0.22}>
        <div className={`${styles.surface} ${styles.activityPanel}`}>
          <SurfaceHeader
            title="Activité sur les 30 derniers jours"
            description="Vos sorties réelles, jour par jour."
            action={
              <button type="button" className={styles.rangeButton}>
                30 derniers jours <ChevronDown aria-hidden="true" />
              </button>
            }
          />
          <div className={styles.chartSummary}>
            <div>
              <span>Total</span>
              <strong>{formatDistance(dashboardData.rollingDistance, 1)}</strong>
            </div>
            <div>
              <span>Durée</span>
              <strong>{formatDuration(dashboardData.rollingDuration)}</strong>
            </div>
            <div>
              <span>D+</span>
              <strong>{formatNumber(dashboardData.rollingElevation)} m</strong>
            </div>
          </div>
          <div className={styles.chartToolbar}>
            <div
              className={styles.chartTabs}
              role="tablist"
              aria-label="Métrique du graphique"
            >
              {CHART_TABS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={chartMetric === value}
                  className={chartMetric === value ? styles.chartTabActive : ""}
                  onClick={() => onChartMetricChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className={styles.chartUnit}>
              {chartMetric === "distance"
                ? "Kilomètres"
                : chartMetric === "elevation"
                  ? "Mètres de D+"
                  : "Heures d’activité"}
            </span>
          </div>
          <ActivityChart data={dashboardData.chartData} metric={chartMetric} />
          <div className={styles.chartInsight}>
            <Mountain aria-hidden="true" />
            Votre meilleure trace sur la période atteint
            <strong>
              {dashboardData.bestActivity
                ? formatDistance(dashboardData.bestActivity.distance || 0, 1)
                : "0 km"}
            </strong>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
