"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityChartDatum } from "@/lib/activity-chart-period";
import type { Activity } from "@/lib/activities";

import { getSportLabel } from "./statistics-utils";
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

function formatMetric(value: number, metric: StatisticsChartMetric) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(value)} ${METRICS[metric].unit}`;
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatDuration(minutes: number | null | undefined) {
  const safeMinutes = Math.max(0, Math.round(minutes ?? 0));
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;

  return hours > 0 ? `${hours} h ${String(remaining).padStart(2, "0")}` : `${remaining} min`;
}

type TooltipPayload = {
  payload: ActivityChartDatum;
};

function ChartTooltip({
  active,
  payload,
  metric,
  activitiesById,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  metric: StatisticsChartMetric;
  activitiesById: Map<string, Activity>;
}) {
  const datum = payload?.[0]?.payload;

  if (!active || !datum) {
    return null;
  }

  const activities = datum.activityIds
    .map((id) => activitiesById.get(id))
    .filter((activity): activity is Activity => Boolean(activity));

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipHeading}>
        <span>{datum.day}</span>
        <strong>{formatMetric(datum[metric], metric)}</strong>
      </div>
      {activities.length > 0 ? (
        <div className={styles.chartTooltipActivities}>
          {activities.slice(0, 3).map((activity) => (
            <div key={activity.id}>
              <span>{getSportLabel(activity.sport)} · {formatActivityDate(activity.startedAt)}</span>
              <strong>{activity.title?.trim() || "Une trace sans titre"}</strong>
              <small>
                {(activity.distance ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km
                {" · "}{formatDuration(activity.duration)}
                {" · "}{Math.round(activity.elevationGain ?? 0).toLocaleString("fr-FR")} m D+
              </small>
            </div>
          ))}
          {activities.length > 3 ? (
            <small>+ {activities.length - 3} autre{activities.length - 3 > 1 ? "s" : ""}</small>
          ) : null}
        </div>
      ) : (
        <p>Aucune activité dans ce repère.</p>
      )}
    </div>
  );
}

export function StatisticsChart({
  data,
  metric,
  activities,
}: {
  data: ActivityChartDatum[];
  metric: StatisticsChartMetric;
  activities: Activity[];
}) {
  const configuration = METRICS[metric];
  const values = data.map((datum) => datum[metric]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const maximum = values.reduce((record, value) => Math.max(record, value), 0);
  const activeBuckets = data.filter((datum) => datum.activityCount > 0).length;
  const recordDatum = data.reduce<ActivityChartDatum | null>(
    (record, datum) => (!record || datum[metric] > record[metric] ? datum : record),
    null,
  );
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  const summary = `${configuration.label} : ${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(total)} ${configuration.unit} au total, répartis sur ${activeBuckets} période${activeBuckets > 1 ? "s" : ""}, avec un maximum de ${new Intl.NumberFormat(
    "fr-FR",
    { maximumFractionDigits: 1 },
  ).format(maximum)} ${configuration.unit}.`;

  return (
    <figure className={styles.chartFigure}>
      <div className={styles.chartCanvas}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 24, right: 14, bottom: 0, left: -18 }}
          >
            <defs>
              <linearGradient id="statistics-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={configuration.color} stopOpacity={0.26} />
                <stop offset="100%" stopColor={configuration.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#d9d1c1" strokeDasharray="3 6" />
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
              content={
                <ChartTooltip metric={metric} activitiesById={activitiesById} />
              }
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
                activeDot={{ r: 5, fill: "#f8f4ea", strokeWidth: 2 }}
              />
            )}
            {data
              .filter((datum) => datum.activityCount > 0)
              .map((datum) => (
                <ReferenceDot
                  key={`${metric}-${datum.startAt}`}
                  x={datum.day}
                  y={datum[metric]}
                  r={datum.activityCount > 1 ? 4.5 : 3.5}
                  fill={datum.activityCount > 1 ? "#c85b2f" : "#f8f4ea"}
                  stroke={configuration.color}
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.chartCaption}>
        <figcaption>{summary}</figcaption>
        {recordDatum && recordDatum.activityCount > 0 ? (
          <span>
            <i aria-hidden="true" />
            Pic de la période · <strong>{recordDatum.day}</strong> · {formatMetric(recordDatum[metric], metric)}
          </span>
        ) : null}
      </div>
    </figure>
  );
}
