"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityChartDatum } from "@/lib/activity-chart-period";

import styles from "./statistics.module.css";

export type StatisticsChartMetric = "distance" | "elevation" | "duration";

const METRICS: Record<
  StatisticsChartMetric,
  { label: string; unit: string; color: string }
> = {
  distance: { label: "Distance", unit: "km", color: "#c85b2f" },
  elevation: { label: "Dénivelé", unit: "m", color: "#2f5d46" },
  duration: { label: "Durée", unit: "h", color: "#7f8f78" },
};

export function StatisticsChart({
  data,
  metric,
}: {
  data: ActivityChartDatum[];
  metric: StatisticsChartMetric;
}) {
  const configuration = METRICS[metric];
  const values = data.map((datum) => datum[metric]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const maximum = values.reduce((record, value) => Math.max(record, value), 0);
  const activeBuckets = values.filter((value) => value > 0).length;
  const summary = `${configuration.label} : ${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(total)} ${configuration.unit} au total, répartis sur ${activeBuckets} période${activeBuckets > 1 ? "s" : ""}, avec un maximum de ${new Intl.NumberFormat(
    "fr-FR",
    { maximumFractionDigits: 1 },
  ).format(maximum)} ${configuration.unit}.`;

  return (
    <figure className={styles.chartFigure}>
      <div className={styles.chartCanvas} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 18, right: 12, bottom: 0, left: -18 }}
          >
            <defs>
              <linearGradient id="statistics-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={configuration.color}
                  stopOpacity={0.24}
                />
                <stop
                  offset="100%"
                  stopColor={configuration.color}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#d9d1c1"
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#667468", fontSize: 11 }}
              minTickGap={20}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#667468", fontSize: 11 }}
              width={52}
              unit={configuration.unit}
            />
            <Tooltip
              cursor={{ fill: "rgba(47, 93, 70, 0.045)" }}
              contentStyle={{
                background: "#f8f4ea",
                border: "1px solid #d9d1c1",
                borderRadius: 4,
                boxShadow: "0 12px 30px rgba(32, 55, 43, .12)",
                color: "#20372b",
              }}
              formatter={(value) => [
                `${Number(value ?? 0).toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })} ${configuration.unit}`,
                configuration.label,
              ]}
            />
            <Area
              type="monotone"
              dataKey={metric}
              fill="url(#statistics-chart-fill)"
              stroke="transparent"
            />
            {metric === "elevation" ? (
              <Bar
                dataKey={metric}
                fill={configuration.color}
                fillOpacity={0.72}
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />
            ) : (
              <Line
                type="monotone"
                dataKey={metric}
                stroke={configuration.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#f8f4ea", strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption>{summary}</figcaption>
    </figure>
  );
}
