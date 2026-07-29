"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ElevationPoint } from "./activity-detail-utils";
import styles from "./activity-detail.module.css";

export function ActivityElevationChart({
  points,
}: {
  points: readonly ElevationPoint[];
}) {
  const minimum = Math.min(...points.map((point) => point.elevation));
  const maximum = Math.max(...points.map((point) => point.elevation));
  const minimumPoint =
    points.find((point) => point.elevation === minimum) ?? points[0];
  const maximumPoint =
    points.find((point) => point.elevation === maximum) ?? points.at(-1);
  const padding = Math.max(25, (maximum - minimum) * 0.12);

  return (
    <div className={styles.chartCanvas}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 18, right: 10, bottom: 4, left: 0 }}
        >
          <defs>
            <linearGradient id="hovren-elevation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8ca58c" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#8ca58c" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#d9d1c2"
            strokeDasharray="2 5"
          />
          <XAxis
            dataKey="distance"
            axisLine={false}
            tickLine={false}
            minTickGap={38}
            tickFormatter={(value: number) => `${value} km`}
            tick={{ fill: "#667468", fontSize: 11 }}
          />
          <YAxis
            width={54}
            axisLine={false}
            tickLine={false}
            domain={[Math.max(0, minimum - padding), maximum + padding]}
            tickFormatter={(value: number) => `${Math.round(value)} m`}
            tick={{ fill: "#667468", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: "#c85b2f", strokeDasharray: "3 3" }}
            contentStyle={{
              background: "#f8f4ea",
              border: "1px solid #d9d1c2",
              borderRadius: 4,
              color: "#20372b",
            }}
            formatter={(value) => [`${Number(value).toFixed(0)} m`, "Altitude"]}
            labelFormatter={(value) => `${value} km`}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="#2f654e"
            strokeWidth={2.5}
            fill="url(#hovren-elevation)"
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 4, fill: "#c85b2f", stroke: "#f8f4ea" }}
          />
          {minimumPoint ? (
            <ReferenceDot
              x={minimumPoint.distance}
              y={minimumPoint.elevation}
              r={3.5}
              fill="#8ca58c"
              stroke="#f8f4ea"
              strokeWidth={2}
            />
          ) : null}
          {maximumPoint ? (
            <ReferenceDot
              x={maximumPoint.distance}
              y={maximumPoint.elevation}
              r={4}
              fill="#cf5a2d"
              stroke="#f8f4ea"
              strokeWidth={2}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
