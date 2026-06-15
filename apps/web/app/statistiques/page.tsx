"use client";

import {
  BarChart3,
  CalendarDays,
  Clock3,
  Flame,
  Mountain,
  Navigation,
  Route,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { useActivities } from "@/hooks/use-activities";
import type { Activity as SportActivity } from "@/lib/activities";

type Totals = {
  count: number;
  distance: number;
  duration: number;
  elevation: number;
  calories: number;
};

type ChartPoint = {
  day: string;
  km: number;
};

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDistance(distance: number | null | undefined) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance ?? 0);
}

function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDuration(minutes: number | null | undefined) {
  const safeMinutes = Math.max(0, Math.round(minutes ?? 0));

  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return remainingMinutes > 0
    ? `${hours}H${String(remainingMinutes).padStart(2, "0")}`
    : `${hours}H`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getWeekStart(date: Date) {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);

  return nextDate;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCompletedActivities(activities: SportActivity[]) {
  return activities.filter((activity) => activity.status !== "PLANNED");
}

function getActivitiesBetween(
  activities: SportActivity[],
  startDate: Date,
  endDate: Date,
) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return activities.filter((activity) => {
    const startedAt = new Date(activity.startedAt).getTime();

    return startedAt >= startTime && startedAt < endTime;
  });
}

function sumActivities(activities: SportActivity[]): Totals {
  return activities.reduce<Totals>(
    (totals, activity) => ({
      count: totals.count + 1,
      distance: totals.distance + (activity.distance ?? 0),
      duration: totals.duration + (activity.duration ?? 0),
      elevation: totals.elevation + (activity.elevationGain ?? 0),
      calories: totals.calories + (activity.calories ?? 0),
    }),
    {
      count: 0,
      distance: 0,
      duration: 0,
      elevation: 0,
      calories: 0,
    },
  );
}

function getTrend(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0
      ? {
          label: "+100%",
          isPositive: true,
        }
      : {
          label: "0%",
          isPositive: true,
        };
  }

  const percent = Math.round(((current - previous) / previous) * 100);

  return {
    label: `${percent > 0 ? "+" : ""}${percent}%`,
    isPositive: percent >= 0,
  };
}

