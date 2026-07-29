import {
  Flame,
  Gauge,
  Mountain,
  Route,
  Timer,
  type LucideIcon,
} from "lucide-react";

import type { Activity } from "@/lib/activities";

import {
  formatDuration,
  formatNumber,
  getDifficultyLabel,
  getLocationLabel,
  getLoopLabel,
  getPace,
  getSportLabel,
} from "./activity-detail-utils";

export type CoverMode = "map" | "photos";

export type ActivityMetric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type ActivityFieldRow = {
  label: string;
  value: string;
};

function formatSpeed(value: number) {
  return `${formatNumber(value * 3.6, {
    maximumFractionDigits: 1,
  })} km/h`;
}

const paceSports = new Set(["RUNNING", "TRAIL", "WALKING"]);

export function buildActivityMetrics(activity: Activity): ActivityMetric[] {
  const metrics: ActivityMetric[] = [];

  if (activity.distance !== null) {
    metrics.push({
      label: "Distance",
      value: `${formatNumber(activity.distance, {
        maximumFractionDigits: 1,
      })} km`,
      detail: "Trace parcourue",
      icon: Route,
    });
  }

  metrics.push({
    label: "Temps",
    value: formatDuration(
      activity.movingTime !== null
        ? activity.movingTime / 60
        : activity.duration,
    ),
    detail: activity.movingTime !== null ? "Temps en mouvement" : "Durée",
    icon: Timer,
  });

  if (activity.elevationGain !== null) {
    metrics.push({
      label: "Dénivelé positif",
      value: `${formatNumber(activity.elevationGain, {
        maximumFractionDigits: 0,
      })} m`,
      detail: "Relief gravi",
      icon: Mountain,
    });
  }

  const pace = paceSports.has(activity.sport) ? getPace(activity) : null;

  if (pace) {
    metrics.push({
      label: "Allure moyenne",
      value: pace,
      detail: "Sur la sortie",
      icon: Gauge,
    });
  } else if (activity.averageSpeed !== null) {
    metrics.push({
      label: "Vitesse moyenne",
      value: formatSpeed(activity.averageSpeed),
      detail: "Sur la sortie",
      icon: Gauge,
    });
  } else if (activity.calories !== null) {
    metrics.push({
      label: "Énergie",
      value: `${formatNumber(activity.calories)} kcal`,
      detail: "Estimation",
      icon: Flame,
    });
  }

  return metrics.slice(0, 4);
}

export function buildActivityFieldRows(
  activity: Activity,
): ActivityFieldRow[] {
  const rows: ActivityFieldRow[] = [
    { label: "Discipline", value: getSportLabel(activity) },
    { label: "Difficulté", value: getDifficultyLabel(activity) },
    { label: "Territoire", value: getLocationLabel(activity) },
  ];
  const loop = getLoopLabel(activity.routePolyline);

  if (activity.stravaActivityId) {
    rows.push({ label: "Source", value: "Strava" });
  }
  if (loop) rows.push({ label: "Parcours", value: loop });
  if (activity.maxAltitude !== null) {
    rows.push({
      label: "Point culminant",
      value: `${formatNumber(activity.maxAltitude)} m`,
    });
  }
  if (activity.minAltitude != null) {
    rows.push({
      label: "Point le plus bas",
      value: `${formatNumber(activity.minAltitude)} m`,
    });
  }
  if (activity.elevationLoss !== null) {
    rows.push({
      label: "Dénivelé négatif",
      value: `${formatNumber(activity.elevationLoss)} m`,
    });
  }
  if (activity.averageSpeed !== null) {
    rows.push({
      label: "Vitesse moyenne",
      value: formatSpeed(activity.averageSpeed),
    });
  }
  if (activity.maxSpeed !== null) {
    rows.push({
      label: "Vitesse maximale",
      value: formatSpeed(activity.maxSpeed),
    });
  }
  if (activity.averageHeartRate !== null) {
    rows.push({
      label: "Fréquence moyenne",
      value: `${Math.round(activity.averageHeartRate)} bpm`,
    });
  }
  if (activity.maxHeartRate !== null) {
    rows.push({
      label: "Fréquence maximale",
      value: `${Math.round(activity.maxHeartRate)} bpm`,
    });
  }
  if (activity.calories !== null) {
    rows.push({
      label: "Énergie",
      value: `${formatNumber(activity.calories)} kcal`,
    });
  }
  if (activity.temperature !== null) {
    rows.push({
      label: "Température",
      value: `${Math.round(activity.temperature)} °C`,
    });
  }
  if (activity.weather?.trim()) {
    rows.push({ label: "Conditions", value: activity.weather.trim() });
  }

  return rows;
}
