"use client";

import {
  Bike,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  PersonStanding,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";

const days = [
  {
    day: "Lun",
    date: "26",
    intensity: "high",
    workouts: [
      {
        title: "Endurance Run",
        time: "07:00",
        duration: "1h20",
        type: "run",
      },
    ],
  },
  {
    day: "Mar",
    date: "27",
    intensity: "medium",
    workouts: [
      {
        title: "Upper Body",
        time: "18:30",
        duration: "55min",
        type: "gym",
      },
    ],
  },
  {
    day: "Mer",
    date: "28",
    intensity: "high",
    workouts: [
      {
        title: "Intervals Bike",
        time: "06:45",
        duration: "1h45",
        type: "bike",
      },
    ],
  },
  {
    day: "Jeu",
    date: "29",
    intensity: "rest",
    workouts: [],
  },
  {
    day: "Ven",
    date: "30",
    intensity: "medium",
    workouts: [
      {
        title: "Tempo Run",
        time: "19:00",
        duration: "50min",
        type: "run",
      },
    ],
  },
  {
    day: "Sam",
    date: "31",
    intensity: "rest",
    workouts: [],
  },
  {
    day: "Dim",
    date: "01",
    intensity: "rest",
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

const getIntensityStyles = (
  intensity: string,
) => {
  switch (intensity) {
    case "high":
      return `
        border-violet-500/20
        bg-gradient-to-b
        from-violet-500/[0.12]
        to-fuchsia-500/[0.04]
      `;

    case "medium":
      return `
        border-white/[0.08]
        bg-white/[0.035]
      `;

    default:
      return `
        border-white/[0.06]
        bg-white/[0.02]
      `;
  }
};

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HERO */}
        <FadeIn delay={0.1}>
          <section className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#15161d]/95 px-6 py-4 md:px-7 md:py-6">

            {/* BACKGROUND */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

              <div className="absolute left-[-10%] top-[-20%] h-[220px] w-[220px] rounded-full bg-violet-500/10 blur-3xl" />

              <div className="absolute bottom-[-30%] right-[-10%] h-[180px] w-[180px] rounded-full bg-fuchsia-500/10 blur-3xl" />

              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_28%)]" />
            </div>

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

              {/* LEFT */}
              <div className="max-w-2xl">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[11px] font-medium text-violet-300 backdrop-blur-xl">
                  <Sparkles className="h-3.5 w-3.5" />
                  Planning intelligent
                </div>

                <h1 className="max-w-[720px] text-[42px] font-black leading-[0.92] tracking-[-0.065em] text-white md:text-[72px]">
                  Votre semaine
                  <br />

                  <span className="bg-gradient-to-r from-violet-200 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    d’entraînement.
                  </span>
                </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-[15px]">
                Planifiez vos séances, optimisez votre récupération et gardez une vision claire de votre progression sportive.
              </p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-3">

                <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    Séances
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    4
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    Temps
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    5h
                  </p>
                </div>

                <div className="rounded-[20px] border border-violet-500/20 bg-violet-500/10 px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300">
                    Charge
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                    <Zap className="h-4 w-4 text-violet-300" />
                    82
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* TOP BAR */}
        <FadeIn delay={0.2}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            {/* NAV */}
            <div className="flex items-center gap-3">

              <button
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  transition-all
                  duration-300
                  hover:border-violet-500/20
                  hover:bg-violet-500/10
                "
              >
                <ChevronLeft className="h-5 w-5 text-zinc-300" />
              </button>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Semaine actuelle
                </p>

                <p className="mt-1 text-base font-semibold text-white">
                  26 Mai → 1 Juin
                </p>
              </div>

              <button
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  transition-all
                  duration-300
                  hover:border-violet-500/20
                  hover:bg-violet-500/10
                "
              >
                <ChevronRight className="h-5 w-5 text-zinc-300" />
              </button>
            </div>

            {/* ACTION */}
            <Button
              className="
                h-11
                rounded-2xl
                border
                border-violet-500/20
                bg-gradient-to-r
                from-violet-500
                to-fuchsia-500
                px-5
                text-sm
                font-semibold
                text-white
                shadow-[0_0_35px_rgba(168,85,247,0.3)]
                transition-all
                duration-300
                hover:scale-[1.02]
              "
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle séance
            </Button>
          </div>
        </FadeIn>

        {/* CALENDAR */}
        <FadeIn delay={0.3}>
          <div className="grid gap-4 xl:grid-cols-7">

            {days.map((day) => (
              <div
                key={day.day}
                className={`
                  relative
                  min-h-[250px]
                  xl:min-h-[270px]
                  overflow-hidden
                  rounded-[28px]
                  border
                  p-5
                  backdrop-blur-xl
                  transition-all
                  duration-500
                  hover:-translate-y-1
                  hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]

                  ${getIntensityStyles(
                    day.intensity,
                  )}
                `}
              >

                {/* LIGHT */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_30%)]" />

                {/* CONTENT */}
                <div className="relative flex h-full flex-col">

                  {/* HEADER */}
                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-medium text-zinc-400">
                        {day.day}
                      </p>

                      <p className="mt-1 text-4xl font-black tracking-tight text-white">
                        {day.date}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-2.5 text-violet-300 backdrop-blur-xl">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                  </div>

                  {/* WORKOUTS */}
                  <div className="mt-6 flex flex-1 flex-col gap-3">

                    {day.workouts.length === 0 && (
                      <div className="flex flex-1 items-center justify-center">

                        <div className="w-full rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-center">

                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                            <CalendarDays className="h-5 w-5 text-zinc-500" />
                          </div>

                          <p className="text-sm font-medium text-zinc-400">
                            Recovery day
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Aucun entraînement
                          </p>
                        </div>
                      </div>
                    )}

                    {day.workouts.map(
                      (workout) => (
                        <div
                          key={workout.title}
                          className="
                            relative
                            overflow-hidden
                            rounded-[22px]
                            border
                            border-violet-500/20
                            bg-black/20
                            p-4
                            backdrop-blur-xl
                          "
                        >

                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5" />

                          <div className="relative">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                                {getWorkoutIcon(
                                  workout.type,
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {workout.title}
                                </p>

                                <p className="mt-0.5 text-xs text-zinc-400">
                                  {workout.time}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">

                              <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-300">
                                {workout.duration}
                              </div>

                              <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}