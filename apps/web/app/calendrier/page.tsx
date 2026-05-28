"use client";

import {
  CalendarDays,
  Dumbbell,
  Bike,
  PersonStanding,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { FadeIn } from "@/components/ui/fade-in";

const days = [
  {
    day: "Lun",
    date: "26",
    workouts: [
      {
        title: "Endurance Run",
        type: "run",
      },
    ],
  },
  {
    day: "Mar",
    date: "27",
    workouts: [
      {
        title: "Upper Body",
        type: "gym",
      },
    ],
  },
  {
    day: "Mer",
    date: "28",
    workouts: [
      {
        title: "Intervals Bike",
        type: "bike",
      },
    ],
  },
  {
    day: "Jeu",
    date: "29",
    workouts: [],
  },
  {
    day: "Ven",
    date: "30",
    workouts: [
      {
        title: "Tempo Run",
        type: "run",
      },
    ],
  },
  {
    day: "Sam",
    date: "31",
    workouts: [],
  },
  {
    day: "Dim",
    date: "01",
    workouts: [],
  },
];

const getWorkoutIcon = (
  type: string,
) => {
  switch (type) {
    case "run":
      return (
        <PersonStanding className="h-4 w-4" />
      );

    case "bike":
      return (
        <Bike className="h-4 w-4" />
      );

    default:
      return (
        <Dumbbell className="h-4 w-4" />
      );
  }
};

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HERO */}
        <FadeIn delay={0.1}>
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.025] p-6 md:p-8">

            {/* BACKGROUND */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

              <div className="absolute left-[-10%] top-[-20%] h-[260px] w-[260px] rounded-full bg-violet-500/10 blur-3xl" />

              <div className="absolute bottom-[-20%] right-[-10%] h-[220px] w-[220px] rounded-full bg-fuchsia-500/10 blur-3xl" />

            </div>

            <div className="relative">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <CalendarDays size={14} />
                Planning sportif
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-[38px]">
                Organisez vos entraînements.
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-zinc-400 md:text-base">
                Visualisez votre semaine et préparez vos futures séances.
              </p>
            </div>
          </section>
        </FadeIn>

        {/* WEEK GRID */}
        <FadeIn delay={0.2}>
          <div className="grid gap-4 xl:grid-cols-7">

            {days.map((day) => (
              <div
                key={day.day}
                className="
                  min-h-[260px]
                  rounded-[28px]
                  border
                  border-white/10
                  bg-white/[0.025]
                  p-4
                  transition-all
                  duration-300
                  hover:border-violet-500/20
                  hover:bg-white/[0.03]
                "
              >

                {/* HEADER */}
                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-sm font-medium text-zinc-400">
                      {day.day}
                    </p>

                    <p className="mt-1 text-2xl font-bold text-white">
                      {day.date}
                    </p>
                  </div>

                  <div className="rounded-xl bg-violet-500/10 p-2 text-violet-300">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                </div>

                {/* WORKOUTS */}
                <div className="mt-6 space-y-3">

                  {day.workouts.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">
                      Journée libre
                    </div>
                  )}

                  {day.workouts.map(
                    (workout) => (
                      <div
                        key={workout.title}
                        className="
                          rounded-2xl
                          border
                          border-violet-500/10
                          bg-violet-500/10
                          p-3
                        "
                      >

                        <div className="flex items-center gap-2">

                          <div className="text-violet-300">
                            {getWorkoutIcon(
                              workout.type,
                            )}
                          </div>

                          <span className="text-sm font-medium text-white">
                            {workout.title}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}