"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties, ElementType } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Ellipsis,
  Flame,
  MapPin,
  Mountain,
  Route,
  Share2,
  SunMedium,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ActivityMapboxRoute } from "@/components/activities/activity-mapbox-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import {
  useActivity,
  useCompletePlannedWorkout,
  usePlannedWorkoutSuggestion,
} from "@/hooks/use-activities";
import { pickRandomActivityFallbackImage } from "@/lib/activity-fallback-images";
import type { Activity as ActivityModel } from "@/lib/activities";

import styles from "./activity-detail.module.css";

const sportLabels: Record<string, string> = {
  RUNNING: "Course",
  ROAD_CYCLING: "Cyclisme",
  GRAVEL: "Gravel",
  MTB: "VTT",
  TRAIL: "Trail",
  HIKING: "Randonnée",
  WALKING: "Marche",
  GYM: "Musculation",
  FITNESS: "Fitness",
  SWIMMING: "Natation",
  SKI: "Ski",
  SNOWBOARD: "Snowboard",
  CLIMBING: "Escalade",
};

type ActivityWithElevationSeries = ActivityModel & {
  altitudeStream?: readonly number[] | null;
  elevationProfile?: readonly number[] | null;
  elevationStream?: readonly number[] | null;
  distanceStream?: readonly number[] | null;
  minAltitude?: number | null;
};

type ActivityWithMedia = ActivityModel & {
  imageUrl?: string | null;
  photoUrl?: string | null;
  stravaPhotoUrl?: string | null;
  thumbnailUrl?: string | null;
  photoUrls?: readonly string[] | null;
  photos?: unknown;
};

function formatNumber(
  value: number | null,
  options?: Intl.NumberFormatOptions,
) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR", options).format(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  return `${Math.floor(minutes / 60)}H${String(minutes % 60).padStart(2, "0")}`;
}

function formatMovingTime(seconds: number | null) {
  if (seconds === null) {
    return "—";
  }

  return formatDuration(Math.round(seconds / 60));
}

function formatDate(date: string) {
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function formatSpeed(speedMetersPerSecond: number | null) {
  if (speedMetersPerSecond === null) {
    return "—";
  }

  return formatNumber(speedMetersPerSecond * 3.6, {
    maximumFractionDigits: 1,
  });
}

function formatPace(activity: ActivityModel) {
  if (!activity.distance || activity.duration <= 0) {
    return "—";
  }

  const pace = activity.duration / activity.distance;
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);

  return `${minutes}'${String(seconds).padStart(2, "0")}`;
}

