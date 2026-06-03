"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  Flame,
  Gauge,
  Link2,
  MapPinned,
  Plus,
  Route,
  ShieldCheck,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { MonthlyGoalCard } from "@/components/dashboard/monthly-goal-card";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { FadeIn } from "@/components/ui/fade-in";
import { useActivities } from "@/hooks/use-activities";
import { api } from "@/lib/api";
import type { Activity as SportActivity } from "@/lib/activities";

type StravaStatus = {
  connected: boolean;
  hasSyncedActivities?: boolean;
  syncedActivitiesCount?: number;
};

const rollingTargetDistance = 420;

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits,
  }).format(value);
}

function formatDistance(distance: number, maximumFractionDigits = 1) {
  return `${formatNumber(distance, maximumFractionDigits)} km`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${String(remainingMinutes).padStart(2, "0")}`;
}

function formatSignedDistance(distance: number) {
  if (distance === 0) {
    return "Stable cette semaine";
  }

  const prefix = distance > 0 ? "+" : "-";

  return `${prefix}${formatDistance(Math.abs(distance), 1)} vs semaine passée`;
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(date));
}

function getSportLabel(activity: SportActivity | null) {
  if (!activity) {
    return "Aucune sortie";
  }

  const labels: Record<string, string> = {
    FITNESS: "Fitness",
    GRAVEL: "Gravel",
    GYM: "Musculation",
    HIKING: "Randonnée",
    MTB: "VTT",
    ROAD_CYCLING: "Cyclisme",
    RUNNING: "Course",
    TRAIL: "Trail",
    WALKING: "Marche",
  };

  return labels[activity.sport] ?? "Sport";
}

function getCompletedActivities(activities: SportActivity[]) {
  return activities
    .filter((activity) => activity.status !== "PLANNED")
    .sort(
      (firstActivity, secondActivity) =>
        new Date(secondActivity.startedAt).getTime() -
        new Date(firstActivity.startedAt).getTime(),
    );
}

function getActivitiesBetween(
  activities: SportActivity[],
  startDate: Date,
  endDate: Date,
) {
  return activities.filter((activity) => {
    const startedAt = new Date(activity.startedAt);

    return startedAt >= startDate && startedAt <= endDate;
  });
}

function EmptyStravaDashboard() {
  return (
    <FadeIn delay={0.1}>
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.025] px-6 py-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_34%)]" />

        <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-200">
              <Link2 className="h-3.5 w-3.5" />
              Strava non synchronisé
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-white">
              Connectez Strava pour remplir votre dashboard automatiquement.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Une fois la première synchronisation lancée, vos sorties,
              distances, temps, calories et dernières activités apparaîtront ici
              avec vos vraies données.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/integrations/strava"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#FC4C02] px-5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(252,76,2,0.28)] transition hover:scale-[1.02]"
              >
                <Link2 className="h-4 w-4" />
                Connecter Strava
              </Link>

              <Link
                href="/activites/nouvelle"
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/15 hover:bg-white/[0.06]"
              >
                <Plus className="h-4 w-4" />
                Ajouter une activité
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">
              Après synchronisation
            </p>

            <div className="mt-5 space-y-3">
              {[
                "Stats réelles de la semaine et des 30 derniers jours",
                "Graphique hebdomadaire basé sur vos sorties",
                "Dernières activités Strava importées",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

export default function HomePage() {
  const { data: activities = [], isLoading, error } = useActivities();
  const [stravaStatus, setStravaStatus] = useState<StravaStatus | null>(null);
  const [isLoadingStravaStatus, setIsLoadingStravaStatus] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStravaStatus() {
      try {
        const { data } = await api.get<StravaStatus>("/strava/status");

        if (isMounted) {
          setStravaStatus(data);
        }
      } catch {
        if (isMounted) {
          setStravaStatus({
            connected: false,
            hasSyncedActivities: false,
            syncedActivitiesCount: 0,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingStravaStatus(false);
        }
      }
    }

    void loadStravaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);

    const previousWeekStart = addDays(weekStart, -7);
    const previousWeekEnd = addDays(weekStart, -1);
    previousWeekEnd.setHours(23, 59, 59, 999);

    const rollingPeriodStart = new Date(now);
    rollingPeriodStart.setDate(now.getDate() - 30);
    rollingPeriodStart.setHours(0, 0, 0, 0);

    const rollingPeriodEnd = new Date(now);
    rollingPeriodEnd.setHours(23, 59, 59, 999);

    const completedActivities = getCompletedActivities(activities);
    const weekActivities = getActivitiesBetween(
      completedActivities,
      weekStart,
      weekEnd,
    );
    const previousWeekActivities = getActivitiesBetween(
      completedActivities,
      previousWeekStart,
      previousWeekEnd,
    );
    const rollingActivities = getActivitiesBetween(
      completedActivities,
      rollingPeriodStart,
      rollingPeriodEnd,
    );

    const weeklyDistance = weekActivities.reduce(
      (total, activity) => total + (activity.distance || 0),
      0,
    );
    const previousWeeklyDistance = previousWeekActivities.reduce(
      (total, activity) => total + (activity.distance || 0),
      0,
    );
    const rollingDistance = rollingActivities.reduce(
      (total, activity) => total + (activity.distance || 0),
      0,
    );
    const weeklyDuration = weekActivities.reduce(
      (total, activity) => total + activity.duration,
      0,
    );
    const rollingDuration = rollingActivities.reduce(
      (total, activity) => total + activity.duration,
      0,
    );
    const rollingCalories = rollingActivities.reduce(
      (total, activity) => total + (activity.calories || 0),
      0,
    );
    const activeDays = new Set(
      rollingActivities.map((activity) =>
        new Date(activity.startedAt).toDateString(),
      ),
    ).size;
    const bestActivity = rollingActivities.reduce<SportActivity | null>(
      (bestActivityCandidate, activity) => {
        if (!bestActivityCandidate) {
          return activity;
        }

        return (activity.distance || 0) > (bestActivityCandidate.distance || 0)
          ? activity
          : bestActivityCandidate;
      },
      null,
    );
    const rollingProgress = Math.min(
      100,
      Math.round((rollingDistance / rollingTargetDistance) * 100),
    );
    const remainingDistance = Math.max(
      0,
      rollingTargetDistance - rollingDistance,
    );
    const rollingChartData = Array.from({
      length: 31,
    }).map((_, index) => {
      const day = addDays(rollingPeriodStart, index);
      const dayActivities = rollingActivities.filter((activity) =>
        isSameDay(new Date(activity.startedAt), day),
      );

      return {
        day: new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }).format(day),
        km: Number(
          dayActivities
            .reduce((total, activity) => total + (activity.distance || 0), 0)
            .toFixed(2),
        ),
      };
    });

    return {
      completedActivities,
      activeDays,
      bestActivity,
      latestActivity: completedActivities[0] ?? null,
      weekActivities,
      rollingActivities,
      rollingCalories,
      rollingDistance,
      rollingDuration,
      rollingProgress,
      remainingDistance,
      previousWeeklyDistance,
      recentActivities: completedActivities.slice(0, 4),
      rollingChartData,
      weeklyDistance,
      weeklyDuration,
    };
  }, [activities]);

  const hasSyncedStrava =
    Boolean(stravaStatus?.hasSyncedActivities) ||
    dashboardData.completedActivities.some((activity) =>
      Boolean(activity.stravaActivityId),
    );
  const hasAnyActivity = dashboardData.completedActivities.length > 0;
  const showEmptyStravaState =
    !isLoading && !isLoadingStravaStatus && !hasSyncedStrava && !hasAnyActivity;

  const statsData = [
    {
      title: "Activités",
      value: formatNumber(dashboardData.rollingActivities.length),
      description: "30 derniers jours",
      icon: Activity,
    },
    {
      title: "Distance",
      value: formatDistance(dashboardData.rollingDistance, 1),
      description: "30 derniers jours",
      icon: Route,
    },
    {
      title: "Calories",
      value: formatNumber(dashboardData.rollingCalories),
      description: "30 derniers jours",
      icon: Flame,
    },
    {
      title: "Objectif",
      value: `${dashboardData.rollingProgress}%`,
      description: `${formatDistance(dashboardData.rollingDistance, 1)} sur ${formatDistance(rollingTargetDistance, 0)}`,
      icon: Trophy,
    },
  ];

  const weeklyDelta =
    dashboardData.weeklyDistance - dashboardData.previousWeeklyDistance;

  const insightCards = [
    {
      label: "Cap restant",
      value: formatDistance(dashboardData.remainingDistance, 1),
      description: "Pour boucler l’objectif 30 jours",
      icon: Compass,
      tone: "from-violet-500/18 to-fuchsia-500/8",
    },
    {
      label: "Jours actifs",
      value: `${dashboardData.activeDays}/30`,
      description: "Régularité sur la période",
      icon: Gauge,
      tone: "from-emerald-500/16 to-lime-500/8",
    },
    {
      label: "Meilleure sortie",
      value: dashboardData.bestActivity
        ? formatDistance(dashboardData.bestActivity.distance || 0, 1)
        : "Aucune",
      description: dashboardData.bestActivity?.title ?? "En attente de données",
      icon: Trophy,
      tone: "from-amber-500/16 to-orange-500/8",
    },
    {
      label: "Signal semaine",
      value: formatSignedDistance(weeklyDelta),
      description: "Comparé à la semaine précédente",
      icon: Timer,
      tone: "from-sky-500/16 to-cyan-500/8",
    },
  ];

  const watchItems = [
    {
      icon: hasSyncedStrava ? CheckCircle2 : AlertTriangle,
      title: hasSyncedStrava ? "Strava synchronisé" : "Strava à connecter",
      description: hasSyncedStrava
        ? "Les données du dashboard sont alimentées automatiquement."
        : "Le dashboard utilise encore vos activités manuelles.",
      tone: hasSyncedStrava ? "text-emerald-300" : "text-orange-300",
    },
    {
      icon: dashboardData.remainingDistance <= 80 ? CheckCircle2 : Compass,
      title:
        dashboardData.remainingDistance <= 80
          ? "Objectif à portée"
          : "Cap encore ouvert",
      description:
        dashboardData.remainingDistance <= 80
          ? "Vous êtes dans la dernière ligne droite des 30 jours."
          : `${formatDistance(dashboardData.remainingDistance, 1)} restent à parcourir.`,
      tone:
        dashboardData.remainingDistance <= 80
          ? "text-emerald-300"
          : "text-violet-300",
    },
    {
      icon: weeklyDelta >= 0 ? ArrowUpRight : AlertTriangle,
      title: weeklyDelta >= 0 ? "Semaine solide" : "Semaine plus calme",
      description:
        weeklyDelta >= 0
          ? formatSignedDistance(weeklyDelta)
          : "Une sortie courte peut relancer le rythme.",
      tone: weeklyDelta >= 0 ? "text-emerald-300" : "text-orange-300",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
            Chargement de votre dashboard...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
            Impossible de charger les activités pour le moment.
          </div>
        )}

        {showEmptyStravaState ? (
          <EmptyStravaDashboard />
        ) : (
          <>
            {!isLoadingStravaStatus && !hasSyncedStrava && hasAnyActivity && (
              <FadeIn>
                <div className="flex flex-col gap-3 rounded-[24px] border border-orange-500/16 bg-orange-500/[0.07] p-4 text-sm text-orange-100 md:flex-row md:items-center md:justify-between">
                  <span>
                    Votre dashboard utilise vos activités manuelles. Connectez
                    Strava pour importer automatiquement tout votre historique.
                  </span>

                  <Link
                    href="/integrations/strava"
                    className="inline-flex h-10 w-fit items-center gap-2 rounded-2xl bg-[#FC4C02] px-4 font-semibold text-white"
                  >
                    <Link2 className="h-4 w-4" />
                    Connecter Strava
                  </Link>
                </div>
              </FadeIn>
            )}

            <FadeIn delay={0.1}>
              <section
                className="app-dashboard-hero relative overflow-hidden rounded-[30px] border border-white/[0.055] bg-zinc-950 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_26px_90px_rgba(0,0,0,0.24)] md:px-8 md:py-7"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=82')",
                  backgroundPosition: "center 42%",
                  backgroundSize: "cover",
                }}
              >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-[#11121c]/68 to-black/38" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1018]/88 via-transparent to-black/28" />
                  <div className="absolute top-[-20%] left-[-10%] h-[320px] w-[320px] rounded-full bg-violet-500/18 blur-3xl" />
                  <div className="absolute right-[-10%] bottom-[-20%] h-[280px] w-[280px] rounded-full bg-fuchsia-500/18 blur-3xl" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.13),transparent_34%)]" />
                </div>

                <div className="relative grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div>
                    <div className="app-dashboard-glass mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                      <Zap size={14} />
                      Données réelles
                    </div>

                    <h1 className="max-w-2xl text-3xl leading-tight font-bold tracking-tight text-white md:text-[38px]">
                      Continuez votre progression.
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                      30 derniers jours :{" "}
                      {formatDistance(dashboardData.rollingDistance, 1)} en{" "}
                      {formatDuration(dashboardData.rollingDuration)} sur{" "}
                      {dashboardData.rollingActivities.length} activité
                      {dashboardData.rollingActivities.length > 1 ? "s" : ""}.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="/activites/nouvelle"
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 text-sm font-semibold text-white shadow-[0_0_28px_rgba(168,85,247,0.30)] transition hover:scale-[1.02]"
                      >
                        <Plus className="h-4 w-4" />
                        Nouvelle activité
                      </Link>

                      <Link
                        href="/integrations/strava"
                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 text-sm font-semibold text-orange-200 transition hover:border-orange-500/35 hover:bg-orange-500/15"
                      >
                        <Link2 className="h-4 w-4" />
                        {hasSyncedStrava ? "Synchroniser Strava" : "Strava"}
                      </Link>

                      <Link
                        href="/calendrier"
                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-200 transition hover:border-white/15 hover:bg-white/[0.06]"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Calendrier
                      </Link>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <div className="app-dashboard-glass rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Flame size={14} className="text-orange-400" />
                          Calories 30j
                        </div>

                        <p className="mt-1.5 text-xl font-semibold text-white">
                          {formatNumber(dashboardData.rollingCalories)}
                        </p>
                      </div>

                      <div className="app-dashboard-glass rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Trophy size={14} className="text-yellow-400" />
                          Objectif
                        </div>

                        <p className="mt-1.5 text-xl font-semibold text-white">
                          {dashboardData.rollingProgress}%
                        </p>
                      </div>

                      <div className="app-dashboard-glass rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <ArrowUpRight
                            size={14}
                            className="text-emerald-400"
                          />
                          Semaine
                        </div>

                        <p className="mt-1.5 text-xl font-semibold text-emerald-400">
                          {formatDistance(dashboardData.weeklyDistance, 1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="app-dashboard-glass relative h-fit overflow-hidden rounded-3xl border border-white/15 bg-black/30 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-violet-500/10" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/20 backdrop-blur-xl">
                        <Trophy size={18} className="text-violet-300" />
                      </div>

                      <div className="rounded-full border border-emerald-300/25 bg-emerald-500/18 px-2 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-xl">
                        {hasSyncedStrava ? "Strava OK" : "Manuel"}
                      </div>
                    </div>

                    <div className="relative mt-5">
                      <p className="text-xs font-medium tracking-[0.18em] text-zinc-300 uppercase">
                        Focus du mois
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                        Objectif 30 jours
                      </h2>

                      <p className="mt-2 text-sm leading-relaxed text-zinc-200/86 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                        Encore{" "}
                        {formatDistance(dashboardData.remainingDistance, 1)} à
                        parcourir pour atteindre{" "}
                        {formatDistance(rollingTargetDistance, 0)}.
                      </p>
                    </div>

                    <div className="relative mt-5">
                      <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-zinc-200/78">
                        <span>Progression</span>
                        <span>{dashboardData.rollingProgress}%</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/22">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-300 shadow-[0_0_20px_rgba(255,255,255,0.42)]"
                          style={{
                            width: `${dashboardData.rollingProgress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/22 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                        <MapPinned className="h-4 w-4 text-sky-300" />
                        Dernière sortie
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">
                        {dashboardData.latestActivity?.title ??
                          "Aucune sortie récente"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
                        <span>
                          {getSportLabel(dashboardData.latestActivity)}
                        </span>
                        {dashboardData.latestActivity && (
                          <>
                            <span>•</span>
                            <span>
                              {formatDistance(
                                dashboardData.latestActivity.distance || 0,
                                1,
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              {formatShortDate(
                                dashboardData.latestActivity.startedAt,
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {statsData.map((stat, index) => (
                <FadeIn key={stat.title} delay={0.2 * (index + 1)}>
                  <StatsCard
                    title={stat.title}
                    value={stat.value}
                    description={stat.description}
                    icon={stat.icon}
                  />
                </FadeIn>
              ))}
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              <FadeIn delay={0.5}>
                <WeeklyActivityChart
                  data={dashboardData.rollingChartData}
                  totalDistance={dashboardData.rollingDistance}
                />
              </FadeIn>

              <FadeIn delay={0.6}>
                <RecentActivities activities={dashboardData.recentActivities} />
              </FadeIn>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <FadeIn delay={0.7}>
                <MonthlyGoalCard
                  current={dashboardData.rollingDistance}
                  target={rollingTargetDistance}
                />
              </FadeIn>

              <FadeIn delay={0.8}>
                <ActivityHeatmap
                  activities={dashboardData.completedActivities}
                />
              </FadeIn>
            </div>

            <FadeIn delay={0.85}>
              <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#181922]/92 p-5 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_30%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_34%)]" />

                <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          Lecture rapide
                        </h2>
                        <p className="mt-1 text-sm text-zinc-400">
                          Les signaux utiles pour décider quoi faire ensuite.
                        </p>
                      </div>

                      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Dashboard live
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                      {insightCards.map((insight) => {
                        const Icon = insight.icon;

                        return (
                          <div
                            key={insight.label}
                            className={`relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-br ${insight.tone} p-4`}
                          >
                            <div className="absolute inset-0 bg-black/18" />
                            <div className="relative flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-zinc-500">
                                  {insight.label}
                                </p>
                                <p className="mt-2 truncate text-xl font-semibold text-white">
                                  {insight.value}
                                </p>
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">
                                  {insight.description}
                                </p>
                              </div>

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-violet-300">
                                <Icon className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <aside className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4">
                    <h3 className="text-base font-semibold text-white">
                      À surveiller
                    </h3>

                    <div className="mt-4 space-y-3">
                      {watchItems.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.title}
                            className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3"
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] ${item.tone}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-white">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-zinc-400">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </aside>
                </div>
              </section>
            </FadeIn>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
