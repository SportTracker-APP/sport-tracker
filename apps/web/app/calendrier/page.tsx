  "use client";

  import {
    Bike,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Flame,
    PersonStanding,
    Plus,
    Sparkles,
    Target,
    TrendingUp,
    Zap,
  } from "lucide-react";

  import { DashboardLayout } from "@/components/layout/dashboard-layout";
  import { FadeIn } from "@/components/ui/fade-in";
  import { Button } from "@/components/ui/button";
  import Link from "next/link";

  const days = [
    {
      day: "Lun",
      date: "26",
      intensity: "high",
      completed: true,
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
      completed: true,
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
      current: true,
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
      upcoming: true,
      workouts: [],
    },
    {
      day: "Ven",
      date: "30",
      intensity: "medium",
      upcoming: true,
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
      upcoming: true,
      workouts: [],
    },
    {
      day: "Dim",
      date: "01",
      intensity: "rest",
      upcoming: true,
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
          from-violet-500/[0.16]
          via-violet-500/[0.08]
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

  const getWorkoutStatus = (
    day: {
      completed?: boolean;
      current?: boolean;
    },
  ) => {
    if (day.completed) {
      return {
        label: "Effectué",
        container:
          "border-emerald-500/20 bg-emerald-500/10",
        dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]",
        text: "text-emerald-300",
      };
    }

    if (day.current) {
      return {
        label: "Aujourd’hui",
        container:
          "border-violet-500/20 bg-violet-500/10",
        dot: "bg-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.9)]",
        text: "text-violet-200",
      };
    }

    return {
      label: "À venir",
      container:
        "border-white/[0.08] bg-white/[0.04]",
      dot: "bg-zinc-500",
      text: "text-zinc-400",
    };
  };

  export default function CalendarPage() {
    return (
      <DashboardLayout>
        <div className="space-y-8">

          {/* HERO */}
          <FadeIn delay={0.1}>
            <section className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#111218]/95 px-6 py-7 md:px-8 md:py-8">

              {/* GRID */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
                <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:80px_80px]" />
              </div>

              {/* LIGHTS */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-[-8%] top-[-30%] h-[320px] w-[320px] rounded-full bg-violet-500/12 blur-3xl" />

                <div className="absolute bottom-[-40%] right-[-10%] h-[280px] w-[280px] rounded-full bg-fuchsia-500/10 blur-3xl" />

                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_30%)]" />
              </div>

              <div className="relative flex flex-col gap-10 xl:flex-row xl:items-end xl:justify-between">

                {/* LEFT */}
                <div className="max-w-3xl">

                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1.5 text-[11px] font-medium text-violet-300 backdrop-blur-xl">
                    <Sparkles className="h-3.5 w-3.5" />
                    Planning intelligent
                  </div>

                  <h1 className="max-w-[780px] text-[38px] font-black leading-[0.92] tracking-[-0.065em] text-white sm:text-[50px] md:text-[64px] xl:text-[74px]">
                    Organisez votre
                    <br />

                    <span className="bg-gradient-to-r from-violet-200 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                      semaine sportive.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-[15px]">
                    Visualisez vos entraînements,
                    équilibrez votre charge et
                    gardez une progression constante
                    tout au long de la semaine.
                  </p>

                  {/* INSIGHTS */}
                  <div className="mt-7 flex flex-wrap gap-3">

                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.08] px-4 py-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white">
                          +12% progression
                        </p>

                        <p className="text-[11px] text-zinc-400">
                          vs semaine dernière
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-orange-500/10 bg-orange-500/[0.07] px-4 py-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                        <Flame className="h-4 w-4 text-orange-400" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white">
                          4 jours actifs
                        </p>

                        <p className="text-[11px] text-zinc-400">
                          série en cours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-violet-500/10 bg-violet-500/[0.07] px-4 py-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                        <Target className="h-4 w-4 text-violet-300" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white">
                          Objectif 82%
                        </p>

                        <p className="text-[11px] text-zinc-400">
                          charge optimisée
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATS */}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 xl:max-w-[520px]">

                  <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.04] px-5 py-5 backdrop-blur-xl">

                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_50%)]" />

                    <div className="relative">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        Séances
                      </p>

                      <p className="mt-3 text-4xl font-black tracking-tight text-white">
                        4
                      </p>

                      <p className="mt-2 text-xs text-emerald-400">
                        +1 cette semaine
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.04] px-5 py-5 backdrop-blur-xl">

                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_50%)]" />

                    <div className="relative">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        Temps
                      </p>

                      <p className="mt-3 text-4xl font-black tracking-tight text-white">
                        5h
                      </p>

                      <p className="mt-2 text-xs text-zinc-500">
                        302 minutes
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-violet-500/10 px-5 py-5 backdrop-blur-xl">

                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10" />

                    <div className="relative">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300">
                        Charge
                      </p>

                      <p className="mt-3 flex items-center gap-2 text-4xl font-black tracking-tight text-white">
                        <Zap className="h-5 w-5 text-violet-300" />
                        82
                      </p>

                      <p className="mt-2 text-xs text-violet-200">
                        équilibre optimal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </FadeIn>

          {/* TOP BAR */}
          <FadeIn delay={0.2}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">

                <button
                  className="
                    flex
                    h-12
                    w-12
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

                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] px-5 py-3 backdrop-blur-xl">

                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    Semaine actuelle
                  </p>

                  <p className="mt-1 text-lg font-semibold text-white">
                    26 Mai → 1 Juin
                  </p>
                </div>

                <button
                  className="
                    flex
                    h-12
                    w-12
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

              <Button
                asChild
                className="
                  h-12
                  rounded-2xl
                  border
                  border-violet-500/20
                  bg-gradient-to-r
                  from-violet-500
                  to-fuchsia-500
                  px-6
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_0_40px_rgba(168,85,247,0.35)]
                "
              >
                <Link href="/activites/nouvelle">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle séance
                </Link>
              </Button>
            </div>
          </FadeIn>

          {/* CALENDAR */}
          <FadeIn delay={0.3}>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-7">

              {days.map((day) => {
                const status =
                  getWorkoutStatus(day);

                return (
                  <div
                    key={day.day}
                    className={`
                      relative
                      min-h-[320px]
                      overflow-hidden
                      rounded-[32px]
                      border
                      p-5
                      backdrop-blur-xl
                      transition-all
                      duration-300
                      hover:-translate-y-1.5
                      hover:border-violet-500/20

                      ${getIntensityStyles(
                        day.intensity,
                      )}

                      ${
                        day.current
                          ? "ring-1 ring-violet-500/30"
                          : ""
                      }
                    `}
                  >

                    {day.current && (
                      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                    )}

                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_30%)]" />

                    <div className="relative flex h-full flex-col">

                      {/* HEADER */}
                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <div className="flex items-center gap-2">

                            <p className="text-sm font-medium text-zinc-400">
                              {day.day}
                            </p>

                            {day.completed && (
                              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                            )}

                            {day.current && (
                              <div
                                className="
                                  rounded-full
                                  border
                                  border-violet-500/20
                                  bg-violet-500/10
                                  px-2.5
                                  py-1
                                  text-[10px]
                                  font-semibold
                                  uppercase
                                  tracking-[0.12em]
                                  text-violet-300
                                "
                              >
                                Today
                              </div>
                            )}
                          </div>

                          <p className="mt-3 text-[56px] font-black leading-none tracking-tight text-white">
                            {day.date}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-2.5 text-violet-300 backdrop-blur-xl">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                      </div>

                      {/* WORKOUT */}
                      <div className="mt-8 flex flex-1 flex-col">

                        {day.workouts.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.08] bg-black/10 p-6 text-center">

                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                              <CalendarDays className="h-5 w-5 text-zinc-500" />
                            </div>

                            <p className="text-lg font-semibold text-zinc-300">
                              Recovery day
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                              Aucun entraînement
                            </p>
                          </div>
                        ) : (
                          <>
                            {day.workouts.map(
                              (workout) => (
                                <div
                                  key={
                                    workout.title
                                  }
                                  className="flex h-full flex-col"
                                >

                                  {/* TOP */}
                                  <div className="flex items-start gap-3">

                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                                      {getWorkoutIcon(
                                        workout.type,
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <p className="text-[15px] font-semibold leading-tight text-white">
                                        {
                                          workout.title
                                        }
                                      </p>

                                      <p className="mt-1 text-sm text-zinc-400">
                                        {
                                          workout.time
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  {/* SPACER */}
                                  <div className="flex-1" />

                                  {/* FOOTER */}
                                  <div className="flex flex-col items-start gap-3">

                                    <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-300">
                                      {
                                        workout.duration
                                      }
                                    </div>

                                    <div
                                      className={`
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-2xl
                                        border
                                        px-3
                                        py-2

                                        ${status.container}
                                      `}
                                    >

                                      <div
                                        className={`
                                          h-2.5
                                          w-2.5
                                          rounded-full

                                          ${status.dot}
                                        `}
                                      />

                                      <span
                                        className={`
                                          text-[10px]
                                          font-semibold
                                          uppercase
                                          tracking-[0.12em]

                                          ${status.text}
                                        `}
                                      >
                                        {
                                          status.label
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </DashboardLayout>
    );
  }