function decodePolyline(polyline: string | null) {
  if (!polyline) {
    return [];
  }

  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

function formatCoordinates(latitude: number, longitude: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 4,
  }).format(latitude)}, ${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 4,
  }).format(longitude)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeHttpUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function findBestPhotoUrl(value: unknown, depth = 0): string | null {
  if (depth > 5) {
    return null;
  }

  const directUrl = normalizeHttpUrl(value);

  if (directUrl) {
    return directUrl;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedUrl = findBestPhotoUrl(item, depth + 1);

      if (nestedUrl) {
        return nestedUrl;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const preferredKeys = [
    "2048",
    "1536",
    "1024",
    "600",
    "large",
    "original",
    "url",
    "imageUrl",
    "photoUrl",
    "coverImageUrl",
    "primary",
    "urls",
  ];

  for (const key of preferredKeys) {
    if (!(key in value)) {
      continue;
    }

    const nestedUrl = findBestPhotoUrl(value[key], depth + 1);

    if (nestedUrl) {
      return nestedUrl;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nestedUrl = findBestPhotoUrl(nestedValue, depth + 1);

    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return null;
}

function getActivityPhotoUrls(activity: ActivityModel) {
  const activityWithMedia = activity as ActivityWithMedia;
  const urls: string[] = [];
  const seenUrls = new Set<string>();
  const pushUrl = (candidate: unknown) => {
    const url = normalizeHttpUrl(candidate);

    if (!url || seenUrls.has(url)) {
      return;
    }

    seenUrls.add(url);
    urls.push(url);
  };

  const photos = activityWithMedia.photos;

  if (Array.isArray(photos)) {
    for (const photo of photos) {
      const url = findBestPhotoUrl(photo);

      if (url) {
        pushUrl(url);
      }
    }
  } else if (isRecord(photos)) {
    const fallbackUrl = findBestPhotoUrl(photos);

    if (fallbackUrl) {
      pushUrl(fallbackUrl);
    }
  }

  if (Array.isArray(activityWithMedia.photoUrls)) {
    for (const photoUrl of activityWithMedia.photoUrls) {
      pushUrl(photoUrl);
    }
  }

  [
    activityWithMedia.stravaPhotoUrl,
    activityWithMedia.photoUrl,
    activityWithMedia.imageUrl,
    activityWithMedia.coverImageUrl,
    activityWithMedia.thumbnailUrl,
  ].forEach(pushUrl);

  return urls;
}

function getSportLabel(activity: ActivityModel | null) {
  if (!activity) {
    return "Activité";
  }

  return sportLabels[activity.sport] || activity.sport;
}

function getStartLabel(activity: ActivityModel) {
  const namedLocation = [activity.city, activity.country]
    .filter(Boolean)
    .join(", ");

  if (namedLocation) {
    return namedLocation;
  }

  if (activity.startLatitude !== null && activity.startLongitude !== null) {
    return `Départ ${formatCoordinates(
      activity.startLatitude,
      activity.startLongitude,
    )}`;
  }

  const points = decodePolyline(activity.routePolyline);
  const firstPoint = points[0];

  if (firstPoint) {
    return `Départ ${formatCoordinates(firstPoint.lat, firstPoint.lng)}`;
  }

  return "Départ non localisé";
}

function getDifficultyLabel(activity: ActivityModel) {
  const score =
    (activity.elevationGain ?? 0) * 0.58 +
    (activity.distance ?? 0) * 18 +
    activity.duration * 4;

  if (score >= 1800) {
    return "Soutenue";
  }

  if (score >= 1200) {
    return "Engagée";
  }

  if (score >= 760) {
    return "Régulière";
  }

  return "Accessible";
}

function getHeroText(activity: ActivityModel) {
  if ((activity.maxAltitude ?? 0) >= 2200) {
    return "Une vraie journée d'altitude, avec une sortie qui prend de la hauteur et laisse une trace marquée.";
  }

  if ((activity.elevationGain ?? 0) >= 1000) {
    return "Un profil montagne bien dessiné, du dénivelé, et une lecture de terrain qui donne envie d'y retourner.";
  }

  return "Une sortie lisible, propre, avec tous les repères utiles pour revivre le moment d'un coup d'oeil.";
}

function getSummaryText(activity: ActivityModel) {
  if (activity.description?.trim()) {
    return activity.description.trim();
  }

  return "Ajoute un souvenir, ton ressenti ou les conditions rencontrées pendant cette sortie.";
}

function getSurfaceLabel(activity: ActivityModel) {
  if (activity.sport === "TRAIL" || activity.sport === "HIKING") {
    return "Sentier, roche";
  }

  if (activity.sport === "MTB" || activity.sport === "GRAVEL") {
    return "Piste, chemin";
  }

  if (activity.sport === "ROAD_CYCLING" || activity.sport === "RUNNING") {
    return "Route, sentier";
  }

  return "Terrain mixte";
}

function getSourceLabel(activity: ActivityModel) {
  return activity.stravaActivityId ? "Strava" : "Hovren";
}

function getLoopTag(activity: ActivityModel) {
  const points = decodePolyline(activity.routePolyline);
  const first = points[0];
  const last = points.at(-1);

  if (!first || !last) {
    return null;
  }

  const dx = first.lat - last.lat;
  const dy = first.lng - last.lng;
  const approxDistanceMeters = Math.sqrt(dx * dx + dy * dy) * 111_000;

  return approxDistanceMeters < 250 ? "Boucle" : "Aller-retour";
}

function getTerrainTags(activity: ActivityModel) {
  const tags: string[] = [];

  if (activity.sport === "TRAIL") {
    tags.push("Trail");
  }

  if ((activity.maxAltitude ?? 0) >= 1800) {
    tags.push("Montagne");
  }

  const loopTag = getLoopTag(activity);

  if (loopTag) {
    tags.push(loopTag);
  }

  if (activity.country) {
    tags.push(activity.country);
  }

  return tags.slice(0, 4);
}

function getLowAltitude(activity: ActivityModel) {
  if (
    activity.maxAltitude !== null &&
    activity.elevationGain !== null &&
    activity.maxAltitude > activity.elevationGain
  ) {
    return activity.maxAltitude - activity.elevationGain;
  }

  return null;
}

function getElevationRate(activity: ActivityModel) {
  if (
    activity.distance === null ||
    activity.distance <= 0 ||
    activity.elevationGain === null
  ) {
    return null;
  }

  return activity.elevationGain / activity.distance;
}

function getElevationSeries(activity: ActivityModel) {
  const activityWithSeries = activity as ActivityWithElevationSeries;
  const candidates = [
    activityWithSeries.elevationProfile,
    activityWithSeries.elevationStream,
    activityWithSeries.altitudeStream,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const values: number[] = [];

    for (const value of candidate) {
      if (typeof value === "number" && Number.isFinite(value)) {
        values.push(value);
      }
    }

    if (values.length >= 2) {
      return values;
    }
  }

  return buildSyntheticElevationSeries(activity);
}

function getDistanceSeries(activity: ActivityModel) {
  const activityWithSeries = activity as ActivityWithElevationSeries;
  const candidate = activityWithSeries.distanceStream;

  if (!Array.isArray(candidate)) {
    return null;
  }

  const values: number[] = [];

  for (const value of candidate) {
    if (typeof value === "number" && Number.isFinite(value)) {
      values.push(value);
    }
  }

  return values.length >= 2 ? values : null;
}

function sampleSeries(values: readonly number[], maximumPoints = 280) {
  if (values.length <= maximumPoints) {
    return values;
  }

  const sampled: number[] = [];
  const step = (values.length - 1) / (maximumPoints - 1);

  for (let index = 0; index < maximumPoints; index += 1) {
    sampled.push(values[Math.round(index * step)] ?? values.at(-1) ?? 0);
  }

  return sampled;
}

function getSeriesBounds(values: readonly number[]) {
  let minimum = values[0] ?? 0;
  let maximum = values[0] ?? 0;

  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }

  return { minimum, maximum };
}

function getElevationTotals(values: readonly number[]) {
  let ascent = 0;
  let descent = 0;

  for (let index = 1; index < values.length; index += 1) {
    const delta = values[index]! - values[index - 1]!;

    if (delta > 0) {
      ascent += delta;
    } else {
      descent += Math.abs(delta);
    }
  }

  return {
    ascent: Math.round(ascent),
    descent: Math.round(descent),
  };
}

function getDistanceBetweenPoints(
  pointA: { lat: number; lng: number },
  pointB: { lat: number; lng: number },
) {
  const avgLat = ((pointA.lat + pointB.lat) / 2) * (Math.PI / 180);
  const dx = (pointB.lng - pointA.lng) * 111_320 * Math.cos(avgLat);
  const dy = (pointB.lat - pointA.lat) * 110_540;

  return Math.sqrt(dx * dx + dy * dy);
}

function smoothSeries(values: readonly number[], passes = 2) {
  let smoothed = [...values];

  for (let pass = 0; pass < passes; pass += 1) {
    smoothed = smoothed.map((value, index, currentValues) => {
      const previous = currentValues[index - 1] ?? value;
      const next = currentValues[index + 1] ?? value;

      return previous * 0.25 + value * 0.5 + next * 0.25;
    });
  }

  return smoothed;
}

function buildSyntheticElevationSeries(activity: ActivityModel) {
  const points = decodePolyline(activity.routePolyline);
  const lowAltitude =
    getLowAltitude(activity) ??
    (activity.maxAltitude !== null && activity.elevationGain !== null
      ? Math.max(
          0,
          activity.maxAltitude - Math.max(activity.elevationGain * 0.72, 180),
        )
      : null);
  const highAltitude =
    activity.maxAltitude ??
    (lowAltitude !== null && activity.elevationGain !== null
      ? lowAltitude + activity.elevationGain
      : null);

  if (
    lowAltitude === null ||
    highAltitude === null ||
    !Number.isFinite(lowAltitude) ||
    !Number.isFinite(highAltitude) ||
    highAltitude <= lowAltitude
  ) {
    return [];
  }

  const altitudeRange = Math.max(highAltitude - lowAltitude, 1);

  if (points.length < 2) {
    return [
      lowAltitude + altitudeRange * 0.08,
      lowAltitude + altitudeRange * 0.34,
      highAltitude,
      lowAltitude + altitudeRange * 0.58,
      lowAltitude + altitudeRange * 0.16,
    ];
  }

  const meanLat =
    points.reduce((total, point) => total + point.lat, 0) / points.length;
  const meanLng =
    points.reduce((total, point) => total + point.lng, 0) / points.length;
  const projectedX = points.map(
    (point) => (point.lng - meanLng) * Math.cos((meanLat * Math.PI) / 180),
  );
  const projectedY = points.map((point) => point.lat - meanLat);
  const radialValues = projectedX.map((value, index) =>
    Math.sqrt(value * value + projectedY[index]! * projectedY[index]!),
  );
  const radialBounds = getSeriesBounds(radialValues);
  const radialRange = Math.max(
    radialBounds.maximum - radialBounds.minimum,
    1e-6,
  );
  const cumulativeDistances = [0];

  for (let index = 1; index < points.length; index += 1) {
    cumulativeDistances.push(
      cumulativeDistances[index - 1]! +
        getDistanceBetweenPoints(points[index - 1]!, points[index]!),
    );
  }

  const totalDistance = cumulativeDistances.at(-1) ?? 0;
  const isLoop = getLoopTag(activity) === "Boucle";
  const endpointStart = lowAltitude + altitudeRange * 0.1;
  const endpointEnd = lowAltitude + altitudeRange * (isLoop ? 0.12 : 0.26);

  const values = points.map((point, index) => {
    const progress =
      totalDistance > 0
        ? cumulativeDistances[index]! / totalDistance
        : index / Math.max(points.length - 1, 1);
    const normalizedNorth =
      (point.lat - Math.min(...points.map((item) => item.lat))) /
      Math.max(
        Math.max(...points.map((item) => item.lat)) -
          Math.min(...points.map((item) => item.lat)),
        1e-6,
      );
    const radialSignal =
      (radialValues[index]! - radialBounds.minimum) / radialRange;
    const scenicSignal =
      normalizedNorth * 0.38 +
      radialSignal * 0.42 +
      Math.sin(progress * Math.PI) * 0.14 +
      Math.sin(progress * Math.PI * 3) * 0.06;
    const baseline = endpointStart + (endpointEnd - endpointStart) * progress;

    return baseline + scenicSignal * altitudeRange * 0.82;
  });

  const smoothedValues = smoothSeries(values, 3);
  const bounds = getSeriesBounds(smoothedValues);
  const boundRange = Math.max(bounds.maximum - bounds.minimum, 1);

  return smoothedValues.map((value, index) => {
    const progress = index / Math.max(smoothedValues.length - 1, 1);
    const normalized = (value - bounds.minimum) / boundRange;
    const target = lowAltitude + normalized * altitudeRange;
    const endpointBias =
      index === 0
        ? endpointStart
        : index === smoothedValues.length - 1
          ? endpointEnd
          : target;

    return target * 0.88 + endpointBias * 0.12 + progress * 0;
  });
}

function buildElevationChartData(
  values: readonly number[],
  totalDistanceKm: number | null,
  distanceValues?: readonly number[] | null,
) {
  const canUseDistanceStream =
    Array.isArray(distanceValues) && distanceValues.length === values.length;
  const totalPoints = values.length;
  const maximumPoints = 280;
  const denominator = Math.max(Math.min(totalPoints, maximumPoints) - 1, 1);

  if (canUseDistanceStream) {
    return Array.from(
      { length: Math.min(totalPoints, maximumPoints) },
      (_, index) => {
        const sourceIndex = Math.round(
          (index / denominator) * (totalPoints - 1),
        );
        const distanceMeters = distanceValues[sourceIndex] ?? 0;

        return {
          elevation: Math.round(values[sourceIndex] ?? 0),
          distance: Number((distanceMeters / 1000).toFixed(1)),
        };
      },
    );
  }

  const sampledValues = sampleSeries(values);
  const sampledDenominator = Math.max(sampledValues.length - 1, 1);

  return sampledValues.map((value, index) => ({
    elevation: Math.round(value),
    distance:
      totalDistanceKm && totalDistanceKm > 0
        ? Number(((index / sampledDenominator) * totalDistanceKm).toFixed(1))
        : index,
  }));
}


type MetricProps = {
  icon: ElementType;
  label: string;
  value: string;
  unit?: string;
  sparkline: "distance" | "time" | "elevation" | "calories";
};

function MetricSparkline({
  variant,
}: {
  variant: MetricProps["sparkline"];
}) {
  const paths: Record<MetricProps["sparkline"], string> = {
    distance:
      "M2 34 C18 31 28 33 43 26 C57 20 69 26 84 18 C99 9 112 27 127 20 C139 15 151 11 170 13",
    time: "M2 30 C18 29 31 23 47 25 C62 27 78 16 93 20 C108 24 123 31 139 24 C151 20 160 21 170 18",
    elevation:
      "M2 30 C18 28 31 29 45 24 C61 19 75 28 89 22 C104 16 118 25 134 19 C148 15 158 24 170 21",
    calories:
      "M2 30 C20 34 35 25 53 28 C68 31 82 19 98 24 C114 28 128 31 143 24 C155 18 164 22 170 20",
  };

  const linePath = paths[variant];
  const areaPath = `${linePath} L170 42 L2 42 Z`;

  return (
    <svg
      aria-hidden="true"
      className={styles.metricSparkline}
      viewBox="0 0 172 42"
      preserveAspectRatio="none"
    >
      <path d={areaPath} className={styles.metricSparklineFill} />
      <path d={linePath} className={styles.metricSparklineLine} />
    </svg>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  sparkline,
}: MetricProps) {
  return (
    <div className={styles.metricCard}>
      <MetricSparkline variant={sparkline} />

      <div className={styles.metricIcon}>
        <Icon aria-hidden="true" />
      </div>

      <div className={styles.metricCopy}>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>
          {value}
          {unit ? <span>{unit}</span> : null}
        </p>
      </div>
    </div>
  );
}

function ElevationChart({
  values,
  distanceKm,
  distanceValues,
}: {
  values: readonly number[];
  distanceKm: number | null;
  distanceValues?: readonly number[] | null;
}) {
  if (values.length < 2) {
    return (
      <div className={styles.chartEmpty}>
        <Mountain aria-hidden="true" />
        <p>Le profil d’altitude n’est pas disponible pour cette activité.</p>
      </div>
    );
  }

  const chartData = buildElevationChartData(values, distanceKm, distanceValues);
  const { minimum, maximum } = getSeriesBounds(values);
  const elevationRange = Math.max(maximum - minimum, 1);
  const yMin = Math.max(
    0,
    Math.floor((minimum - elevationRange * 0.12) / 10) * 10,
  );
  const yMax = Math.ceil((maximum + elevationRange * 0.08) / 10) * 10;
  const yTicks = [0, 0.33, 0.66, 1].map(
    (ratio) => Math.round((yMin + (yMax - yMin) * ratio) / 10) * 10,
  );

  return (
    <div className={styles.chartShell}>
      <div className={styles.chartBounds}>
        <div>
          <p>Point bas</p>
          <strong>{formatNumber(minimum, { maximumFractionDigits: 0 })} m</strong>
        </div>
        <div>
          <p>Point haut</p>
          <strong>{formatNumber(maximum, { maximumFractionDigits: 0 })} m</strong>
        </div>
      </div>

      <div className={styles.chartCanvas}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 18, right: 12, left: 12, bottom: 6 }}
          >
            <defs>
              <linearGradient
                id="activity-elevation-area-v2"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--activity-accent)"
                  stopOpacity={0.26}
                />
                <stop
                  offset="100%"
                  stopColor="var(--activity-accent)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 5"
              vertical
              horizontal
              stroke="var(--activity-chart-grid)"
            />

            <XAxis
              dataKey="distance"
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              tick={{
                fill: "var(--activity-muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
              tickFormatter={(value) =>
                distanceKm && distanceKm > 0 ? `${value} km` : ""
              }
            />

            <YAxis
              width={54}
              tickLine={false}
              axisLine={false}
              domain={[yMin, yMax]}
              ticks={yTicks}
              tick={{
                fill: "var(--activity-muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
              tickFormatter={(value) => `${value} m`}
            />

            <Tooltip
              cursor={{ stroke: "var(--activity-accent)", strokeOpacity: 0.2 }}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(15, 23, 42, 0.94)",
                color: "#f8fafc",
                boxShadow: "0 18px 38px rgba(0, 0, 0, 0.22)",
              }}
              formatter={(value) => [
                `${formatNumber(
                  typeof value === "number" ? value : Number(value ?? 0),
                )} m`,
                "Altitude",
              ]}
              labelFormatter={(label) => {
                const numericLabel =
                  typeof label === "number" ? label : Number(label);

                return distanceKm &&
                  distanceKm > 0 &&
                  Number.isFinite(numericLabel)
                  ? `${formatNumber(numericLabel, {
                      maximumFractionDigits: 1,
                    })} km`
                  : "";
              }}
            />

            <Area
              type="natural"
              dataKey="elevation"
              stroke="var(--activity-accent)"
              strokeWidth={3}
              fill="url(#activity-elevation-area-v2)"
              fillOpacity={1}
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "var(--activity-surface)",
                fill: "var(--activity-accent)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ActivityDetailsPage() {
  const params = useParams<{ id: string }>();
  const activityId = params.id;
  const { data: activity, isLoading, error } = useActivity(activityId);
  const { data: plannedWorkoutSuggestion } =
    usePlannedWorkoutSuggestion(activityId);
  const completePlannedWorkout = useCompletePlannedWorkout();
  const [heroPanel, setHeroPanel] = useState<"map" | "photos">("map");
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    setHeroImage(pickRandomActivityFallbackImage());
  }, [activityId]);

  const activityPhotoUrls = activity ? getActivityPhotoUrls(activity) : [];
  const coverImageUrl = activityPhotoUrls[0] || activity?.coverImageUrl || null;
  const sportLabel = getSportLabel(activity ?? null);
  const difficulty = activity ? getDifficultyLabel(activity) : "—";
  const startLabel = activity ? getStartLabel(activity) : "";
  const hasPhoto = Boolean(coverImageUrl);
  const reportedPhotoCount =
    activity?.photoCount && activity.photoCount > 0
      ? activity.photoCount
      : activityPhotoUrls.length;
  const hasHiddenStravaPhotos = reportedPhotoCount > activityPhotoUrls.length;
  const elevationSeries = activity ? getElevationSeries(activity) : [];
  const distanceSeries = activity ? getDistanceSeries(activity) : null;
  const elevationBounds =
    elevationSeries.length >= 2 ? getSeriesBounds(elevationSeries) : null;
  const elevationTotals =
    elevationSeries.length >= 2 ? getElevationTotals(elevationSeries) : null;
  const elevationRate = activity ? getElevationRate(activity) : null;
  const minimumAltitude = activity
    ? ((activity as ActivityWithElevationSeries).minAltitude ??
      elevationBounds?.minimum ??
      getLowAltitude(activity))
    : null;
  const positiveElevation =
    activity?.elevationGain ?? elevationTotals?.ascent ?? null;
  const negativeElevation =
    activity?.elevationLoss ?? elevationTotals?.descent ?? null;

  const heroStyle = heroImage
    ? ({
        "--activity-hero-image": `url("${heroImage}")`,
      } as CSSProperties)
    : undefined;

  const handleShare = async () => {
    if (typeof window === "undefined" || !activity) {
      return;
    }

    const shareData = {
      title: activity.title || "Sortie Hovren",
      text: getHeroText(activity),
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <Link href="/activites" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          Retour aux sorties
        </Link>

        {isLoading ? (
          <div className={styles.stateCard}>Chargement de la sortie…</div>
        ) : null}

        {error ? (
          <div className={`${styles.stateCard} ${styles.errorCard}`}>
            Impossible de charger cette sortie.
          </div>
        ) : null}

        {activity ? (
          <FadeIn>
            <div className={styles.content}>
              {plannedWorkoutSuggestion ? (
                <section className={styles.matchSuggestion}>
                  <div>
                    <p>Correspondance possible</p>
                    <h2>
                      Cette sortie semble correspondre à ta séance
                      planifiée “{plannedWorkoutSuggestion.title ??
                        "Séance planifiée"}”.
                    </h2>
                    <span>Souhaitez-vous les associer ?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      completePlannedWorkout.mutate({
                        plannedWorkoutId: plannedWorkoutSuggestion.id,
                        activityId: activity.id,
                      })
                    }
                    disabled={completePlannedWorkout.isPending}
                  >
                    <CheckCircle2 aria-hidden="true" />
                    Associer
                  </button>
                </section>
              ) : null}

              <div className={styles.hero} style={heroStyle}>
                <div className={styles.heroShade} aria-hidden="true" />

                <div className={styles.heroContent}>
                  <div className={styles.heroTopline}>
                    <span className={styles.sportBadge}>
                      <Mountain aria-hidden="true" />
                      {sportLabel}
                    </span>

                    <div className={styles.heroActions}>
                      <button
                        type="button"
                        onClick={handleShare}
                        className={styles.heroAction}
                        aria-label="Partager cette sortie"
                      >
                        <Share2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.heroAction}
                        aria-label="Plus d’options"
                      >
                        <Ellipsis aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className={styles.heroCopy}>
                    <h1 className={styles.heroTitle}>
                      {activity.title || "Sortie sans titre"}
                    </h1>
                    <p className={styles.heroDescription}>
                      {getHeroText(activity)}
                    </p>
                  </div>

                  <div className={styles.heroMeta}>
                    <span>
                      <CalendarDays aria-hidden="true" />
                      {formatDate(activity.startedAt)}
                    </span>
                    <span>
                      <MapPin aria-hidden="true" />
                      {startLabel}
                    </span>
                    <span>
                      <SunMedium aria-hidden="true" />
                      {difficulty}
                    </span>
                  </div>
                </div>

                <div className={styles.mapOverlayCard}>
                  <div className={styles.mapTabs} role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={heroPanel === "map"}
                      onClick={() => setHeroPanel("map")}
                      className={heroPanel === "map" ? styles.activeTab : ""}
                    >
                      Carte
                    </button>

                    {hasPhoto ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={heroPanel === "photos"}
                        onClick={() => setHeroPanel("photos")}
                        className={
                          heroPanel === "photos" ? styles.activeTab : ""
                        }
                      >
                        Photos
                      </button>
                    ) : null}
                  </div>

                  <div className={styles.mapViewport}>
                    {heroPanel === "map" ? (
                      <ActivityMapboxRoute
                        city={activity.city}
                        country={activity.country}
                        distance={activity.distance}
                        polyline={activity.routePolyline}
                        title={activity.title || "Sortie sans titre"}
                      />
                    ) : coverImageUrl ? (
                      <div className={styles.photoViewport}>
                        <Image
                          src={coverImageUrl}
                          alt={activity.title || "Photo de sortie"}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 44vw"
                          className={styles.photoImage}
                        />
                        <div className={styles.photoCaption}>
                          <span>Photo Strava</span>
                          <small>
                            {hasHiddenStravaPhotos
                              ? `${reportedPhotoCount} photos signalées`
                              : `${reportedPhotoCount} photo${reportedPhotoCount > 1 ? "s" : ""}`}
                          </small>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <MetricCard
                  icon={Route}
                  label="Distance"
                  value={formatNumber(activity.distance, {
                    maximumFractionDigits: 2,
                  })}
                  unit="km"
                  sparkline="distance"
                />
                <MetricCard
                  icon={Timer}
                  label="Temps en mouvement"
                  value={formatMovingTime(activity.movingTime)}
                  sparkline="time"
                />
                <MetricCard
                  icon={Mountain}
                  label="Dénivelé +"
                  value={formatNumber(positiveElevation, {
                    maximumFractionDigits: 0,
                  })}
                  unit="m"
                  sparkline="elevation"
                />
                <MetricCard
                  icon={Flame}
                  label="Calories"
                  value={formatNumber(activity.calories, {
                    maximumFractionDigits: 0,
                  })}
                  unit="kcal"
                  sparkline="calories"
                />
              </div>

              <div className={styles.analysisGrid}>
                <div className={styles.elevationCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>Profil d’altitude</h2>
                      <p className={styles.cardSubtitle}>
                        Une lecture claire du relief sur l’ensemble de la sortie.
                      </p>
                    </div>

                    <div className={styles.totalPill}>
                      <span>D+ total</span>
                      <strong>
                        {formatNumber(positiveElevation, {
                          maximumFractionDigits: 0,
                        })} {" "}
                        m
                      </strong>
                    </div>
                  </div>

                  <ElevationChart
                    values={elevationSeries}
                    distanceKm={activity.distance}
                    distanceValues={distanceSeries}
                  />

                  <div className={styles.elevationFacts}>
                    <div>
                      <span>Altitude min</span>
                      <strong>
                        {minimumAltitude !== null
                          ? `${formatNumber(minimumAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Altitude max</span>
                      <strong>
                        {activity.maxAltitude !== null
                          ? `${formatNumber(activity.maxAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Dénivelé négatif</span>
                      <strong>
                        {negativeElevation !== null
                          ? `${formatNumber(negativeElevation, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Intensité verticale</span>
                      <strong>
                        {elevationRate !== null
                          ? `${formatNumber(elevationRate, {
                              maximumFractionDigits: 0,
                            })} m/km`
                          : "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                <aside className={styles.summaryCard}>
                  <h2 className={styles.cardTitle}>Résumé de la sortie</h2>

                  <div className={styles.summaryRows}>
                    <div>
                      <span>Type</span>
                      <strong>{sportLabel}</strong>
                    </div>
                    <div>
                      <span>Difficulté</span>
                      <strong className={styles.accentValue}>{difficulty}</strong>
                    </div>
                    <div>
                      <span>Source</span>
                      <strong className={styles.sourceValue}>
                        <i aria-hidden="true">S</i>
                        {getSourceLabel(activity)}
                      </strong>
                    </div>
                    <div>
                      <span>Allure moyenne</span>
                      <strong>{formatPace(activity)}</strong>
                    </div>
                    <div>
                      <span>Vitesse moyenne</span>
                      <strong>{formatSpeed(activity.averageSpeed)} km/h</strong>
                    </div>
                    <div>
                      <span>Fréquence cardiaque</span>
                      <strong>
                        {activity.averageHeartRate !== null
                          ? `${formatNumber(activity.averageHeartRate, {
                              maximumFractionDigits: 0,
                            })} bpm`
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Terrain</span>
                      <strong>{getSurfaceLabel(activity)}</strong>
                    </div>
                  </div>

                  {getTerrainTags(activity).length > 0 ? (
                    <div className={styles.tags}>
                      {getTerrainTags(activity).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}

                  <p className={styles.summaryNote}>{getSummaryText(activity)}</p>

                  <Link href="/statistiques" className={styles.summaryCta}>
                    Voir toutes les statistiques
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </aside>
              </div>
            </div>
          </FadeIn>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
