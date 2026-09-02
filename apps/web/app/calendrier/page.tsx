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
import { useActivities, useDeleteActivity } from "@/hooks/use-activities";
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

const monthYearFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

const monthWeekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type PlanningView = "week" | "month";

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

function startOfMonth(date: Date) {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), 1);

  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isSameMonth(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth()
  );
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPlanningHref(date: Date) {
  return `/activites/nouvelle?${new URLSearchParams({
    status: "PLANNED",
    date: formatDateInput(date),
    returnTo: "/calendrier",
  }).toString()}`;
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

function formatMonthTitle(monthStart: Date) {
  const label = monthYearFormatter.format(monthStart);

  return label.charAt(0).toUpperCase() + label.slice(1);
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

function getActivityHref(activity: Activity) {
  return activity.completedActivityId
    ? `/activites/${activity.completedActivityId}`
    : `/activites/${activity.id}`;
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
  const [view, setView] = useState<PlanningView>("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
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

  const monthDays = useMemo(() => {
    const calendarStart = startOfWeek(monthStart);

    return Array.from({ length: 42 }, (_, index) =>
      addDays(calendarStart, index),
    );
  }, [monthStart]);

  const calendarActivities = useMemo(
    () => activities.filter((activity) => !activity.plannedWorkoutId),
    [activities],
  );

  const activitiesByDay = useMemo(
    () =>
      weekDays.map((day) => ({
        day,
        activities: calendarActivities
          .filter((activity) => isSameDay(getActivityDate(activity), day))
          .sort(
            (firstActivity, secondActivity) =>
              getActivityDate(firstActivity).getTime() -
              getActivityDate(secondActivity).getTime(),
          ),
      })),
    [calendarActivities, weekDays],
  );

  const monthActivitiesByDay = useMemo(
    () =>
      monthDays.map((day) => ({
        day,
        activities: calendarActivities
          .filter((activity) => isSameDay(getActivityDate(activity), day))
          .sort(
            (firstActivity, secondActivity) =>
              getActivityDate(firstActivity).getTime() -
              getActivityDate(secondActivity).getTime(),
          ),
      })),
    [calendarActivities, monthDays],
  );

  const weekActivities = useMemo(
    () => activitiesByDay.flatMap((day) => day.activities),
    [activitiesByDay],
  );

  const monthActivities = useMemo(
    () =>
      calendarActivities
        .filter((activity) =>
          isSameMonth(getActivityDate(activity), monthStart),
        )
        .sort(
          (firstActivity, secondActivity) =>
            getActivityDate(firstActivity).getTime() -
            getActivityDate(secondActivity).getTime(),
        ),
    [calendarActivities, monthStart],
  );

  const visibleActivities = view === "week" ? weekActivities : monthActivities;

  const completedActivities = useMemo(
    () =>
      visibleActivities.filter(
        (activity) =>
          activity.status === "COMPLETED" && !activity.completedActivityId,
      ),
    [visibleActivities],
  );

  const plannedActivities = useMemo(
    () =>
      visibleActivities.filter((activity) => activity.status === "PLANNED"),
    [visibleActivities],
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

  const activeDays = useMemo(() => {
    const uniqueDays = new Set(
      visibleActivities.map((activity) =>
        formatDateInput(getActivityDate(activity)),
      ),
    );

    return uniqueDays.size;
  }, [visibleActivities]);

  const periodDayCount =
    view === "week"
      ? 7
      : new Date(
          monthStart.getFullYear(),
          monthStart.getMonth() + 1,
          0,
        ).getDate();

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

  function changeView(nextView: PlanningView) {
    if (nextView === view) {
      return;
    }

    if (nextView === "month") {
      setMonthStart(startOfMonth(addDays(weekStart, 3)));
    } else {
      const currentMonth = isSameMonth(monthStart, today);
      setWeekStart(startOfWeek(currentMonth ? today : monthStart));
    }

    setView(nextView);
  }

  function goToPreviousPeriod() {
    if (view === "week") {
      setWeekStart((currentWeekStart) => addDays(currentWeekStart, -7));
      return;
    }

    setMonthStart((currentMonthStart) => addMonths(currentMonthStart, -1));
  }

  function goToNextPeriod() {
    if (view === "week") {
      setWeekStart((currentWeekStart) => addDays(currentWeekStart, 7));
      return;
    }

    setMonthStart((currentMonthStart) => addMonths(currentMonthStart, 1));
  }

  function goToCurrentPeriod() {
    const now = new Date();

    setWeekStart(startOfWeek(now));
    setMonthStart(startOfMonth(now));
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
                      Planning {view === "week" ? "hebdomadaire" : "mensuel"}
                    </div>

                    <h1>
                      {view === "week"
                        ? "Ta semaine, du premier pas au prochain sommet."
                        : "Ton mois, des rendez-vous aux grandes aventures."}
                    </h1>
                    <p className={styles.heroDescription}>
                      {view === "week"
                        ? "Retrouve tes sorties prévues et l’espace qui reste pour improviser une aventure."
                        : "Prends de la hauteur sur les sorties, courses et objectifs déjà inscrits à ton agenda."}
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
                  aria-label={`Résumé ${view === "week" ? "de la semaine" : "du mois"}`}
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
                    value={`${activeDays}/${periodDayCount}`}
                  />
                </div>
              </header>
            </FadeIn>

            <FadeIn delay={0.04}>
              <div
                className={styles.toolbar}
                aria-label="Navigation du planning"
              >
                <div className={styles.toolbarStart}>
                  <div className={styles.toolbarLabel}>
                    <span>Chapitre en cours</span>
                    <strong>
                      Choisir {view === "week" ? "la semaine" : "le mois"}
                    </strong>
                  </div>

                  <div
                    className={styles.viewSwitcher}
                    role="group"
                    aria-label="Affichage du planning"
                  >
                    <button
                      type="button"
                      aria-pressed={view === "week"}
                      onClick={() => changeView("week")}
                    >
                      Semaine
                    </button>
                    <button
                      type="button"
                      aria-pressed={view === "month"}
                      onClick={() => changeView("month")}
                    >
                      Mois
                    </button>
                  </div>
                </div>

                <div className={styles.weekNavigation}>
                  <button
                    type="button"
                    onClick={goToPreviousPeriod}
                    className={styles.iconButton}
                    aria-label={`Afficher ${view === "week" ? "la semaine" : "le mois"} précédent${view === "week" ? "e" : ""}`}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>

                  <div className={styles.weekLabel} aria-live="polite">
                    <span>
                      {view === "week" ? "Semaine affichée" : "Mois affiché"}
                    </span>
                    <strong>
                      {view === "week"
                        ? formatWeekTitle(weekStart, weekEnd)
                        : formatMonthTitle(monthStart)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={goToNextPeriod}
                    className={styles.iconButton}
                    aria-label={`Afficher ${view === "week" ? "la semaine suivante" : "le mois suivant"}`}
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={goToCurrentPeriod}
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
                    cette période.
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
                  aria-labelledby="planning-heading"
                >
                  <div className={styles.calendarHeading}>
                    <div>
                      <span className={styles.sectionEyebrow}>
                        <CalendarDays aria-hidden="true" />
                        Vue {view === "week" ? "semaine" : "mois"}
                      </span>
                      <h2 id="planning-heading">
                        {view === "week"
                          ? "Sept jours pour trouver ton rythme."
                          : "Tout le mois en un coup d’œil."}
                      </h2>
                    </div>
                    <p>
                      {visibleActivities.length} sortie
                      {visibleActivities.length > 1 ? "s" : ""} {view === "week" ? "cette semaine" : "ce mois-ci"}.
                      {view === "week"
                        ? " Chaque fiche garde sa place, même quand le terrain reste ouvert."
                        : " Les dates importantes restent visibles sans parcourir chaque semaine."}
                    </p>
                  </div>

                  {view === "week" ? (
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
                  ) : (
                    <MonthCalendar
                      monthStart={monthStart}
                      today={today}
                      days={monthActivitiesByDay}
                      monthActivities={monthActivities}
                    />
                  )}
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

function MonthCalendar({
  monthStart,
  today,
  days,
  monthActivities,
}: {
  monthStart: Date;
  today: Date;
  days: Array<{ day: Date; activities: Activity[] }>;
  monthActivities: Activity[];
}) {
  return (
    <div className={styles.monthCalendar}>
      <div className={styles.monthWeekdays} aria-hidden="true">
        {monthWeekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div
        className={styles.monthGrid}
        aria-label={`Calendrier de ${formatMonthTitle(monthStart)}`}
      >
        {days.map(({ day, activities: dayActivities }) => (
          <MonthDay
            key={day.toISOString()}
            day={day}
            today={today}
            currentMonth={monthStart}
            activities={dayActivities}
          />
        ))}
      </div>

      <div className={styles.monthAgenda} aria-label="Agenda du mois">
        <div className={styles.monthAgendaHeading}>
          <span>Agenda</span>
          <strong>{formatMonthTitle(monthStart)}</strong>
        </div>
        {monthActivities.length > 0 ? (
          monthActivities.map((activity) => {
            const status = getActivityStatus(activity);
            const StatusIcon = status.icon;

            return (
              <Link
                href={getActivityHref(activity)}
                className={styles.monthAgendaItem}
                key={activity.id}
              >
                <time dateTime={activity.startedAt}>
                  {shortDateFormatter.format(getActivityDate(activity))}
                </time>
                <span className={styles.monthAgendaIcon}>
                  <SportGlyph sport={activity.sport} />
                </span>
                <span className={styles.monthAgendaCopy}>
                  <strong>{activity.title ?? "Sortie sans titre"}</strong>
                  <small>
                    {timeFormatter.format(getActivityDate(activity))}
                    <span aria-hidden="true"> · </span>
                    {sportLabels[activity.sport] ?? activity.sport}
                  </small>
                </span>
                <span className={styles.monthAgendaStatus}>
                  <StatusIcon aria-hidden="true" />
                  {status.label}
                </span>
              </Link>
            );
          })
        ) : (
          <div className={styles.monthAgendaEmpty}>
            <Mountain aria-hidden="true" />
            <span>
              <strong>Le mois est encore ouvert.</strong>
              <small>Ajoute une date dès que ton prochain projet se précise.</small>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthDay({
  day,
  today,
  currentMonth,
  activities,
}: {
  day: Date;
  today: Date;
  currentMonth: Date;
  activities: Activity[];
}) {
  const isToday = isSameDay(day, today);
  const belongsToMonth = isSameMonth(day, currentMonth);
  const visibleActivities = activities.slice(0, 3);

  return (
    <article
      className={`${styles.monthDay} ${isToday ? styles.monthToday : ""} ${!belongsToMonth ? styles.monthOutside : ""}`}
      data-month-day={formatDateInput(day)}
      data-current-month={belongsToMonth ? "true" : "false"}
      aria-current={isToday ? "date" : undefined}
      aria-label={`${longDayFormatter.format(day)}${isToday ? ", aujourd’hui" : ""}`}
    >
      <div className={styles.monthDayHeader}>
        <time dateTime={formatDateInput(day)}>{day.getDate()}</time>
        <Link
          href={getPlanningHref(day)}
          className={styles.monthAddButton}
          aria-label={`Planifier une sortie le ${longDayFormatter.format(day)}`}
        >
          <Plus aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.monthDayActivities}>
        {visibleActivities.map((activity) => {
          const tone = getActivityStatus(activity).tone;
          const toneClass = {
            planned: styles.monthActivityPlanned,
            completed: styles.monthActivityCompleted,
            missed: styles.monthActivityMuted,
            canceled: styles.monthActivityMuted,
          }[tone];

          return (
            <Link
              key={activity.id}
              href={getActivityHref(activity)}
              className={`${styles.monthActivity} ${toneClass}`}
              title={`${timeFormatter.format(getActivityDate(activity))} — ${activity.title ?? "Sortie sans titre"}`}
            >
              <span aria-hidden="true" />
              <time>{timeFormatter.format(getActivityDate(activity))}</time>
              <strong>{activity.title ?? "Sortie sans titre"}</strong>
            </Link>
          );
        })}
        {activities.length > visibleActivities.length ? (
          <span className={styles.monthMore}>
            +{activities.length - visibleActivities.length} autre
            {activities.length - visibleActivities.length > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
    </article>
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
  const activityHref = getActivityHref(activity);
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
  const isUpcoming = activityDate.getTime() > now.getTime();
  const traceStateLabel = isUpcoming ? "À venir" : "En attente d’une trace";
  const traceStateDescription = isUpcoming
    ? `Prévue le ${longDayFormatter.format(activityDate)} à ${timeFormatter.format(activityDate)}`
    : "Elle apparaîtra dans Sorties dès qu’une trace Strava ou HOVREN lui sera associée.";

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
          <div
            className={styles.traceState}
            data-trace-state={isUpcoming ? "future" : "waiting"}
            title={traceStateDescription}
          >
            {isUpcoming ? (
              <Clock3 aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            <span>{traceStateLabel}</span>
          </div>
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
        </div>
      ) : null}
    </div>
  );
}
