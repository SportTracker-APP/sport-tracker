import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { DashboardData } from "../utils/dashboard-data";
import { RecentTraceList } from "./dashboard-recent-traces";
import { SurfaceHeader } from "./dashboard-surface-header";

export function DashboardRecentTracesPanel({
  dashboardData,
}: {
  dashboardData: DashboardData;
}) {
  return (
    <div className={styles.tracesPanelWrap}>
      <FadeIn delay={0.28}>
        <div className={`${styles.surface} ${styles.tracesPanel}`}>
          <SurfaceHeader
            title="Dernières traces"
            description="Les sorties qui construisent votre terrain de jeu."
          />
          <RecentTraceList
            activities={dashboardData.recentActivities}
            totalCount={dashboardData.completedActivities.length}
          />
        </div>
      </FadeIn>
    </div>
  );
}
