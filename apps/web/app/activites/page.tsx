"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Activity,
  CalendarDays,
  Flame,
  Plus,
  Route,
  TrendingUp,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ActivityCard } from "@/components/activities/activity-card";
import { FadeIn } from "@/components/ui/fade-in";
import { ActivityFilters } from "@/components/activities/activity-filters";
import { Button } from "@/components/ui/button";

import { useActivities } from "@/hooks/use-activities";

const sportFilters: Record<string, string[]> = {
  Course: ["RUNNING"],
  Cyclisme: ["ROAD_CYCLING", "GRAVEL"],
  VTT: ["MTB"],
  Trail: ["TRAIL"],
  Musculation: ["GYM", "FITNESS"],
  Randonnée: ["HIKING", "WALKING"],
};

const currentYear = new Date().getFullYear();

export default function ActivitiesPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");

  const { data: activities = [], isLoading, error } = useActivities();

  const filteredActivities = useMemo(() => {
    if (activeFilter === "Tous") {
      return activities;
    }

    const matchingSports = sportFilters[activeFilter] || [];

    return activities.filter((activity) =>
      matchingSports.includes(activity.sport),
    );
  }, [activeFilter, activities]);

  const yearlyActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          new Date(activity.startedAt).getFullYear() === currentYear,
      ),
    [activities],
  );

  const yearlyDistance = useMemo(
    () =>
      yearlyActivities.reduce(
        (total, activity) => total + (activity.distance || 0),
        0,
      ),
    [yearlyActivities],
  );

  const yearlyDuration = useMemo(
    () =>
      yearlyActivities.reduce(
        (total, activity) => total + activity.duration,
        0,
      ),
    [yearlyActivities],
  );

  const yearlyCalories = useMemo(
    () =>
      yearlyActivities.reduce(
        (total, activity) => total + (activity.calories || 0),
        0,
      ),
    [yearlyActivities],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-7 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_34%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.10),transparent_36%)]" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <TrendingUp className="h-3.5 w-3.5" />
                Historique sportif
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white">
                Vos sorties, vos traces, votre progression.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Parcourez vos activités importées depuis Strava avec une vue
                plus visuelle des parcours et des métriques clés.
              </p>
            </div>

            <Button
              asChild
              className="h-12 w-fit rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.35)] transition-all duration-300 hover:scale-[1.02] hover:from-violet-400 hover:to-fuchsia-400"
            >
              <Link href="/activites/nouvelle">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle activité
              </Link>
            </Button>
          </div>
        </section>

        {/* LOADING */}
        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
            Chargement des activités...
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-300">
            Impossible de charger les activités.
          </div>
        )}

        {/* CONTENT */}
        {!isLoading && !error && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="app-filter-shell sticky top-0 z-10 rounded-[24px] border border-white/[0.08] bg-[#11131a]/90 p-4 backdrop-blur-xl">
                <ActivityFilters
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>

              <div className="space-y-4">
                {filteredActivities.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
                    <h3 className="text-lg font-semibold text-white">
                      Aucune activité
                    </h3>

                    <p className="mt-2 text-zinc-400">
                      Commencez par créer votre première activité.
                    </p>
                  </div>
                ) : (
                  filteredActivities.map((activity, index) => (
                    <FadeIn key={activity.id} delay={0.04 * (index + 1)}>
                      <ActivityCard
                        id={activity.id}
                        title={activity.title ?? "Sans titre"}
                        type={activity.type}
                        sport={activity.sport}
                        distance={activity.distance}
                        duration={activity.duration}
                        calories={activity.calories}
                        routePolyline={activity.routePolyline}
                        date={activity.startedAt}
                        icon={Activity}
                      />
                    </FadeIn>
                  ))
                )}
              </div>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-0 xl:h-fit">
              <div className="rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-5 backdrop-blur-xl">
                <p className="text-sm text-zinc-400">Vue filtrée</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {filteredActivities.length}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  activité{filteredActivities.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Route className="h-4 w-4 text-sky-300" />
                    Distance annuelle
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {new Intl.NumberFormat("fr-FR", {
                      maximumFractionDigits: 1,
                    }).format(yearlyDistance)}{" "}
                    km
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Parcourus en {currentYear}
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <CalendarDays className="h-4 w-4 text-violet-300" />
                    Temps annuel
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {Math.floor(yearlyDuration / 60)}h {yearlyDuration % 60}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    D'entraînement en {currentYear}
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Flame className="h-4 w-4 text-orange-300" />
                    Calories annuelles
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {new Intl.NumberFormat("fr-FR").format(yearlyCalories)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Estimées sur {currentYear}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
