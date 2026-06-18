import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { MetricDefinition } from "../types";
import { MetricCard } from "./dashboard-metric-card";

export function DashboardMetricsGrid({
  metrics,
}: {
  metrics: MetricDefinition[];
}) {
  return (
    <div className={styles.metricsGrid}>
      {metrics.map((metric, index) => (
        <FadeIn key={metric.title} delay={0.14 + index * 0.05}>
          <MetricCard metric={metric} />
        </FadeIn>
      ))}
    </div>
  );
}
