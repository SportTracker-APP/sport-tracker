"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Activity as ActivityIcon,
  Bike,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  Mountain,
  Plus,
  Route,
  Sparkles,
  Target,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import { useActivities } from "@/hooks/use-activities";
import type { Activity } from "@/lib/activities";

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
});

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
});

const compactDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

const sportLabels: Record<string, string> = {
  RUNNING: "Course",
  ROAD_CYCLING: "Cyclisme",
  GRAVEL: "Gravel",
  MTB: "VTT",
  TRAIL: "Trail",
  HIKING: "Randonnée",
  WALKING: "Marche",
  GYM: "Musculation",
  FITNESS: "Fitness",
  SWIMMING: "Natation",
};

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

function isSameOrAfterDay(firstDate: Date, secondDate: Date) {
  const first = new Date(firstDate);
  const second = new Date(secondDate);

  first.setHours(0, 0, 0, 0);
  second.setHours(0, 0, 0, 0);

  return first >= second;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(
    2,
    "0",
  )}`;
}

function formatDistance(distance: number | null) {
  if (distance === null) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance);
}

function getSportIcon(sport: string) {
  if (["ROAD_CYCLING", "GRAVEL", "MTB"].includes(sport)) {
    return Bike;
  }

  if (["HIKING", "WALKING"].includes(sport)) {
    return Footprints;
  }

  if (["GYM", "FITNESS"].includes(sport)) {
    return Dumbbell;
  }

  return ActivityIcon;
}

function getDayTone(activities: Activity[], isToday: boolean) {
  if (isToday) {
    return "border-violet-500/30 bg-violet-500/[0.085] ring-1 ring-violet-500/25";
  }

  if (activities.length >= 2) {
    return "border-emerald-500/20 bg-emerald-500/[0.055]";
  }

  if (activities.length === 1) {
    return "border-sky-500/16 bg-sky-500/[0.045]";
  }

  return "border-white/[0.07] bg-white/[0.025]";
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [hasSelectedInitialWeek, setHasSelectedInitialWeek] = useState(false);
  const { data: activities = [], isLoading, error } = useActivities();

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(
    () =>
      Array.from({
        length: 7,
      }).map((_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const weekEnd = weekDays[6];

  useEffect(() => {
    if (hasSelectedInitialWeek || activities.length === 0) {
      return;
    }

    const currentWeekStart = startOfWeek(new Date());
    const currentWeekEnd = addDays(currentWeekStart, 6);
    const hasCurrentWeekActivity = activities.some((activity) => {
      const startedAt = new Date(activity.startedAt);

      return startedAt >= currentWeekStart && startedAt <= currentWeekEnd;
    });

    if (!hasCurrentWeekActivity) {
      const latestActivity = activities.reduce((latest, activity) =>
        new Date(activity.startedAt) > new Date(latest.startedAt)
          ? activity
          : latest,
      );

      setWeekStart(startOfWeek(new Date(latestActivity.startedAt)));
    }

    setHasSelectedInitialWeek(true);
  }, [activities, hasSelectedInitialWeek]);

  const activitiesByDay = useMemo(
    () =>
      weekDays.map((day) =>
        activities
          .filter((activity) => isSameDay(new Date(activity.startedAt), day))
          .sort(
            (firstActivity, secondActivity) =>
              new Date(firstActivity.startedAt).getTime() -
              new Date(secondActivity.startedAt).getTime(),
          ),
      ),
    [activities, weekDays],
  );

  const weekActivities = useMemo(
    () => activitiesByDay.flat(),
    [activitiesByDay],
  );
  const completedWeekActivities = useMemo(
    () => weekActivities.filter((activity) => activity.status !== "PLANNED"),
    [weekActivities],
  );

  const weeklyDistance = useMemo(
    () =>
      completedWeekActivities.reduce(
        (total, activity) => total + (activity.distance || 0),
        0,
      ),
    [completedWeekActivities],
  );

  const weeklyDuration = useMemo(
    () =>
      completedWeekActivities.reduce(
        (total, activity) => total + activity.duration,
        0,
      ),
    [completedWeekActivities],
  );

  const weeklyCalories = useMemo(
    () =>
      completedWeekActivities.reduce(
        (total, activity) => total + (activity.calories || 0),
        0,
      ),
    [completedWeekActivities],
  );

  function goToPreviousWeek() {
    setHasSelectedInitialWeek(true);
    setWeekStart((current) => addDays(current, -7));
  }

  function goToNextWeek() {
    setHasSelectedInitialWeek(true);
    setWeekStart((current) => addDays(current, 7));
  }

  function goToCurrentWeek() {
    setHasSelectedInitialWeek(true);
    setWeekStart(startOfWeek(new Date()));
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <FadeIn>
          <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#161821]/95 p-6 backdrop-blur-xl lg:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_34%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_34%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:84px_84px] opacity-50" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Calendrier semaine
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-white lg:text-5xl">
                  Votre semaine sportive, jour par jour.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                  Les activités Strava et les séances créées dans Sport Tracker
                  apparaissent automatiquement dans leur journée.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Route className="h-4 w-4 text-sky-300" />
                    Distance semaine
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatDistance(weeklyDistance)} km
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock3 className="h-4 w-4 text-violet-300" />
                    Temps semaine
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatDuration(weeklyDuration)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Flame className="h-4 w-4 text-orange-300" />
                    Calories
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {new Intl.NumberFormat("fr-FR").format(weeklyCalories)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={0.08}>
          <section className="app-calendar-toolbar flex flex-col gap-4 rounded-[28px] border border-white/[0.08] bg-[#11131a]/92 p-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToPreviousWeek}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-zinc-300 transition-colors hover:border-violet-500/25 hover:bg-violet-500/10 hover:text-white"
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
                <p className="text-[10px] font-medium tracking-[0.18em] text-zinc-500 uppercase">
                  Semaine affichée
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {monthFormatter.format(weekStart)} →{" "}
                  {monthFormatter.format(weekEnd)}
                </p>
              </div>

              <button
                type="button"
                onClick={goToNextWeek}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-zinc-300 transition-colors hover:border-violet-500/25 hover:bg-violet-500/10 hover:text-white"
                aria-label="Semaine suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={goToCurrentWeek}
                className="hidden h-11 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-zinc-300 transition-colors hover:border-violet-500/25 hover:bg-violet-500/10 hover:text-white sm:block"
              >
                Aujourd'hui
              </button>
            </div>

            <Button
              asChild
              className="h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.28)]"
            >
              <Link href="/activites/nouvelle">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une séance
              </Link>
            </Button>
          </section>
        </FadeIn>

        {isLoading && (
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-8 text-center text-zinc-400">
            Chargement du calendrier...
          </div>
        )}

        {error && (
          <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-8 text-center text-red-300">
            Impossible de charger les activités du calendrier.
          </div>
        )}

        {!isLoading && !error && (
          <FadeIn delay={0.12}>
            <section className="app-calendar-grid grid gap-4 md:grid-cols-2 xl:grid-cols-7">
              {weekDays.map((day, index) => {
                const dayActivities = activitiesByDay[index];
                const isToday = isSameDay(day, today);
                const canPlanActivity = isSameOrAfterDay(day, today);
                const activeMinutes = dayActivities.reduce(
                  (total, activity) => total + activity.duration,
                  0,
                );
                const planHref = `/activites/nouvelle?date=${formatDateInput(
                  day,
                )}&status=PLANNED&returnTo=/calendrier`;

                return (
                  <article
                    key={day.toISOString()}
                    className={`app-calendar-day relative min-h-[360px] overflow-hidden rounded-[28px] border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/25 ${getDayTone(
                      dayActivities,
                      isToday,
                    )}`}
                  >
                    {isToday && (
                      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                    )}

                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045),transparent_34%)]" />

                    <div className="relative flex h-full flex-col">
                      <header className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-400 capitalize">
                              {dayFormatter.format(day)}
                            </p>

                            {isToday && (
                              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-violet-200 uppercase">
                                Aujourd'hui
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-5xl leading-none font-black tracking-tight text-white">
                            {day.getDate()}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {compactDateFormatter.format(day)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2.5 text-violet-300">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                      </header>

                      <div className="app-calendar-pill mt-5 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/10 px-3 py-2 text-xs text-zinc-400">
                        <span>
                          {dayActivities.length} activité
                          {dayActivities.length > 1 ? "s" : ""}
                        </span>
                        <span>
                          {activeMinutes
                            ? formatDuration(activeMinutes)
                            : "Repos"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-1 flex-col gap-3">
                        {dayActivities.length === 0 ? (
                          canPlanActivity ? (
                            <Link
                              href={planHref}
                              className="app-calendar-empty group flex flex-1 flex-col items-center justify-center rounded-[22px] border border-dashed border-violet-500/20 bg-violet-500/[0.035] px-4 py-6 text-center transition-colors hover:border-violet-400/35 hover:bg-violet-500/[0.075]"
                            >
                              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-200 transition-colors group-hover:bg-violet-500/20 group-hover:text-white">
                                <Plus className="h-5 w-5" />
                              </div>
                              <p className="text-sm font-semibold text-white">
                                Planifier une séance
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Ajouter une activité à faire.
                              </p>
                            </Link>
                          ) : (
                            <div className="app-calendar-empty flex flex-1 flex-col items-center justify-center rounded-[22px] border border-dashed border-white/[0.08] bg-black/10 px-4 py-6 text-center">
                              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500">
                                <Target className="h-5 w-5" />
                              </div>
                              <p className="text-sm font-semibold text-zinc-300">
                                Journée libre
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Aucun entraînement.
                              </p>
                            </div>
                          )
                        ) : (
                          dayActivities.map((activity) => {
                            const Icon = getSportIcon(activity.sport);
                            const isPlanned = activity.status === "PLANNED";

                            return (
                              <Link
                                key={activity.id}
                                href={`/activites/${activity.id}`}
                                className="app-calendar-activity group rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-3 transition-colors hover:border-violet-500/25 hover:bg-violet-500/10"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="app-calendar-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/15 text-violet-200">
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                      <span>
                                        {timeFormatter.format(
                                          new Date(activity.startedAt),
                                        )}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {sportLabels[activity.sport] ||
                                          activity.sport}
                                      </span>
                                      {isPlanned && (
                                        <>
                                          <span>•</span>
                                          <span className="font-medium text-violet-200">
                                            Prévu
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    <p className="mt-1 text-sm font-semibold text-white">
                                      {isPlanned
                                        ? "À faire"
                                        : sportLabels[activity.sport] ||
                                          activity.sport}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-zinc-400">
                                  <span className="app-calendar-mini-stat rounded-2xl border border-white/[0.07] bg-black/10 px-2 py-2 text-center">
                                    {formatDistance(activity.distance)} km
                                  </span>
                                  <span className="app-calendar-mini-stat rounded-2xl border border-white/[0.07] bg-black/10 px-2 py-2 text-center">
                                    {formatDuration(activity.duration)}
                                  </span>
                                  <span className="app-calendar-mini-stat inline-flex items-center justify-center gap-1 rounded-2xl border border-white/[0.07] bg-black/10 px-2 py-2 text-center">
                                    {activity.elevationGain !== null ? (
                                      <>
                                        <Mountain className="h-3 w-3 text-emerald-300" />
                                        {activity.elevationGain} m
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </span>
                                </div>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </FadeIn>
        )}
      </div>
    </DashboardLayout>
  );
}
