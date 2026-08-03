"use client";

import { ChevronDown } from "lucide-react";

import {
  ACTIVITY_CHART_PERIOD_OPTIONS,
  isActivityChartPeriod,
  type ActivityChartPeriod,
} from "@/lib/activity-chart-period";

type ActivityPeriodSelectProps = {
  className?: string;
  value: ActivityChartPeriod;
  onChange: (period: ActivityChartPeriod) => void;
};

export function ActivityPeriodSelect({
  className,
  value,
  onChange,
}: ActivityPeriodSelectProps) {
  const selectedLabel =
    ACTIVITY_CHART_PERIOD_OPTIONS.find((option) => option.value === value)
      ?.label ?? ACTIVITY_CHART_PERIOD_OPTIONS[1].label;

  return (
    <label className={className}>
      <span className="sr-only">Période du graphique d’activité</span>
      <span aria-hidden="true">{selectedLabel}</span>
      <select
        aria-label="Période du graphique d’activité"
        value={value}
        onChange={(event) => {
          if (isActivityChartPeriod(event.target.value)) {
            onChange(event.target.value);
          }
        }}
      >
        {ACTIVITY_CHART_PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </label>
  );
}
