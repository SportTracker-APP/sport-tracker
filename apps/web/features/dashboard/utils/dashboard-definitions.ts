import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleGauge,
  Droplets,
  Footprints,
  Gauge,
  HeartPulse,
  Mountain,
  Route,
  Target,
} from "lucide-react";

import type {
  GoalProgressSummary,
  MetricDefinition,
  RecommendationDefinition,
} from "../types";
import type { DashboardData } from "./dashboard-data";
import {
  formatDayCount,
  formatDistance,
  formatNumber,
  formatSignedDistance,
} from "./date-format";

export function buildMetricDefinitions({
  dashboardData,
  averageElevation,
  goalProgress,
  goalRemainingLabel,
  daysSinceLastActivity,
}: {
  dashboardData: DashboardData;
  averageElevation: number;
  goalProgress: GoalProgressSummary;
  goalRemainingLabel: string;
  daysSinceLastActivity: number | null;
}): MetricDefinition[] {
  return [
    {
      title: "Sorties",
      value: formatNumber(dashboardData.currentMonthActivities.length),
      description: "Mois actuel",
      icon: Footprints,
      featured: true,
      trend:
        dashboardData.activeDays > 0
          ? `${formatDayCount(dashboardData.activeDays)} actifs sur 30`
          : "Première sortie à planifier",
      trendTone: dashboardData.activeDays > 0 ? "positive" : "neutral",
      tone: "forest",
    },
    {
      title: "Distance",
      value: formatDistance(dashboardData.currentMonthDistance, 0),
      description: "Mois actuel",
      icon: Route,
      trend: dashboardData.currentMonthBestActivity
        ? `Sortie record : ${formatDistance(
            dashboardData.currentMonthBestActivity.distance || 0,
            1,
          )}`
        : "Le terrain vous attend",
      trendTone: dashboardData.currentMonthBestActivity
        ? "positive"
        : "neutral",
      tone: "mint",
    },
    {
      title: "D+",
      value: `${formatNumber(dashboardData.currentMonthElevation)} m`,
      description: "Mois actuel",
      icon: Mountain,
      trend:
        dashboardData.rollingActivities.length > 0
          ? `Moy. ${formatNumber(averageElevation)} m / sortie`
          : "Prochain sommet à choisir",
      trendTone:
        dashboardData.rollingActivities.length > 0 ? "positive" : "neutral",
      tone: "sage",
    },
    {
      title: "Cap",
      value: `${goalProgress.progress}%`,
      description: "Progression actuelle",
      icon: HeartPulse,
      trend:
        goalProgress.progress >= 100
          ? "Objectif validé"
          : goalProgress.progress >= 80
            ? "Dernière ligne droite"
            : `Encore ${goalRemainingLabel}`,
      trendTone: goalProgress.progress >= 80 ? "positive" : "neutral",
      tone: "lime",
    },
    {
      title: "Série",
      value: formatDayCount(dashboardData.currentStreak),
      description: "Régularité actuelle",
      icon: CircleGauge,
      trend:
        daysSinceLastActivity === null
          ? "Première sortie à planifier"
          : daysSinceLastActivity === 0
            ? "Sortie enregistrée aujourd’hui"
            : `Dernière sortie il y a ${formatDayCount(daysSinceLastActivity)}`,
      trendTone:
        daysSinceLastActivity !== null && daysSinceLastActivity <= 2
          ? "positive"
          : "neutral",
      tone: "sky",
    },
  ];
}

export function buildRecommendationDefinitions({
  hasSyncedStrava,
  goalProgress,
  goalRemainingLabel,
  weeklyDelta,
}: {
  hasSyncedStrava: boolean;
  goalProgress: GoalProgressSummary;
  goalRemainingLabel: string;
  weeklyDelta: number;
}): RecommendationDefinition[] {
  return [
    {
      title: hasSyncedStrava ? "Strava synchronisé" : "Strava à connecter",
      description: hasSyncedStrava
        ? "Les données du dashboard sont alimentées automatiquement."
        : "Le dashboard utilise encore vos activités manuelles.",
      icon: hasSyncedStrava ? CheckCircle2 : AlertTriangle,
      href: "/integrations/strava",
      label: hasSyncedStrava ? "OK" : "Connecter",
      tone: "success",
    },
    {
      title:
        goalProgress.progress >= 80 ? "Objectif à portée" : "Cap encore ouvert",
      description:
        goalProgress.progress >= 80
          ? "Vous êtes dans la dernière ligne droite des 30 jours."
          : `${goalRemainingLabel} restent à aller chercher.`,
      icon: Target,
      href: "/objectifs",
      label:
        goalProgress.progress >= 80 ? "Continue comme ça !" : "Voir le cap",
      tone: "success",
    },
    {
      title: weeklyDelta >= 0 ? "Semaine solide" : "Semaine plus calme",
      description:
        weeklyDelta >= 0
          ? formatSignedDistance(weeklyDelta)
          : "Une sortie courte peut relancer le rythme.",
      icon: weeklyDelta >= 0 ? ArrowUpRight : Gauge,
      href: "/calendrier",
      label: weeklyDelta >= 0 ? "Bien joué" : "Planifie une sortie",
      tone: weeklyDelta >= 0 ? "success" : "warning",
    },
    {
      title: "Hydratation & récup",
      description: "Pense à t’hydrater et à bien récupérer après les efforts.",
      icon: Droplets,
      href: "/journal",
      label: "Bon réflexe",
      tone: "success",
    },
  ];
}
