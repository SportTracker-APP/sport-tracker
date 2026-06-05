"use client";

import {
  Activity,
  Gauge,
  HeartPulse,
  Medal,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";
import type { Activity as SportActivity } from "@/lib/activities";

function formatDistance(distance: number | null | undefined) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance ?? 0)} km`;
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatPace(minutesPerKilometer: number | null) {
  if (!minutesPerKilometer || !Number.isFinite(minutesPerKilometer)) {
    return "—";
  }

  const minutes = Math.floor(minutesPerKilometer);
  const seconds = Math.round((minutesPerKilometer - minutes) * 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatMonthLabel(dateKey: string) {
  const [year, month] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function getCompletedActivities(activities: SportActivity[]) {
  return activities.filter((activity) => activity.status !== "PLANNED");
}

function getMonthlyDistances(activities: SportActivity[]) {
  const byMonth = new Map<string, number>();

  activities.forEach((activity) => {
    const startedAt = new Date(activity.startedAt);
    const key = `${startedAt.getFullYear()}-${String(
      startedAt.getMonth() + 1,
    ).padStart(2, "0")}`;

    byMonth.set(key, (byMonth.get(key) ?? 0) + (activity.distance ?? 0));
  });

  return [...byMonth.entries()]
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .slice(-7)
    .map(([month, distance]) => ({
      month,
      label: formatMonthLabel(month),
      distance,
    }));
}

export default function PerformancesPage() {
  const { data: activities = [], isLoading, error } = useActivities();
  const completedActivities = getCompletedActivities(activities);
  const monthlyDistances = getMonthlyDistances(completedActivities);
  const maxMonthlyDistance = Math.max(
    ...monthlyDistances.map((month) => month.distance),
    0,
  );
  const longestActivity = completedActivities.reduce<SportActivity | null>(
    (best, activity) =>
      !best || (activity.distance ?? 0) > (best.distance ?? 0) ? activity : best,
    null,
  );
  const maxElevationActivity = completedActivities.reduce<SportActivity | null>(
    (best, activity) =>
      !best || (activity.elevationGain ?? 0) > (best.elevationGain ?? 0)
        ? activity
        : best,
    null,
  );
  const bestMonth = monthlyDistances.reduce<
    { month: string; label: string; distance: number } | null
  >(
    (best, month) => (!best || month.distance > best.distance ? month : best),
    null,
  );
  const paceActivities = completedActivities.filter(
    (activity) =>
      ["RUNNING", "TRAIL"].includes(activity.sport) &&
      activity.distance &&
      activity.distance > 0 &&
      activity.duration > 0,
  );
  const averagePace =
    paceActivities.length > 0
      ? paceActivities.reduce(
          (total, activity) =>
            total + activity.duration / (activity.distance || 1),
          0,
        ) / paceActivities.length
      : null;
  const maxHeartRate = completedActivities.reduce(
    (max, activity) => Math.max(max, activity.maxHeartRate ?? 0),
    0,
  );
  const totalDistance = completedActivities.reduce(
    (total, activity) => total + (activity.distance ?? 0),
    0,
  );
  const totalElevation = completedActivities.reduce(
    (total, activity) => total + (activity.elevationGain ?? 0),
    0,
  );

  const highlights = [
    {
      label: "Meilleure distance",
      value: longestActivity ? formatDistance(longestActivity.distance) : "—",
      detail: longestActivity?.title ?? "Aucune activité importée",
      icon: Trophy,
    },
    {
      label: "Allure moyenne",
      value: formatPace(averagePace),
      detail:
        paceActivities.length > 0
          ? "min/km sur course et trail"
          : "Course ou trail requis",
      icon: Gauge,
    },
    {
      label: "Fréquence max",
      value: maxHeartRate > 0 ? formatNumber(maxHeartRate) : "—",
      detail: maxHeartRate > 0 ? "bpm importés" : "Donnée non disponible",
      icon: HeartPulse,
    },
  ];
  const records = [
    `Plus longue sortie : ${
      longestActivity ? formatDistance(longestActivity.distance) : "—"
    }`,
    `Meilleur mois : ${bestMonth ? formatDistance(bestMonth.distance) : "—"}`,
    `Plus gros dénivelé : ${
      maxElevationActivity
        ? `${formatNumber(maxElevationActivity.elevationGain)} m`
        : "—"
    }`,
    `Distance totale importée : ${formatDistance(totalDistance)}`,
    `Dénivelé total : ${formatNumber(totalElevation)} m`,
  ];

  return (
    <DashboardLayout>
      <div className="app-performance-page space-y-6">
        <section className="app-premium-surface relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-7 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_34%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300">
              <Medal className="h-3.5 w-3.5" />
              Performances
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
              Vos meilleurs repères sportifs.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              Records, tendances et indicateurs calculés avec vos vraies
              activités importées.
            </p>
          </div>
        </section>

        {isLoading && (
          <div className="app-premium-surface rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 text-sm text-zinc-400">
            Chargement des performances...
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
            Impossible de charger vos performances.
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="app-premium-surface rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-5 text-sm text-zinc-400">{item.label}</p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {item.value}
                </p>

                <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="app-premium-surface rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Tendance mensuelle
              </h2>
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-6 flex h-48 items-end gap-3">
              {monthlyDistances.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.03] text-sm text-zinc-500">
                  Synchronisez Strava pour afficher vos tendances.
                </div>
              ) : (
                monthlyDistances.map((month) => {
                  const height =
                    maxMonthlyDistance > 0
                      ? Math.max(
                          12,
                          Math.round((month.distance / maxMonthlyDistance) * 100),
                        )
                      : 0;

                  return (
                    <div
                      key={month.month}
                      className="flex flex-1 flex-col items-center justify-end gap-3"
                    >
                      <div className="flex w-full flex-1 items-end rounded-t-2xl bg-white/[0.04]">
                        <div
                          className="w-full rounded-t-2xl bg-gradient-to-t from-sky-500 to-violet-400"
                          style={{
                            height: `${height}%`,
                          }}
                          title={`${month.label} · ${formatDistance(
                            month.distance,
                          )}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-zinc-500">
                        {month.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="app-premium-surface rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-violet-300" />
              <h2 className="text-xl font-semibold text-white">Records</h2>
            </div>

            <div className="mt-5 space-y-3">
              {records.map((record) => (
                <div
                  key={record}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
                >
                  {record}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
