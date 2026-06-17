"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ElementType } from "react";

import {
  ArrowLeft,
  CalendarDays,
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

import { MiniRouteMap } from "@/components/activities/mini-route-map";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { useActivity } from "@/hooks/use-activities";
import { pickRandomActivityFallbackImage } from "@/lib/activity-fallback-images";
import type { Activity as ActivityModel } from "@/lib/activities";

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
  return activity.stravaActivityId ? "Strava" : "Montaro";
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

type StatProps = {
  icon: ElementType;
  label: string;
  value: string;
  unit?: string;
};

function Stat({ icon: Icon, label, value, unit }: StatProps) {
  return (
    <div className="flex min-h-[92px] items-center gap-4 px-5 py-4 sm:px-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl leading-none font-bold tracking-tight text-slate-900 xl:text-3xl">
          {value}
          {unit && (
            <span className="ml-1 text-base font-semibold text-slate-700">
              {unit}
            </span>
          )}
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
      <div className="app-activity-detail-chart flex min-h-[320px] items-center justify-center rounded-[22px] px-6 py-10 text-center">
        <div>
          <Mountain className="mx-auto h-7 w-7 text-emerald-500" />
          <p className="app-activity-detail-muted mt-3 text-sm font-medium">
            Le profil d’altitude n’est pas disponible pour cette activité.
          </p>
        </div>
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
    <div className="app-activity-detail-chart relative overflow-hidden rounded-[22px]">
      <div className="pointer-events-none absolute inset-x-5 top-4 z-10 flex items-start justify-between gap-4">
        <div>
          <p className="app-activity-detail-eyebrow">Point bas</p>
          <strong className="mt-1 block text-2xl leading-none">
            {formatNumber(minimum, { maximumFractionDigits: 0 })} m
          </strong>
        </div>
        <div className="text-right">
          <p className="app-activity-detail-eyebrow">Point haut</p>
          <strong className="mt-1 block text-2xl leading-none">
            {formatNumber(maximum, { maximumFractionDigits: 0 })} m
          </strong>
        </div>
      </div>

      <div className="h-[320px] w-full pt-15">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 14,
              right: 12,
              left: 18,
              bottom: 10,
            }}
          >
            <defs>
              <linearGradient
                id="activity-elevation-area"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.04} />
              </linearGradient>

              <linearGradient
                id="activity-elevation-line"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="62%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#84cc16" />
              </linearGradient>

              <filter id="activity-elevation-glow">
                <feGaussianBlur stdDeviation="7" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical
              horizontal
              className="app-activity-detail-chart-grid"
            />

            <XAxis
              dataKey="distance"
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tick={{
                fill: "var(--activity-detail-muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
              tickFormatter={(value) =>
                distanceKm && distanceKm > 0 ? `${value} km` : ""
              }
            />

            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--activity-detail-muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={(value) => `${value} m`}
            />

            <Tooltip
              cursor={false}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid rgba(16, 185, 129, 0.18)",
                background: "rgba(15, 23, 42, 0.92)",
                color: "#f8fafc",
                boxShadow: "0 18px 38px rgba(0, 0, 0, 0.22)",
              }}
              formatter={(value) => [
                `${formatNumber(
                  typeof value === "number" ? value : Number(value ?? 0),
                )} m`,
                "Altitude",
              ]}
              labelFormatter={(label: number) =>
                distanceKm && distanceKm > 0
                  ? `${formatNumber(label, { maximumFractionDigits: 1 })} km`
                  : ""
              }
            />

            <Area
              type="natural"
              dataKey="elevation"
              stroke="url(#activity-elevation-line)"
              strokeWidth={4}
              fill="url(#activity-elevation-area)"
              fillOpacity={1}
              filter="url(#activity-elevation-glow)"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 0,
                fill: "#ffffff",
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
  const [heroPanel, setHeroPanel] = useState<"map" | "photos">("map");
  const fallbackHeroImage = useMemo(
    () => pickRandomActivityFallbackImage(),
    [],
  );

  const activityPhotoUrls = activity ? getActivityPhotoUrls(activity) : [];
  const coverImageUrl =
    activityPhotoUrls[0] || activity?.coverImageUrl || fallbackHeroImage;
  const sportLabel = getSportLabel(activity ?? null);
  const difficulty = activity ? getDifficultyLabel(activity) : "—";
  const startLabel = activity ? getStartLabel(activity) : "";
  const hasPhoto = Boolean(activityPhotoUrls[0] || activity?.coverImageUrl);
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
  return (
    <DashboardLayout>
      <div className="app-activity-detail-page mx-auto w-full max-w-[1480px] space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3 xl:px-8">
        <Link
          href="/activites"
          className="app-activity-detail-backlink inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sorties
        </Link>

        {isLoading && (
          <section className="rounded-[24px] border border-emerald-100 bg-white/90 p-10 text-center text-slate-500 shadow-[0_18px_48px_rgba(6,78,59,0.08)]">
            Chargement de la sortie...
          </section>
        )}

        {error && (
          <section className="rounded-[24px] border border-red-200 bg-red-50/90 p-10 text-center text-red-700 shadow-[0_18px_48px_rgba(153,27,27,0.06)]">
            Impossible de charger cette sortie.
          </section>
        )}

        {activity && (
          <FadeIn>
            <div className="space-y-5">
              <section className="app-activity-detail-hero app-activity-detail-surface grid overflow-hidden rounded-[26px] lg:h-[400px] lg:grid-cols-[1.12fr_0.88fr] xl:h-[420px]">
                <div className="app-activity-detail-hero-photo relative h-[300px] overflow-hidden lg:h-auto">
                  <Image
                    src={coverImageUrl}
                    alt={activity.title || "Photo de sortie"}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 56vw"
                    className="scale-[1.04] object-cover"
                    style={{
                      objectPosition: hasPhoto ? "center 84%" : "center 76%",
                    }}
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(3,18,14,0.88)_0%,rgba(3,18,14,0.48)_46%,rgba(3,18,14,0.16)_100%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,15,18,0.38),rgba(7,15,18,0.14)_42%,transparent)]" />

                  <div className="app-activity-detail-hero-content relative z-10 flex h-full flex-col gap-6 p-5 lg:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-[#1f3c2e]/70 px-4 py-2 text-sm font-semibold text-emerald-50 backdrop-blur-sm">
                        <Mountain className="h-4 w-4" />
                        {sportLabel}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/20 text-white/90 backdrop-blur-sm"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/20 text-white/90 backdrop-blur-sm"
                        >
                          <Ellipsis className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="app-activity-detail-hero-copy mt-auto max-w-[660px]">
                      <h1 className="max-w-[620px] text-[clamp(1.6rem,1.95vw,2.28rem)] leading-[1.12] font-semibold tracking-[-0.018em] text-white">
                        {activity.title || "Sortie sans titre"}
                      </h1>
                      <p className="mt-3 max-w-[48ch] text-sm leading-6 font-medium text-white/82 lg:text-[15px] lg:leading-7">
                        {getHeroText(activity)}
                      </p>
                    </div>

                    <div className="app-activity-detail-hero-meta mt-2 flex flex-wrap gap-3 pb-2">
                      <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                        <CalendarDays className="h-4 w-4 text-emerald-100" />
                        {formatDate(activity.startedAt)}
                      </span>
                      <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                        <MapPin className="h-4 w-4 text-emerald-100" />
                        {startLabel}
                      </span>
                      <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                        <SunMedium className="h-4 w-4 text-amber-300" />
                        {difficulty}
                      </span>
                      {activity.temperature !== null && (
                        <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                          <SunMedium className="h-4 w-4 text-amber-300" />
                          {formatNumber(activity.temperature, {
                            maximumFractionDigits: 0,
                          })}
                          °C
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="app-activity-detail-side-panel flex h-[300px] min-h-0 flex-col gap-3 p-3 lg:h-auto lg:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 p-1">
                      <button
                        type="button"
                        onClick={() => setHeroPanel("map")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          heroPanel === "map"
                            ? "bg-white text-emerald-900 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                            : "text-slate-500"
                        }`}
                      >
                        Carte
                      </button>
                      {hasPhoto && (
                        <button
                          type="button"
                          onClick={() => setHeroPanel("photos")}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            heroPanel === "photos"
                              ? "bg-white text-emerald-900 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                              : "text-slate-500"
                          }`}
                        >
                          Photos
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    id="activity-map"
                    className={`app-activity-detail-map-shell min-h-0 flex-1 overflow-hidden rounded-[22px] ${
                      heroPanel === "photos"
                        ? "app-activity-detail-photo-shell"
                        : ""
                    }`}
                  >
                    {heroPanel === "map" ? (
                      <MiniRouteMap
                        display="wide"
                        polyline={activity.routePolyline}
                        size="large"
                      />
                    ) : (
                      <div className="relative h-full min-h-[260px] overflow-hidden rounded-[22px]">
                        <Image
                          src={coverImageUrl}
                          alt={activity.title || "Photo de sortie"}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 44vw"
                          className="object-cover"
                          style={{ objectPosition: "center 70%" }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(7,15,18,0.38),rgba(7,15,18,0.02)_58%)]" />
                        <div className="absolute bottom-4 left-4 rounded-full border border-white/18 bg-black/24 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                          Photo principale
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="app-activity-detail-surface grid overflow-hidden rounded-[24px] sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  icon={Route}
                  label="Distance"
                  value={formatNumber(activity.distance, {
                    maximumFractionDigits: 2,
                  })}
                  unit="km"
                />
                <div className="border-t border-emerald-100 sm:border-t-0 sm:border-l">
                  <Stat
                    icon={Timer}
                    label="Temps en mouvement"
                    value={formatMovingTime(activity.movingTime)}
                  />
                </div>
                <div className="border-t border-emerald-100 xl:border-t-0 xl:border-l">
                  <Stat
                    icon={Mountain}
                    label="Dénivelé +"
                    value={formatNumber(positiveElevation, {
                      maximumFractionDigits: 0,
                    })}
                    unit="m"
                  />
                </div>
                <div className="border-t border-emerald-100 sm:border-l xl:border-t-0">
                  <Stat
                    icon={Flame}
                    label="Calories"
                    value={formatNumber(activity.calories, {
                      maximumFractionDigits: 0,
                    })}
                    unit="kcal"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
                <section className="app-activity-detail-surface rounded-[26px] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="app-activity-detail-eyebrow">
                        Lecture du terrain
                      </p>
                      <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                        Profil d’altitude
                      </h2>
                      <p className="app-activity-detail-muted mt-1 text-sm">
                        Une lecture claire du relief sur l’ensemble de la
                        sortie.
                      </p>
                    </div>

                    <div className="app-activity-detail-climb-pill rounded-2xl px-4 py-3 text-right">
                      <p className="app-activity-detail-eyebrow">D+ total</p>
                      <strong className="mt-1 block text-xl">
                        {formatNumber(positiveElevation, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        m
                      </strong>
                    </div>
                  </div>

                  <div className="mt-5">
                    <ElevationChart
                      values={elevationSeries}
                      distanceKm={activity.distance}
                      distanceValues={distanceSeries}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="app-activity-detail-data-tile rounded-[18px] px-4 py-3.5">
                      <p className="app-activity-detail-eyebrow">
                        Altitude min
                      </p>
                      <strong className="mt-2 block text-xl">
                        {minimumAltitude !== null
                          ? `${formatNumber(minimumAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div className="app-activity-detail-data-tile rounded-[18px] px-4 py-3.5">
                      <p className="app-activity-detail-eyebrow">
                        Altitude max
                      </p>
                      <strong className="mt-2 block text-xl">
                        {activity.maxAltitude !== null
                          ? `${formatNumber(activity.maxAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div className="app-activity-detail-data-tile rounded-[18px] px-4 py-3.5">
                      <p className="app-activity-detail-eyebrow">
                        Dénivelé positif
                      </p>
                      <strong className="mt-2 block text-xl">
                        {positiveElevation !== null
                          ? `${formatNumber(positiveElevation, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div className="app-activity-detail-data-tile rounded-[18px] px-4 py-3.5">
                      <p className="app-activity-detail-eyebrow">
                        Dénivelé négatif
                      </p>
                      <strong className="mt-2 block text-xl">
                        {negativeElevation !== null
                          ? `${formatNumber(negativeElevation, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  {elevationRate !== null && (
                    <div className="mt-3 flex justify-end">
                      <span className="app-activity-detail-tag rounded-full px-3 py-1.5 text-xs font-semibold">
                        {formatNumber(elevationRate, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        m de D+ / km
                      </span>
                    </div>
                  )}
                </section>

                <aside className="app-activity-detail-surface rounded-[24px] p-5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Résumé de la sortie
                  </h2>

                  <div className="mt-5 grid gap-3">
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">Type</span>
                      <strong className="text-right font-semibold text-slate-900">
                        {sportLabel}
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Difficulté
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {difficulty}
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">Source</span>
                      <strong className="text-right font-semibold text-slate-900">
                        {getSourceLabel(activity)}
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Allure moyenne
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {formatPace(activity)}
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Vitesse moyenne
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {formatSpeed(activity.averageSpeed)} km/h
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Fréquence cardiaque
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {activity.averageHeartRate !== null
                          ? `${formatNumber(activity.averageHeartRate, {
                              maximumFractionDigits: 0,
                            })} bpm`
                          : "—"}
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Altitude minimale
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {minimumAltitude !== null
                          ? `${formatNumber(minimumAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Altitude maximale
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {activity.maxAltitude !== null
                          ? `${formatNumber(activity.maxAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div className="app-activity-detail-meta-row flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Terrain
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {getSurfaceLabel(activity)}
                      </strong>
                    </div>
                  </div>

                  {getTerrainTags(activity).length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {getTerrainTags(activity).map((tag) => (
                        <span
                          key={tag}
                          className="app-activity-detail-tag rounded-full px-3 py-1 text-xs font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </aside>
              </div>

              <div
                className={`grid gap-5 ${hasPhoto ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}
              >
                <section className="app-activity-detail-surface rounded-[22px] p-5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Conditions
                  </h2>

                  {activity.temperature !== null || activity.weather ? (
                    <>
                      <div className="mt-4">
                        <strong className="text-[2rem] leading-none font-bold tracking-tight text-slate-900">
                          {activity.temperature !== null
                            ? `${formatNumber(activity.temperature, {
                                maximumFractionDigits: 0,
                              })}°C`
                            : activity.weather}
                        </strong>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          {activity.weather || "Conditions au depart"}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <div className="app-activity-detail-meta-row flex items-center justify-between border-b border-emerald-100 pb-3 text-sm">
                          <span className="font-medium text-slate-500">
                            Temperature
                          </span>
                          <strong className="font-semibold text-slate-900">
                            {activity.temperature !== null
                              ? `${formatNumber(activity.temperature, {
                                  maximumFractionDigits: 0,
                                })}°C`
                              : "—"}
                          </strong>
                        </div>
                        <div className="app-activity-detail-meta-row flex items-center justify-between border-b border-emerald-100 pb-3 text-sm">
                          <span className="font-medium text-slate-500">
                            Vent
                          </span>
                          <strong className="font-semibold text-slate-900">
                            —
                          </strong>
                        </div>
                        <div className="app-activity-detail-meta-row flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-500">
                            Humidite
                          </span>
                          <strong className="font-semibold text-slate-900">
                            —
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="app-activity-detail-data-tile mt-4 rounded-[18px] p-4 text-sm leading-6 font-medium text-slate-600">
                      Météo indisponible pour cette sortie.
                    </div>
                  )}
                </section>

                <section className="app-activity-detail-surface rounded-[22px] p-5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Journal de sortie
                  </h2>

                  <p className="mt-4 text-[15px] leading-7 font-medium text-slate-600">
                    {getSummaryText(activity)}
                  </p>

                  <button
                    type="button"
                    className="app-activity-detail-action mt-6 inline-flex min-h-11 items-center justify-center rounded-[16px] px-4 text-sm font-semibold"
                  >
                    Ajouter une note
                  </button>
                </section>

                {hasPhoto && (
                  <section className="app-activity-detail-surface rounded-[22px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                          Photos
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {hasHiddenStravaPhotos
                            ? `Strava indique ${reportedPhotoCount} photos, mais l’aperçu disponible ici reste limité.`
                            : "Toutes les photos détectées pour cette activité"}
                        </p>
                      </div>
                      <span className="app-activity-detail-tag rounded-full px-3 py-1 text-xs font-semibold">
                        {reportedPhotoCount} photo
                        {reportedPhotoCount > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                      {activityPhotoUrls.map((photoUrl, index) => (
                        <div
                          key={`${photoUrl}-${index}`}
                          className="relative h-28 w-44 shrink-0 overflow-hidden rounded-[18px] border border-emerald-100"
                        >
                          <Image
                            src={photoUrl}
                            alt={`${activity.title || "Photo de sortie"} ${index + 1}`}
                            fill
                            unoptimized
                            sizes="176px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    {hasHiddenStravaPhotos && activity.stravaActivityId ? (
                      <a
                        href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="app-activity-detail-action mt-6 inline-flex min-h-11 items-center justify-center rounded-[16px] px-4 text-sm font-semibold"
                      >
                        Voir sur Strava
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="app-activity-detail-action mt-6 inline-flex min-h-11 items-center justify-center rounded-[16px] px-4 text-sm font-semibold"
                      >
                        Voir toutes les photos
                      </button>
                    )}
                  </section>
                )}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </DashboardLayout>
  );
}
