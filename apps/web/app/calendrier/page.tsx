"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  Bike,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Footprints,
  Mountain,
  Plus,
  RefreshCw,
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
  useMarkPlannedWorkoutCompleted,
} from "@/hooks/use-activities";
import type { Activity } from "@/lib/activities";

import styles from "./planning-page.module.css";

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

function getPlanningHref(date: Date) {
  return `/activites/nouvelle?date=${formatDateInput(date)}`;
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

function SportGlyph({ sport }: { sport: string }) {
  if (["ROAD_CYCLING", "GRAVEL", "MTB"].includes(sport)) {
    return <Bike aria-hidden="true" />;
  }

  if (["HIKING", "WALKING"].includes(sport)) {
    return <Footprints aria-hidden="true" />;
  }

  if (["GYM", "FITNESS"].includes(sport)) {
    return <Dumbbell aria-hidden="true" />;
  }

  return <ActivityIcon aria-hidden="true" />;
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
  const { data: activities = [], isLoading, error, refetch } = useActivities();
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
        .filter(
          (activity) => getActivityDate(activity).getTime() >= today.getTime(),
        )
        .sort(
          (firstActivity, secondActivity) =>
            getActivityDate(firstActivity).getTime() -
            getActivityDate(secondActivity).getTime(),
        )[0] ?? null,
    [activities, today],
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
    <DashboardLayout variant="refuge">
      <main className={styles.page}>
        {isLoading ? (
          <PlanningSkeleton />
        ) : (
          <>
            <FadeIn>
              <header className={styles.hero}>
                <div className={styles.heroPhoto} aria-hidden="true" />
                <div className={styles.heroOverlay} aria-hidden="true" />

                <div className={styles.heroContent}>
                  <div className={styles.heroMain}>
                    <div className={styles.heroKicker}>
                      <CalendarDays aria-hidden="true" />
                      Planning hebdomadaire
                    </div>

                    <h1>Ta semaine, du premier pas au prochain sommet.</h1>
                    <p className={styles.heroDescription}>
                      Retrouve tes sorties prévues et l’espace qui reste pour
                      improviser une aventure.
                    </p>
                  </div>

                  <div className={styles.nextWorkout}>
                    <div className={styles.nextWorkoutHeader}>
                      <div>
                        <span>Prochaine sortie</span>
                        <h2>{nextActivity ? "À venir" : "À imaginer"}</h2>
                      </div>
                      <span className={styles.nextWorkoutIcon}>
                        <Mountain aria-hidden="true" />
                      </span>
                    </div>

                    {nextActivity ? (
                      <div className={styles.nextWorkoutBody}>
                        <strong>
                          {nextActivity.title ?? "Sortie planifiée"}
                        </strong>
                        <p>
                          {longDayFormatter.format(
                            getActivityDate(nextActivity),
                          )}
                          <span aria-hidden="true"> · </span>
                          {timeFormatter.format(getActivityDate(nextActivity))}
                        </p>
                      </div>
                    ) : (
                      <div className={styles.nextWorkoutBody}>
                        <strong>Aucune sortie programmée.</strong>
                        <p>Ton prochain créneau est encore libre.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={styles.metrics}
                  aria-label="Résumé de la semaine"
                >
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
                    label="Sorties prévues"
                    value={String(plannedActivities.length)}
                  />
                  <HeroMetric
                    icon={Sparkles}
                    label="Jours actifs"
                    value={`${activeDays}/7`}
                  />
                </div>
              </header>
            </FadeIn>

            <FadeIn delay={0.04}>
              <div
                className={styles.toolbar}
                aria-label="Navigation du planning"
              >
                <div className={styles.toolbarLabel}>
                  <span>Chapitre en cours</span>
                  <strong>Choisir la semaine</strong>
                </div>

                <div className={styles.weekNavigation}>
                  <button
                    type="button"
                    onClick={goToPreviousWeek}
                    className={styles.iconButton}
                    aria-label="Afficher la semaine précédente"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>

                  <div className={styles.weekLabel} aria-live="polite">
                    <span>Semaine affichée</span>
                    <strong>{formatWeekTitle(weekStart, weekEnd)}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={goToNextWeek}
                    className={styles.iconButton}
                    aria-label="Afficher la semaine suivante"
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={goToCurrentWeek}
                    className={styles.todayButton}
                  >
                    Aujourd’hui
                  </button>
                </div>

                <Link
                  href={getPlanningHref(today)}
                  className={styles.primaryButton}
                >
                  <Plus aria-hidden="true" />
                  Planifier une sortie
                </Link>
              </div>
            </FadeIn>

            {error ? (
              <div className={styles.errorState} role="alert">
                <XCircle aria-hidden="true" />
                <div>
                  <strong>Le planning n’a pas pu rejoindre ton carnet.</strong>
                  <p>
                    Tes activités sont intactes. Réessaie simplement de charger
                    cette semaine.
                  </p>
                </div>
                <button type="button" onClick={() => void refetch()}>
                  <RefreshCw aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            ) : (
              <FadeIn delay={0.08}>
                <section
                  className={styles.weekSection}
                  aria-labelledby="week-heading"
                >
                  <div className={styles.calendarHeading}>
                    <div>
                      <span className={styles.sectionEyebrow}>
                        <CalendarDays aria-hidden="true" />
                        Vue semaine
                      </span>
                      <h2 id="week-heading">
                        Sept jours pour trouver ton rythme.
                      </h2>
                    </div>
                    <p>
                      {weekActivities.length} sortie
                      {weekActivities.length > 1 ? "s" : ""} cette semaine.
                      Chaque fiche garde sa place, même quand le terrain reste
                      ouvert.
                    </p>
                  </div>

                  <div className={styles.calendarViewport}>
                    <div className={styles.weekGrid}>
                      {activitiesByDay.map(
                        ({ day, activities: dayActivities }) => (
                          <DayColumn
                            key={day.toISOString()}
                            day={day}
                            today={today}
                            activities={dayActivities}
                            onDeletePlannedActivity={setActivityToDelete}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </section>
              </FadeIn>
            )}
          </>
        )}

        <ConfirmationDialog
          open={activityToDelete !== null}
          title="Supprimer cette sortie prévue ?"
          description={
            activityToDelete
              ? `La sortie “${activityToDelete.title ?? "sans titre"}” sera retirée du planning.`
              : "Cette sortie sera retirée du planning."
          }
          confirmLabel="Supprimer du planning"
          cancelLabel="Garder la sortie"
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

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricIcon}>
        <Icon aria-hidden="true" />
      </span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

function PlanningSkeleton() {
  return (
    <div
      className={styles.skeletonPage}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.srOnly}>Chargement du planning…</span>

      <div className={styles.skeletonHero}>
        <span />
        <span />
        <span />
        <div>
          <span />
          <span />
        </div>
      </div>

      <div className={styles.skeletonToolbar}>
        <span />
        <span />
        <span />
      </div>

      <div className={styles.skeletonHeading}>
        <span />
        <span />
      </div>

      <div className={styles.skeletonWeek}>
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index}>
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  today,
  activities,
  onDeletePlannedActivity,
}: {
  day: Date;
  today: Date;
  activities: Activity[];
  onDeletePlannedActivity: (activity: Activity) => void;
}) {
  const isToday = isSameDay(day, today);
  const plannedCount = activities.filter(
    (activity) => activity.status === "PLANNED",
  ).length;

  return (
    <div
      className={`${styles.dayCard} ${isToday ? styles.todayCard : ""}`}
      data-day={formatDateInput(day)}
      aria-current={isToday ? "date" : undefined}
      aria-label={`${longDayFormatter.format(day)}${isToday ? ", aujourd’hui" : ""}`}
    >
      <div className={styles.dayHeader}>
        <div className={styles.dayIdentity}>
          <span className={styles.dayName}>
            {dayFormatter.format(day).replace(".", "")}
          </span>
          <strong>{day.getDate()}</strong>
        </div>

        <Link
          href={getPlanningHref(day)}
          className={styles.dayAddButton}
          aria-label={`Planifier une sortie le ${longDayFormatter.format(day)}`}
        >
          <Plus aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.daySummary}>
        {isToday ? (
          <span className={styles.todayBadge}>Aujourd’hui</span>
        ) : null}
        <span className={styles.dayCount}>
          {activities.length === 0
            ? "Journée libre"
            : `${activities.length} sortie${activities.length > 1 ? "s" : ""}`}
        </span>
        {plannedCount > 0 ? (
          <span className={styles.plannedCount}>
            {plannedCount} prévue{plannedCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      <div className={styles.dayContent}>
        {activities.length === 0 ? (
          <EmptyDay day={day} />
        ) : (
          activities.map((activity) => (
            <CalendarActivity
              key={activity.id}
              activity={activity}
              now={today}
              onDeletePlannedActivity={onDeletePlannedActivity}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyDay({ day }: { day: Date }) {
  return (
    <div className={styles.emptyDay}>
      <span className={styles.emptyDayIcon}>
        <Mountain aria-hidden="true" />
      </span>
      <div>
        <strong>Journée libre</strong>
        <p>Aucune sortie prévue. Le terrain reste ouvert.</p>
      </div>
      <Link href={getPlanningHref(day)}>
        <Plus aria-hidden="true" />
        Ajouter une sortie
      </Link>
    </div>
  );
}

function CalendarActivity({
  activity,
  now,
  onDeletePlannedActivity,
}: {
  activity: Activity;
  now: Date;
  onDeletePlannedActivity: (activity: Activity) => void;
}) {
  const activityDate = getActivityDate(activity);
  const status = getActivityStatus(activity);
  const StatusIcon = status.icon;
  const hasDistance = Boolean(activity.distance && activity.distance > 0);
  const hasDuration = activity.duration > 0;
  const plannedNote =
    activity.status === "PLANNED" ? activity.description?.trim() : null;
  const completePlannedWorkoutMutation = useMarkPlannedWorkoutCompleted();
  const activityHref = activity.completedActivityId
    ? `/activites/${activity.completedActivityId}`
    : `/activites/${activity.id}`;
  const replanHref = `/activites/nouvelle?${new URLSearchParams({
    status: "PLANNED",
    date: formatDateInput(new Date()),
    sport: activity.sport,
    title: activity.title ?? "Sortie planifiée",
    duration: String(activity.duration ?? 0),
    distance: String(activity.distance ?? 0),
    returnTo: "/calendrier",
  }).toString()}`;
  const toneClass = {
    planned: styles.activityPlanned,
    completed: styles.activityCompleted,
    missed: styles.activityMissed,
    canceled: styles.activityCanceled,
  }[status.tone];
  const canMarkAsCompleted = activityDate.getTime() <= now.getTime();
  const futureCompletionLabel = `Disponible à partir du ${longDayFormatter.format(
    activityDate,
  )} à ${timeFormatter.format(activityDate)}`;

  return (
    <div className={`${styles.activityCard} ${toneClass}`}>
      <div className={styles.activityTopline}>
        <span className={styles.activityIcon}>
          <SportGlyph sport={activity.sport} />
        </span>
        <div>
          <span>{timeFormatter.format(activityDate)}</span>
          <strong>{sportLabels[activity.sport] ?? activity.sport}</strong>
        </div>
        <span className={styles.statusBadge}>
          <StatusIcon aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <Link
        href={activityHref}
        className={styles.activityTitle}
        title={activity.title ?? "Sortie sans titre"}
      >
        {activity.title ?? "Sortie sans titre"}
      </Link>

      {plannedNote ? (
        <p className={styles.activityNote}>{plannedNote}</p>
      ) : null}

      {hasDistance || hasDuration ? (
        <div className={styles.activityMetrics}>
          {hasDistance ? (
            <span>
              <Route aria-hidden="true" />
              {formatDistance(activity.distance)}
            </span>
          ) : null}
          {hasDuration ? (
            <span>
              <Clock3 aria-hidden="true" />
              {formatDuration(activity.duration)}
            </span>
          ) : null}
        </div>
      ) : null}

      {activity.status === "COMPLETED" && activity.completedActivityId ? (
        <Link href={activityHref} className={styles.viewAction}>
          Voir l’activité
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : null}

      {activity.status === "MISSED" ? (
        <Link href={replanHref} className={styles.secondaryAction}>
          <RotateCcw aria-hidden="true" />
          Replanifier
        </Link>
      ) : null}

      {activity.status === "PLANNED" ? (
        <div className={styles.plannedActions}>
          <button
            type="button"
            className={styles.completeAction}
            aria-label={
              canMarkAsCompleted
                ? `Indiquer que la sortie ${activity.title ?? "planifiée"} a été réalisée`
                : `${activity.title ?? "Sortie planifiée"} : ${futureCompletionLabel}`
            }
            title={canMarkAsCompleted ? undefined : futureCompletionLabel}
            data-future={!canMarkAsCompleted}
            data-pending={completePlannedWorkoutMutation.isPending}
            disabled={
              !canMarkAsCompleted || completePlannedWorkoutMutation.isPending
            }
            onClick={() => completePlannedWorkoutMutation.mutate(activity.id)}
          >
            {canMarkAsCompleted ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <Clock3 aria-hidden="true" />
            )}
            {completePlannedWorkoutMutation.isPending
              ? "Validation…"
              : canMarkAsCompleted
                ? "Sortie faite"
                : "À venir"}
          </button>
          <button
            type="button"
            className={styles.deleteAction}
            onClick={() => onDeletePlannedActivity(activity)}
            aria-label={`Supprimer la sortie prévue ${activity.title ?? "sans titre"} du planning`}
            title="Supprimer du planning"
          >
            <Trash2 aria-hidden="true" />
            Supprimer
          </button>
          {completePlannedWorkoutMutation.isError ? (
            <p className={styles.mutationError}>
              Impossible de valider la sortie.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
