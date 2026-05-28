"use client";

import Link from "next/link";

import { useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { ActivityCard } from "@/components/activities/activity-card";

import { FadeIn } from "@/components/ui/fade-in";

import { activities } from "@/lib/data/activities-data";

import { ActivityFilters } from "@/components/activities/activity-filters";

import { Button } from "@/components/ui/button";

export default function ActivitiesPage() {
  const [activeFilter, setActiveFilter] =
    useState("Tous");

  const filteredActivities = useMemo(() => {
    if (activeFilter === "Tous") {
      return activities;
    }

    return activities.filter(
      (activity) =>
        activity.type === activeFilter,
    );
  }, [activeFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          {/* LEFT */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Historique sportif
            </h1>

            <p className="mt-2 text-zinc-400">
              Retrouvez l’ensemble de vos
              entraînements récents.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.35)] transition-all duration-300 hover:scale-[1.02] hover:from-violet-400 hover:to-fuchsia-400"
            >
              <Link
                href="/activites/nouvelle"
                className="
                  inline-flex items-center gap-2 rounded-2xl
                  border border-violet-500/20
                  bg-violet-500/10
                  px-5 py-3
                  text-sm font-medium text-violet-300
                  transition-all duration-300
                  hover:border-violet-400/40
                  hover:bg-violet-500/20
                  hover:text-white
                "
              >
                <Plus className="h-4 w-4" />

                Nouvelle activité
              </Link>
            </Button>
          </div>
        </div>

        {/* FILTERS */}
        <ActivityFilters
          activeFilter={activeFilter}
          onFilterChange={
            setActiveFilter
          }
        />

        {/* ACTIVITIES */}
        <div className="space-y-4">
          {filteredActivities.map(
            (activity, index) => (
              <FadeIn
                key={activity.id}
                delay={0.1 * (index + 1)}
              >
                <ActivityCard
                  title={activity.title}
                  type={activity.type}
                  distance={
                    activity.distance
                  }
                  duration={
                    activity.duration
                  }
                  calories={
                    activity.calories
                  }
                  date={activity.date}
                  icon={activity.icon}
                />
              </FadeIn>
            ),
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}