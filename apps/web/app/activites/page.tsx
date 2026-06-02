"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Activity, Plus } from "lucide-react";

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Historique sportif
            </h1>

            <p className="mt-2 text-zinc-400">
              Retrouvez l’ensemble de vos entraînements récents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              asChild
              className="h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.35)] transition-all duration-300 hover:scale-[1.02] hover:from-violet-400 hover:to-fuchsia-400"
            >
              <Link href="/activites/nouvelle">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle activité
              </Link>
            </Button>
          </div>
        </div>

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
          <>
            <ActivityFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

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
                  <FadeIn key={activity.id} delay={0.1 * (index + 1)}>
                    <ActivityCard
                      title={activity.title ?? "Sans titre"}
                      type={activity.type}
                      sport={activity.sport}
                      distance={activity.distance}
                      duration={activity.duration}
                      calories={activity.calories}
                      date={activity.startedAt}
                      icon={Activity}
                    />
                  </FadeIn>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
