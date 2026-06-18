import { CalendarDays, Gauge, Mountain, Timer } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { DashboardData } from "../utils/dashboard-data";
import {
  formatDistance,
  formatNumber,
  formatPace,
} from "../utils/date-format";
import { SurfaceHeader } from "./dashboard-surface-header";

export function DashboardQuickPanel({
  dashboardData,
  averageElevation,
}: {
  dashboardData: DashboardData;
  averageElevation: number;
}) {
  return (
    <div className={styles.quickPanelWrap}>
      <FadeIn delay={0.4}>
        <div className={`${styles.surface} ${styles.quickPanel}`}>
          <SurfaceHeader
            title="Aperçu rapide"
            description="Les repères essentiels de la période."
          />
          <div className={styles.quickStats}>
            <div>
              <Gauge aria-hidden="true" />
              <span>Allure moyenne</span>
              <strong>
                {formatPace(
                  dashboardData.rollingDuration,
                  dashboardData.rollingDistance,
                )}
              </strong>
            </div>
            <div>
              <Mountain aria-hidden="true" />
              <span>Dénivelé moyen</span>
              <strong>{formatNumber(averageElevation)} m / sortie</strong>
            </div>
            <div>
              <Timer aria-hidden="true" />
              <span>Sortie la plus longue</span>
              <strong>
                {dashboardData.bestActivity
                  ? formatDistance(dashboardData.bestActivity.distance || 0, 1)
                  : "0 km"}
              </strong>
            </div>
            <div>
              <CalendarDays aria-hidden="true" />
              <span>Jours actifs</span>
              <strong>{dashboardData.activeDays} / 30</strong>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
