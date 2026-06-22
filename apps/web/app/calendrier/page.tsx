"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Activity as ActivityIcon,
  Bike,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Footprints,
  Mountain,
  Plus,
  Route,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { FadeIn } from "@/components/ui/fade-in";
import {
  useActivities,
  useDeleteActivity,
} from "@/hooks/use-activities";
import type { Activity } from "@/lib/activities";

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
});

const longDayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
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
  const currentDay = nextDate.getDay();
  const offset = currentDay === 0 ? -6 : 1 - currentDay;

  nextDate.setDate(nextDate.getDate() + offset);
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

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "0 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes}`;
}

function formatDistance(distance: number | null) {
  if (!distance || distance <= 0) {
    return "0 km";
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance)} km`;
}

function formatWeekTitle(weekStart: Date, weekEnd: Date) {
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  if (sameMonth && sameYear) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${monthFormatter.format(
      weekStart,
    )} ${weekStart.getFullYear()}`;
  }

  return `${weekStart.getDate()} ${monthFormatter.format(
    weekStart,
  )} – ${weekEnd.getDate()} ${monthFormatter.format(weekEnd)} ${weekEnd.getFullYear()}`;
}

function getSportIcon(sport: string): LucideIcon {
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

function getActivityDate(activity: Activity) {
  return new Date(activity.startedAt);
}

function getActivityStatus(activity: Activity) {
  if (activity.status === "PLANNED") {
    return { label: "Planifiée", tone: "planned" as const, icon: CalendarDays };
  }

  if (activity.status === "MISSED") {
    return { label: "Manquée", tone: "missed" as const, icon: RotateCcw };
  }

  if (activity.status === "CANCELED") {
    return { label: "Annulée", tone: "canceled" as const, icon: XCircle };
  }

  return { label: "Terminée", tone: "completed" as const, icon: CheckCircle2 };
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(
    null,
  );
  const { data: activities = [], isLoading, error } = useActivities();
  const deleteActivityMutation = useDeleteActivity();

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const weekEnd = weekDays[6];

  const activitiesByDay = useMemo(
    () =>
      weekDays.map((day) => ({
        day,
        activities: activities
          .filter((activity) => !activity.plannedWorkoutId)
          .filter((activity) => isSameDay(getActivityDate(activity), day))
          .sort(
            (firstActivity, secondActivity) =>
              getActivityDate(firstActivity).getTime() -
              getActivityDate(secondActivity).getTime(),
          ),
      })),
    [activities, weekDays],
  );

  const weekActivities = useMemo(
    () => activitiesByDay.flatMap((day) => day.activities),
    [activitiesByDay],
  );

  const completedActivities = useMemo(
    () =>
      weekActivities.filter(
        (activity) =>
          activity.status === "COMPLETED" && !activity.completedActivityId,
      ),
    [weekActivities],
  );

  const plannedActivities = useMemo(
    () => weekActivities.filter((activity) => activity.status === "PLANNED"),
    [weekActivities],
  );

  const weekDistance = useMemo(
    () =>
      completedActivities.reduce(
        (total, activity) => total + (activity.distance ?? 0),
        0,
      ),
    [completedActivities],
  );

  const weekDuration = useMemo(
    () =>
      completedActivities.reduce(
        (total, activity) => total + activity.duration,
        0,
      ),
    [completedActivities],
  );

  const activeDays = useMemo(
    () => activitiesByDay.filter((day) => day.activities.length > 0).length,
    [activitiesByDay],
  );

  const nextActivity = useMemo(
    () =>
      activities
        .filter((activity) => activity.status === "PLANNED")
        .filter((activity) => getActivityDate(activity).getTime() >= Date.now())
        .sort(
          (firstActivity, secondActivity) =>
            getActivityDate(firstActivity).getTime() -
            getActivityDate(secondActivity).getTime(),
        )[0] ?? null,
    [activities],
  );

  function goToPreviousWeek() {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, -7));
  }

  function goToNextWeek() {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, 7));
  }

  function goToCurrentWeek() {
    setWeekStart(startOfWeek(new Date()));
  }

  async function handleConfirmDelete() {
    if (!activityToDelete) {
      return;
    }

    await deleteActivityMutation.mutateAsync(activityToDelete.id);
    setActivityToDelete(null);
  }

  return (
    <DashboardLayout>
      <main className="app-calendar-page-v2 space-y-5 pb-10">
        <FadeIn>
          <section className="app-calendar-hero-v2 relative isolate overflow-hidden rounded-[32px] border border-white/15 px-6 py-7 text-white shadow-[0_28px_80px_rgba(6,78,59,0.22)] sm:px-8 sm:py-8 lg:px-10">
            <div className="app-calendar-hero-photo-v2 absolute inset-0 -z-30" />
            <div className="app-calendar-hero-overlay-v2 absolute inset-0 -z-20" />
            <div className="app-calendar-hero-grid-v2 absolute inset-0 -z-10" />

            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div className="min-w-0">
                <div className="app-calendar-hero-kicker-v2 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Planning de la semaine
                </div>

                <h1 className="app-calendar-hero-title-v2 mt-5 max-w-3xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-[3.2rem] lg:leading-[1.04]">
                  Une semaine claire. Une prochaine sortie qui donne envie.
                </h1>

                <p className="app-calendar-hero-copy-v2 mt-4 max-w-2xl text-sm leading-7 sm:text-base">
                  Regroupe tes activités terminées, tes séances prévues et tes
                  journées libres sans transformer ton calendrier en tableau de
                  bord surchargé.
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <HeroMetric
                    icon={Route}
                    label="Distance"
                    value={formatDistance(weekDistance)}
                  />
                  <HeroMetric
                    icon={Clock3}
                    label="Temps en mouvement"
                    value={formatDuration(weekDuration)}
                  />
                  <HeroMetric
                    icon={Target}
                    label="Séances prévues"
                    value={String(plannedActivities.length)}
                  />
                  <HeroMetric
                    icon={Sparkles}
                    label="Jours actifs"
                    value={`${activeDays}/7`}
                  />
                </div>
              </div>

              <div className="app-calendar-next-card-v2 rounded-[26px] border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-emerald-100/65">
                      Semaine affichée
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {formatWeekTitle(weekStart, weekEnd)}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-100">
                    <Mountain className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 border-t border-white/12 pt-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.25em] text-emerald-100/60">
                    Prochaine séance
                  </p>
                  {nextActivity ? (
                    <div className="mt-3 min-w-0">
                      <p className="line-clamp-2 font-semibold leading-6 text-white">
                        {nextActivity.title ?? "Séance planifiée"}
                      </p>
                      <p className="mt-2 text-sm text-emerald-50/72">
                        {longDayFormatter.format(getActivityDate(nextActivity))}
                        {" · "}
                        {timeFormatter.format(getActivityDate(nextActivity))}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-emerald-50/72">
                      Aucune séance à venir. Ta prochaine aventure peut commencer
                      ici.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={0.04}>
          <section className="app-calendar-toolbar-v2 flex flex-col gap-4 rounded-[26px] border p-3.5 shadow-[0_16px_48px_rgba(15,118,110,0.08)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={goToPreviousWeek}
                className="app-calendar-icon-button-v2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5"
                aria-label="Afficher la semaine précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="min-w-[190px] rounded-2xl border border-emerald-950/10 bg-white/75 px-4 py-2.5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Semaine
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-950">
                  {formatWeekTitle(weekStart, weekEnd)}
                </p>
              </div>

              <button
                type="button"
                onClick={goToNextWeek}
                className="app-calendar-icon-button-v2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5"
                aria-label="Afficher la semaine suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={goToCurrentWeek}
                className="app-calendar-today-button-v2 inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5"
              >
                Aujourd’hui
              </button>
            </div>

            <Link
              href={`/activites/nouvelle?date=${formatDateInput(today)}`}
              className="app-calendar-primary-button-v2 inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-bold transition hover:-translate-y-0.5"
            >
              <Plus className="mr-2 h-4 w-4" />
              Planifier une séance
            </Link>
          </section>
        </FadeIn>

        {isLoading && (
          <section className="rounded-[26px] border border-emerald-950/10 bg-white/75 p-10 text-center text-slate-500">
            Chargement du planning…
          </section>
        )}

        {error && (
          <section className="rounded-[26px] border border-red-500/20 bg-red-50 p-10 text-center text-red-700">
            Impossible de charger les activités du calendrier.
          </section>
        )}

        {!isLoading && !error && (
          <FadeIn delay={0.08}>
            <section className="app-calendar-week-shell-v2 overflow-hidden rounded-[30px] border p-3 shadow-[0_24px_70px_rgba(15,118,110,0.1)]">
              <div className="overflow-x-auto pb-1">
                <div className="grid min-w-[1120px] grid-cols-7 gap-3">
                  {activitiesByDay.map(({ day, activities: dayActivities }) => (
                    <DayColumn
                      key={day.toISOString()}
                      day={day}
                      today={today}
                      activities={dayActivities}
                      onDeletePlannedActivity={setActivityToDelete}
                    />
                  ))}
                </div>
              </div>
            </section>
          </FadeIn>
        )}

        <ConfirmationDialog
          open={activityToDelete !== null}
          title="Supprimer cette sortie prévue ?"
          description={
            activityToDelete
              ? `La séance “${activityToDelete.title ?? "sans titre"}” sera retirée du planning.`
              : "Cette séance sera retirée du planning."
          }
          confirmLabel="Supprimer du planning"
          cancelLabel="Garder la séance"
          tone="danger"
          icon={<Trash2 aria-hidden="true" />}
          isLoading={deleteActivityMutation.isPending}
          onConfirm={handleConfirmDelete}
          onOpenChange={(open) => {
            if (!open && !deleteActivityMutation.isPending) {
              setActivityToDelete(null);
            }
          }}
        />
      </main>
    </DashboardLayout>
  );
}

type HeroMetricProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function HeroMetric({ icon: Icon, label, value }: HeroMetricProps) {
  return (
    <div className="app-calendar-hero-metric-v2 inline-flex min-w-[150px] items-center gap-3 rounded-2xl border px-3.5 py-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/10 text-emerald-100">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-emerald-50/58">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-white">
          {value}
        </span>
      </span>
    </div>
  );
}

type DayColumnProps = {
  day: Date;
  today: Date;
  activities: Activity[];
  onDeletePlannedActivity: (activity: Activity) => void;
};

function DayColumn({
  day,
  today,
  activities,
  onDeletePlannedActivity,
}: DayColumnProps) {
  const isToday = isSameDay(day, today);
  const plannedCount = activities.filter(
    (activity) => activity.status === "PLANNED",
  ).length;

  return (
    <article
      className={`app-calendar-day-v2 flex min-h-[340px] min-w-0 flex-col rounded-[24px] border p-3.5 transition duration-200 hover:-translate-y-0.5 ${
        isToday ? "app-calendar-day-today-v2" : ""
      }`}
    >
      <header className="flex items-start justify-between gap-2 border-b border-emerald-950/8 pb-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {dayFormatter.format(day).replace(".", "")}
            </p>
            {isToday && (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-emerald-700">
                Aujourd’hui
              </span>
            )}
          </div>
          <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {day.getDate()}
          </p>
        </div>

        <Link
          href={`/activites/nouvelle?date=${formatDateInput(day)}`}
          className="app-calendar-day-add-v2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition hover:scale-105"
          aria-label={`Planifier une séance le ${longDayFormatter.format(day)}`}
        >
          <Plus className="h-4 w-4" />
        </Link>
      </header>

      <div className="mt-3 flex items-center justify-between gap-2 text-[0.68rem] font-semibold text-slate-500">
        <span>
          {activities.length === 0
            ? "Journée libre"
            : `${activities.length} séance${activities.length > 1 ? "s" : ""}`}
        </span>
        {plannedCount > 0 && (
          <span className="text-emerald-700">{plannedCount} prévue</span>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2.5">
        {activities.length === 0 ? (
          <EmptyDay day={day} />
        ) : (
          activities.map((activity) => (
            <CalendarActivity
              key={activity.id}
              activity={activity}
              onDeletePlannedActivity={onDeletePlannedActivity}
            />
          ))
        )}
      </div>
    </article>
  );
}

function EmptyDay({ day }: { day: Date }) {
  return (
    <div className="flex flex-1 flex-col justify-between rounded-[18px] border border-dashed border-emerald-900/12 bg-white/38 p-3.5">
      <div>
        <p className="text-sm font-semibold text-slate-700">Repos ou liberté.</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Garde la journée légère ou pose une nouvelle sortie.
        </p>
      </div>

      <Link
        href={`/activites/nouvelle?date=${formatDateInput(day)}`}
        className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 transition hover:text-emerald-900"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter une séance
      </Link>
    </div>
  );
}

function CalendarActivity({
  activity,
  onDeletePlannedActivity,
}: {
  activity: Activity;
  onDeletePlannedActivity: (activity: Activity) => void;
}) {
  const activityDate = getActivityDate(activity);
  const SportIcon = getSportIcon(activity.sport);
  const status = getActivityStatus(activity);
  const StatusIcon = status.icon;
  const hasDistance = Boolean(activity.distance && activity.distance > 0);
  const hasDuration = activity.duration > 0;
  const activityHref = activity.completedActivityId
    ? `/activites/${activity.completedActivityId}`
    : `/activites/${activity.id}`;
  const recordHref = `/activites/nouvelle?${new URLSearchParams({
    plannedWorkoutId: activity.id,
    status: "COMPLETED",
    date: formatDateInput(activityDate),
    sport: activity.sport,
    title: activity.title ?? "Séance planifiée",
    duration: String(activity.duration ?? 0),
    distance: String(activity.distance ?? 0),
    returnTo: "/calendrier",
  }).toString()}`;
  const replanHref = `/activites/nouvelle?${new URLSearchParams({
    status: "PLANNED",
    date: formatDateInput(new Date()),
    sport: activity.sport,
    title: activity.title ?? "Séance planifiée",
    duration: String(activity.duration ?? 0),
    distance: String(activity.distance ?? 0),
    returnTo: "/calendrier",
  }).toString()}`;

  return (
    <article
      className={`app-calendar-activity-v2 group block rounded-[18px] border p-3 transition hover:-translate-y-0.5 ${
        status.tone === "planned" ? "app-calendar-activity-planned-v2" : ""
      } ${
        status.tone === "completed" ? "app-calendar-activity-completed-v2" : ""
      } ${
        status.tone === "missed" ? "app-calendar-activity-muted-v2" : ""
      } ${
        status.tone === "canceled" ? "app-calendar-activity-canceled-v2" : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="app-calendar-activity-icon-v2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
          <SportIcon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-1.5">
            <p className="truncate text-[0.66rem] font-semibold text-slate-500">
              {timeFormatter.format(activityDate)} ·{" "}
              {sportLabels[activity.sport] ?? activity.sport}
            </p>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-1 text-[0.5rem] font-bold uppercase tracking-[0.08em] text-emerald-700"
            >
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={activityHref}
        className="mx-auto mt-3 line-clamp-2 block max-w-[12rem] text-center text-[0.92rem] font-bold leading-6 text-slate-950 transition group-hover:text-emerald-800"
        title={activity.title ?? "Séance sans titre"}
      >
        {activity.title ?? "Séance sans titre"}
      </Link>

      {(hasDistance || hasDuration) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold text-slate-500">
          {hasDistance && <span>{formatDistance(activity.distance)}</span>}
          {hasDuration && <span>{formatDuration(activity.duration)}</span>}
        </div>
      )}

      {activity.status === "COMPLETED" && activity.completedActivityId ? (
        <Link
          href={activityHref}
          className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
        >
          Voir l’activité
        </Link>
      ) : null}

      {activity.status === "MISSED" ? (
        <Link
          href={replanHref}
          className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Replanifier
        </Link>
      ) : null}

      {activity.status === "PLANNED" ? (
        <div className="mt-3 grid gap-1.5">
          <Link
            href={recordHref}
            className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 text-[0.72rem] font-bold leading-tight text-emerald-800 transition hover:bg-emerald-100"
            aria-label={`Indiquer que la séance ${activity.title ?? "planifiée"} a été réalisée et saisir ses résultats`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Sortie faite</span>
          </Link>
          <button
            type="button"
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50/70 px-2 text-[0.68rem] font-bold text-red-700 transition hover:bg-red-100"
            onClick={() => onDeletePlannedActivity(activity)}
            aria-label={`Supprimer la séance prévue ${activity.title ?? "sans titre"} du planning`}
            title="Supprimer du planning"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate">Supprimer</span>
          </button>
        </div>
      ) : null}
    </article>
  );
}
