import { Clock3, Flame, Mountain, Route, type LucideIcon } from "lucide-react";

import type { ActivityMetric } from "../activities-types";
import styles from "../activities.module.css";

const METRIC_ICONS: Record<ActivityMetric["key"], LucideIcon> = {
  distance: Route,
  duration: Clock3,
  elevation: Mountain,
  calories: Flame,
};

export function ActivityMetrics({
  metrics,
  compact = false,
}: {
  metrics: ActivityMetric[];
  compact?: boolean;
}) {
  return (
    <ul className={styles.metrics} data-compact={compact}>
      {metrics.map((metric) => {
        const Icon = METRIC_ICONS[metric.key];

        return (
          <li key={metric.key}>
            <Icon aria-hidden="true" />
            {metric.label}
          </li>
        );
      })}
    </ul>
  );
}
