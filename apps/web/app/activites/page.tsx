"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
const ACTIVITIES_PER_PAGE = 10;

export default function ActivitiesPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: activities = [], isLoading, error } = useActivities();

  const completedActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.status === "COMPLETED" && !activity.completedActivityId,
      ),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    if (activeFilter === "Tous") {
      return completedActivities;
    }

    const matchingSports = sportFilters[activeFilter] || [];

    return completedActivities.filter((activity) =>
      matchingSports.includes(activity.sport),
    );
  }, [activeFilter, completedActivities]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE),
  );
  const visibleActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * ACTIVITIES_PER_PAGE;

    return filteredActivities.slice(
      startIndex,
      startIndex + ACTIVITIES_PER_PAGE,
    );
  }, [currentPage, filteredActivities]);
  const firstVisibleActivity =
    filteredActivities.length === 0
      ? 0
      : (currentPage - 1) * ACTIVITIES_PER_PAGE + 1;
  const lastVisibleActivity = Math.min(
    currentPage * ACTIVITIES_PER_PAGE,
    filteredActivities.length,
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handleFilterChange(filter: string) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  const yearlyActivities = useMemo(
    () =>
      completedActivities.filter(
        (activity) =>
          new Date(activity.startedAt).getFullYear() === currentYear,
      ),
    [completedActivities],
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
      <div className="app-activities-page space-y-6">
        {/* HEADER */}
        <section className="app-activities-hero relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-7 backdrop-blur-xl">
          <div className="app-activities-hero-photo absolute inset-0 bg-cover bg-center" />
          <div className="app-activities-hero-wash absolute inset-0" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="app-activities-hero-kicker inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1.5 text-xs font-medium text-emerald-100">
                <TrendingUp className="h-3.5 w-3.5" />
                Historique sportif
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white">
                Vos sorties, vos traces, votre progression.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Route, sentier, lac ou montagne : chaque sortie garde sa trace
                et raconte un bout de terrain. Ici, votre carnet reste rapide,
                lisible et prêt à donner envie de repartir.
              </p>

              <div className="app-activities-hero-chips mt-6 flex flex-wrap gap-2">
                <span>{filteredActivities.length} sorties affichées</span>
                <span>
                  {new Intl.NumberFormat("fr-FR", {
                    maximumFractionDigits: 1,
                  }).format(yearlyDistance)}{" "}
                  km en {currentYear}
                </span>
                <span>Traces GPS</span>
              </div>
            </div>

            <Button
              asChild
              className="app-activities-hero-cta h-12 w-fit rounded-2xl px-6 text-sm font-semibold transition-all duration-300 hover:scale-[1.02]"
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
                  onFilterChange={handleFilterChange}
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
                  visibleActivities.map((activity, index) => (
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

              {filteredActivities.length > ACTIVITIES_PER_PAGE && (
                <div className="app-pagination-shell flex flex-col gap-3 rounded-[24px] border border-white/[0.08] bg-[#11131a]/90 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-400">
                    {firstVisibleActivity} à {lastVisibleActivity} sur{" "}
                    {filteredActivities.length} sorties
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Page précédente"
                      title="Page précédente"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white">
                      {currentPage} / {totalPages}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Page suivante"
                      title="Page suivante"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4 xl:sticky xl:top-0 xl:h-fit">
              <div className="app-activities-summary-card rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-5 backdrop-blur-xl">
                <p className="text-sm text-zinc-400">Vue filtrée</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {filteredActivities.length}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  activité{filteredActivities.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="app-activities-summary-stat rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-4">
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

                <div className="app-activities-summary-stat rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <CalendarDays className="h-4 w-4 text-violet-300" />
                    Temps annuel
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {Math.floor(yearlyDuration / 60)}H
                    {String(yearlyDuration % 60).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    D'entraînement en {currentYear}
                  </p>
                </div>

                <div className="app-activities-summary-stat rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-4">
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
