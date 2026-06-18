import styles from "../dashboard.module.css";
import type { MetricDefinition, MetricTone } from "../types";

const METRIC_TONE_CLASSES: Record<MetricTone, string> = {
  forest: styles.metricToneForest,
  mint: styles.metricToneMint,
  sage: styles.metricToneSage,
  lime: styles.metricToneLime,
  sky: styles.metricToneSky,
};

export function MetricCard({ metric }: { metric: MetricDefinition }) {
  const Icon = metric.icon;
  const trendClass =
    metric.trendTone === "positive"
      ? styles.metricTrendPositive
      : metric.trendTone === "negative"
        ? styles.metricTrendNegative
        : styles.metricTrendNeutral;

  return (
    <div
      className={`${styles.metricCard} ${METRIC_TONE_CLASSES[metric.tone]} ${
        metric.featured ? styles.metricFeatured : ""
      }`}
    >
      <div className={styles.metricIcon}>
        <Icon aria-hidden="true" />
      </div>
      <div className={styles.metricContent}>
        <p className={styles.metricLabel}>{metric.title}</p>
        <p className={styles.metricValue}>{metric.value}</p>
        <p className={styles.metricDescription}>{metric.description}</p>
        <span className={`${styles.metricTrend} ${trendClass}`}>
          {metric.trend}
        </span>
      </div>
    </div>
  );
}
