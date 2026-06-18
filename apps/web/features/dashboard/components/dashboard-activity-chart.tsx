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

import styles from "../dashboard.module.css";
import type { ChartDatum, ChartMetric } from "../types";

export function ActivityChart({
  data,
  metric,
}: {
  data: ChartDatum[];
  metric: ChartMetric;
}) {
  const configuration = {
    distance: {
      dataKey: "distance",
      label: "Distance (km)",
      color: "var(--chart-distance)",
      gradientId: "distanceGradient",
    },
    elevation: {
      dataKey: "elevation",
      label: "Dénivelé positif (m)",
      color: "var(--chart-elevation)",
      gradientId: "elevationGradient",
    },
    duration: {
      dataKey: "duration",
      label: "Durée (h)",
      color: "var(--chart-duration)",
      gradientId: "durationGradient",
    },
  } as const;
  const selected = configuration[metric];

  return (
    <div className={styles.chartArea}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 18, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-distance-start)"
                stopOpacity={0.95}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-distance-end)"
                stopOpacity={0.58}
              />
            </linearGradient>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-elevation-start)"
                stopOpacity={0.94}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-elevation-end)"
                stopOpacity={0.56}
              />
            </linearGradient>
            <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-duration-start)"
                stopOpacity={0.34}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-duration-end)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            interval={4}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "var(--chart-cursor)" }}
            contentStyle={{
              borderRadius: 18,
              border: "1px solid var(--chart-tooltip-border)",
              background: "var(--chart-tooltip-background)",
              boxShadow: "var(--chart-tooltip-shadow)",
              fontSize: 12,
              padding: "10px 12px",
            }}
            labelStyle={{
              color: "var(--chart-tooltip-title)",
              fontWeight: 700,
            }}
            itemStyle={{ color: selected.color, fontWeight: 700 }}
          />
          {metric === "duration" ? (
            <>
              <Area
                type="monotone"
                dataKey={selected.dataKey}
                name={selected.label}
                stroke="none"
                fill={`url(#${selected.gradientId})`}
                isAnimationActive
                animationDuration={650}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey={selected.dataKey}
                name={selected.label}
                stroke={selected.color}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: selected.color,
                  stroke: "var(--chart-active-dot-ring)",
                  strokeWidth: 2,
                }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </>
          ) : (
            <Bar
              dataKey={selected.dataKey}
              name={selected.label}
              fill={`url(#${selected.gradientId})`}
              radius={[9, 9, 3, 3]}
              maxBarSize={22}
              isAnimationActive
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