function getLastDaysChart(
  activities: SportActivity[],
  startDate: Date,
  days: number,
) {
  const byDay = new Map<string, number>();

  activities.forEach((activity) => {
    const key = getDateKey(new Date(activity.startedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + (activity.distance ?? 0));
  });

  return Array.from({ length: days }, (_, index): ChartPoint => {
    const date = addDays(startDate, index);

    return {
      day: formatDate(date),
      km: byDay.get(getDateKey(date)) ?? 0,
    };
  });
}

function getSportLabel(sport: string) {
  const labels: Record<string, string> = {
    FITNESS: "Musculation",
    GRAVEL: "Gravel",
    HIKING: "Rando",
    MTB: "VTT",
    ROAD_CYCLING: "Cyclisme",
    RUNNING: "Course",
    TRAIL: "Trail",
    WALKING: "Marche",
  };

  return labels[sport] ?? sport;
}

function getSportDistribution(activities: SportActivity[]) {
  const bySport = new Map<string, Totals>();

  activities.forEach((activity) => {
    const key = activity.sport || activity.type || "Autre";
    const current =
      bySport.get(key) ??
      ({
        count: 0,
        distance: 0,
        duration: 0,
        elevation: 0,
        calories: 0,
      } satisfies Totals);

    bySport.set(key, {
      count: current.count + 1,
      distance: current.distance + (activity.distance ?? 0),
      duration: current.duration + (activity.duration ?? 0),
      elevation: current.elevation + (activity.elevationGain ?? 0),
      calories: current.calories + (activity.calories ?? 0),
    });
  });

  return [...bySport.entries()]
    .map(([sport, totals]) => ({
      sport,
      label: getSportLabel(sport),
      ...totals,
    }))
    .sort((first, second) => second.distance - first.distance);
}

function getBestDay(chartData: ChartPoint[]) {
  return chartData.reduce<ChartPoint | null>(
    (best, point) => (!best || point.km > best.km ? point : best),
    null,
  );
}

function getCoachMessage(totals: Totals, activeDays: number) {
  if (totals.count === 0) {
    return "Les sentiers attendent leur première trace. Les chaussures aussi.";
  }

  if (totals.elevation >= 5_000) {
    return "Les mollets ont vu du pays. Le D+ commence à raconter une vraie histoire.";
  }

  if (totals.distance >= 100) {
    return "Le GPS a demandé une pause, mais le carnet d’exploration adore ça.";
  }

  if (activeDays >= 10) {
    return "Belle régularité : route, lac ou montagne, le rythme est bien installé.";
  }

  if (totals.count <= 2) {
    return "Petit volume, mais vraie trace. La prochaine sortie remettra du relief.";
  }

  return "La progression est propre : assez de données pour voir où accélérer sans perdre le plaisir.";
}

export default function StatisticsPage() {
  const { data: activities = [], error, isLoading } = useActivities();
  const completedActivities = getCompletedActivities(activities);
  const sortedActivities = [...completedActivities].sort(
    (first, second) =>
      new Date(second.startedAt).getTime() -
      new Date(first.startedAt).getTime(),
  );
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekStart = getWeekStart(today);
  const monthStart = getMonthStart(today);
  const last30Start = addDays(today, -29);
  const previous30Start = addDays(last30Start, -30);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const last30Activities = getActivitiesBetween(
    completedActivities,
    last30Start,
    tomorrow,
  );
  const weekActivities = getActivitiesBetween(
    completedActivities,
    weekStart,
    tomorrow,
  );
  const monthActivities = getActivitiesBetween(
    completedActivities,
    monthStart,
    tomorrow,
  );
  const previous30Activities = getActivitiesBetween(
    completedActivities,
    previous30Start,
    last30Start,
  );
  const yearActivities = getActivitiesBetween(
    completedActivities,
    yearStart,
    tomorrow,
  );
  const totals30 = sumActivities(last30Activities);
  const weekTotals = sumActivities(weekActivities);
  const monthTotals = sumActivities(monthActivities);
  const previousTotals = sumActivities(previous30Activities);
  const yearTotals = sumActivities(yearActivities);
  const chartData = getLastDaysChart(last30Activities, last30Start, 30);
  const activeDays = new Set(
    last30Activities.map((activity) =>
      getDateKey(new Date(activity.startedAt)),
    ),
  ).size;
  const bestDay = getBestDay(chartData);
  const sportDistribution = getSportDistribution(last30Activities);
  const topSport = sportDistribution[0] ?? null;
  const historicalBestElevationActivity =
    completedActivities.reduce<SportActivity | null>(
      (best, activity) =>
        !best || (activity.elevationGain ?? 0) > (best.elevationGain ?? 0)
          ? activity
          : best,
      null,
    );
  const highestAltitudeActivity =
    completedActivities.reduce<SportActivity | null>(
      (highest, activity) =>
        activity.maxAltitude !== null &&
        activity.maxAltitude !== undefined &&
        (!highest || activity.maxAltitude > (highest.maxAltitude ?? 0))
          ? activity
          : highest,
      null,
    );
  const distanceTrend = getTrend(totals30.distance, previousTotals.distance);
  const TrendIcon = distanceTrend.isPositive ? TrendingUp : TrendingDown;
  const latestActivity = sortedActivities[0] ?? null;
  const statTiles = [
    {
      detail: "Volume réel sur 30 jours",
      icon: Route,
      label: "Distance",
      value: `${formatDistance(totals30.distance)} km`,
    },
    {
      detail: `${activeDays} jour${activeDays > 1 ? "s" : ""} actif${
        activeDays > 1 ? "s" : ""
      }`,
      icon: Clock3,
      label: "Temps",
      value: formatDuration(totals30.duration),
    },
    {
      detail: "D+ sur 30 jours",
      icon: Mountain,
      label: "D+",
      value: `${formatInteger(totals30.elevation)} m`,
    },
    {
      detail: "Estimation importée",
      icon: Flame,
      label: "Calories",
      value: formatInteger(totals30.calories),
    },
  ];
  const refugeInsights = [
    {
      label: "Rythme",
      value:
        activeDays >= 15
          ? "Très régulier"
          : activeDays >= 8
            ? "Installé"
            : "À relancer",
    },
    {
      label: "Semaine",
      value: `${weekTotals.count} sortie${weekTotals.count > 1 ? "s" : ""}`,
    },
    {
      label: "Signal",
      value: distanceTrend.isPositive ? "Progression" : "À surveiller",
    },
  ];
  const topSportPercent =
    topSport && totals30.distance > 0
      ? Math.round((topSport.distance / totals30.distance) * 100)
      : 0;
  const secondarySport = sportDistribution[1] ?? null;
  const outdoorProfileLabel =
    topSportPercent >= 70
      ? "Terrain favori très marqué"
      : sportDistribution.length >= 4
        ? "Profil bien varié"
        : topSport
          ? "Base outdoor en construction"
          : "Profil à dessiner";
  const outdoorProfileDetail =
    topSport && secondarySport
      ? `${topSport.label} devant ${secondarySport.label}, avec ${sportDistribution.length} sports actifs.`
      : topSport
        ? `${topSport.label} porte l'essentiel du volume récent.`
        : "Ajoutez quelques sorties pour faire apparaître votre mix.";

  return (
    <DashboardLayout>
      <div className="app-statistics-page relative isolate space-y-6 pb-8">
        {isLoading && (
          <div className="app-premium-surface rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 text-sm text-zinc-400">
            Chargement des statistiques réelles...
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
            Impossible de charger vos statistiques.
          </div>
        )}

        {!isLoading && !error && completedActivities.length === 0 && (
          <div className="app-premium-surface rounded-[28px] border border-white/[0.08] bg-[#181922]/90 p-7 text-sm text-zinc-400">
            Aucune sortie terminée pour le moment. Synchronisez Strava ou
            ajoutez une activité passée pour lancer vos statistiques.
          </div>
        )}

        {!isLoading && !error && completedActivities.length > 0 && (
          <>
            <section className="app-statistics-forest-panel relative overflow-hidden rounded-[32px] border border-emerald-300/15 bg-[#071610] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_86%_30%,rgba(132,204,22,0.18),transparent_34%),linear-gradient(135deg,rgba(7,22,16,0.98),rgba(12,38,28,0.9)_54%,rgba(7,22,16,0.96))]" />
              <div
                className="absolute inset-0 opacity-[0.3]"
                style={{
                  backgroundImage:
                    "url('https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                  backgroundPosition: "center 46%",
                  backgroundSize: "cover",
                }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-60" />

              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-center">
                <div className="app-statistics-forest-copy">
                  <div className="app-statistics-forest-chip inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1.5 text-xs font-medium text-emerald-100">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Statistiques réelles
                  </div>
                  <h2 className="mt-5 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-white xl:text-[44px]">
                    Vos sorties racontent votre progression.
                  </h2>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-50/68">
                    Distance, D+, régularité et terrain préféré sont calculés
                    depuis vos vraies activités. Le but : savoir où vous
                    progressez, et où le prochain sentier vous attend.
                  </p>
                </div>

                <aside className="app-statistics-forest-summary rounded-[28px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl lg:justify-self-end">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-emerald-100/62">
                        30 derniers jours
                      </p>
                      <p className="app-statistics-forest-distance mt-2 text-3xl font-bold text-white">
                        {formatDistance(totals30.distance)} km
                      </p>
                      <p className="mt-2 text-sm text-emerald-50/62">
                        {formatDuration(totals30.duration)} sur {totals30.count}{" "}
                        sortie{totals30.count > 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-300/16 text-emerald-100">
                      <TrendIcon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="app-statistics-forest-note mt-5 max-w-[400px] rounded-[20px] border border-emerald-200/15 bg-emerald-950/75 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                      <TrendIcon className="h-4 w-4" />
                      {distanceTrend.label} vs période précédente
                    </div>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/62">
                      {getCoachMessage(totals30, activeDays)}
                    </p>
                  </div>
                </aside>
              </div>
            </section>

            <section className="app-statistics-insights-grid grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="app-statistics-insight-card app-statistics-terrain-card app-premium-surface rounded-[28px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-emerald-300">
                      Lecture du terrain
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      Ce que vos sorties disent de vous.
                    </h2>
                  </div>

                  <div className="app-statistics-year-pill hidden rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-right sm:block">
                    <p className="text-xs text-zinc-500">
                      Année {today.getFullYear()}
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {formatDistance(yearTotals.distance)} km
                    </p>
                  </div>
                </div>

                <div className="app-statistics-stat-lines mt-6 divide-y divide-white/[0.08] rounded-[24px] border border-white/[0.08] bg-white/[0.035] px-4 py-2">
                  {statTiles.map((tile) => {
                    const Icon = tile.icon;

                    return (
                      <div
                        key={tile.label}
                        className="app-statistics-stat-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="app-statistics-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-white/[0.08] bg-white/[0.05] text-emerald-300">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="app-statistics-stat-label text-sm font-semibold text-white">
                              {tile.label}
                            </p>
                            <p className="app-statistics-stat-detail mt-0.5 text-sm text-zinc-500">
                              {tile.detail}
                            </p>
                          </div>
                        </div>

                        <div className="app-statistics-stat-value text-2xl font-bold tracking-tight text-emerald-300 sm:text-right">
                          {tile.value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="app-statistics-mini-fact rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4">
                    <p className="text-xs text-zinc-500">Meilleure journée</p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {bestDay && bestDay.km > 0
                        ? `${formatDistance(bestDay.km)} km`
                        : "—"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {bestDay && bestDay.km > 0 ? bestDay.day : "À déclencher"}
                    </p>
                  </div>

                  <div className="app-statistics-mini-fact rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4">
                    <p className="text-xs text-zinc-500">Plus gros D+ sortie</p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {historicalBestElevationActivity
                        ? `${formatInteger(
                            historicalBestElevationActivity.elevationGain,
                          )} m`
                        : "—"}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                      {historicalBestElevationActivity
                        ? (historicalBestElevationActivity.title ??
                          "Sortie sans titre")
                        : "D+ à aller chercher"}
                    </p>
                  </div>

                  <div className="app-statistics-mini-fact rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4">
                    <p className="text-xs text-zinc-500">
                      Point le plus haut atteint
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {highestAltitudeActivity
                        ? `${formatInteger(highestAltitudeActivity.maxAltitude)} m`
                        : "—"}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                      {highestAltitudeActivity
                        ? `${highestAltitudeActivity.title ?? "Sortie sans titre"} · ${formatDate(
                            new Date(highestAltitudeActivity.startedAt),
                          )}`
                        : historicalBestElevationActivity
                          ? `Altitude max absente · record D+ ${formatInteger(
                              historicalBestElevationActivity.elevationGain,
                            )} m`
                          : "Altitude max à synchroniser"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-statistics-insight-card app-statistics-mix-card app-premium-surface flex flex-col rounded-[28px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-300">
                      Répartition
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      Votre mix outdoor.
                    </h2>
                  </div>
                  <Navigation className="h-6 w-6 text-emerald-300" />
                </div>

                <div className="mt-6 space-y-4">
                  {sportDistribution.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-white/[0.08] p-5 text-sm text-zinc-500">
                      Aucune distance à répartir.
                    </div>
                  ) : (
                    sportDistribution.slice(0, 5).map((item) => {
                      const percent =
                        totals30.distance > 0
                          ? Math.round(
                              (item.distance / totals30.distance) * 100,
                            )
                          : 0;

                      return (
                        <div key={item.sport}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-white">
                              {item.label}
                            </span>
                            <span className="text-sm font-semibold text-zinc-400">
                              {formatDistance(item.distance)} km · {percent}%
                            </span>
                          </div>
                          <div className="app-statistics-progress-track h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="app-statistics-progress-fill h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300"
                              style={{ width: `${Math.max(4, percent)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-8 border-t border-white/[0.08] pt-5 lg:mt-auto">
                  <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
                    <p className="text-xs font-medium text-emerald-300">
                      Profil outdoor
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                      {outdoorProfileLabel}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {outdoorProfileDetail}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-[16px] border border-white/[0.08] bg-black/15 p-3">
                        <p className="text-[11px] text-zinc-500">Dominant</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {topSportPercent}%
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-white/[0.08] bg-black/15 p-3">
                        <p className="text-[11px] text-zinc-500">Variété</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {sportDistribution.length}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-white/[0.08] bg-black/15 p-3">
                        <p className="text-[11px] text-zinc-500">Sorties</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {totals30.count}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <WeeklyActivityChart
                data={chartData}
                totalDistance={totals30.distance}
              />
              <ActivityHeatmap activities={completedActivities} />
            </section>

            <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="app-statistics-refuge-card app-statistics-insight-card relative overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#10140f] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-45"
                  style={{
                    backgroundImage:
                      "url('https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1400')",
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(3,7,18,0.92),rgba(6,78,59,0.72)_52%,rgba(3,7,18,0.45))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(132,204,22,0.24),transparent_30%)]" />

                <div className="relative flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-emerald-200/20 bg-emerald-300/15 text-emerald-100 backdrop-blur-md">
                      <Mountain className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Message du refuge
                      </h2>
                      <p className="mt-1 text-sm text-emerald-50/70">
                        Lecture rapide de vos 30 derniers jours.
                      </p>
                    </div>
                  </div>

                  <div className="max-w-3xl">
                    <p className="text-2xl leading-snug font-bold text-white md:text-3xl">
                      {getCoachMessage(totals30, activeDays)}
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/72">
                      Le résumé mélange volume, régularité et dénivelé pour
                      donner une humeur à votre bloc récent.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {refugeInsights.map((insight) => (
                      <div
                        key={insight.label}
                        className="rounded-[18px] border border-white/10 bg-black/22 px-4 py-3 backdrop-blur-md"
                      >
                        <p className="text-xs text-emerald-50/62">
                          {insight.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {insight.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="app-statistics-insight-card app-premium-surface rounded-[28px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-sky-400/14 text-sky-300">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Dernière trace
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Dernière activité importée.
                    </p>
                  </div>
                </div>

                {latestActivity ? (
                  <div className="mt-6 rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4">
                    <p className="line-clamp-2 text-lg font-semibold text-white">
                      {latestActivity.title ?? "Sortie sans titre"}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {getSportLabel(latestActivity.sport)} ·{" "}
                      {formatDistance(latestActivity.distance)} km ·{" "}
                      {formatDate(new Date(latestActivity.startedAt))}
                    </p>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-zinc-500">
                    Aucune activité importée pour le moment.
                  </p>
                )}
              </aside>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
