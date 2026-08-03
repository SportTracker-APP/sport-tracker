"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bike,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  Mountain,
} from "lucide-react";

import type { Activity as SportActivity } from "@/lib/activities";

import type { CalendarDay } from "./statistics-utils";
import { getCalendarMonthDays, getSportLabel } from "./statistics-utils";
import styles from "./statistics.module.css";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getIntensity(day: CalendarDay) {
  if (day.count === 0) return 0;
  if (day.elevation >= 1_000 || day.distance >= 20 || day.count >= 2) return 3;
  if (day.elevation >= 400 || day.distance >= 10) return 2;
  return 1;
}

function CalendarSportIcon({ sport }: { sport: string }) {
  if (sport === "MTB" || sport === "ROAD_CYCLING" || sport === "GRAVEL") return <Bike />;
  if (sport === "FITNESS") return <Dumbbell />;
  if (sport === "HIKING" || sport === "WALKING") return <Footprints />;
  if (sport === "TRAIL") return <Mountain />;
  return <Activity />;
}

function getDateKey(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function getMonthKey(value: Date) {
  return value.getFullYear() * 12 + value.getMonth();
}

export function StatisticsCalendar({
  activities,
}: {
  activities: SportActivity[];
}) {
  const currentMonth = useMemo(() => startOfMonth(new Date()), []);
  const earliestMonth = useMemo(() => {
    const earliestActivity = activities.reduce<Date | null>((earliest, activity) => {
      const activityDate = new Date(activity.startedAt);

      return !earliest || activityDate < earliest ? activityDate : earliest;
    }, null);

    return earliestActivity ? startOfMonth(earliestActivity) : currentMonth;
  }, [activities, currentMonth]);
  const [monthOffset, setMonthOffset] = useState(0);
  const visibleMonth = useMemo(
    () => addMonths(currentMonth, monthOffset),
    [currentMonth, monthOffset],
  );
  const days = useMemo(
    () => getCalendarMonthDays(activities, visibleMonth),
    [activities, visibleMonth],
  );
  const activeDays = days.filter(
    (day) =>
      day.date.getMonth() === visibleMonth.getMonth() &&
      day.date.getFullYear() === visibleMonth.getFullYear() &&
      day.count > 0,
  ).length;
  const weekCount = days.length / 7;
  const periodLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const canGoPrevious = getMonthKey(visibleMonth) > getMonthKey(earliestMonth);
  const canGoNext = monthOffset < 0;
  const todayKey = getDateKey(new Date());

  return (
    <section className={styles.calendarPanel} aria-labelledby="rhythm-heading">
      <div className={styles.sectionHeadingCompact}>
        <span className={styles.eyebrow}>
          <CalendarDays aria-hidden="true" />
          Rythme d’exploration
        </span>
        <h2 id="rhythm-heading">Ton mois outdoor.</h2>
      </div>

      <div className={styles.calendarWeekNavigation}>
        <button
          type="button"
          aria-label="Voir le mois précédent"
          title="Mois précédent"
          disabled={!canGoPrevious}
          onClick={() => setMonthOffset((current) => current - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <div aria-live="polite" data-testid="statistics-calendar-month">
          <strong>{periodLabel}</strong>
          <span>{weekCount} semaines · lundi à dimanche</span>
        </div>
        <button
          type="button"
          aria-label="Voir le mois suivant"
          title="Mois suivant"
          disabled={!canGoNext}
          onClick={() => setMonthOffset((current) => Math.min(0, current + 1))}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className={styles.calendarWeekdays} aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className={styles.calendarGrid} role="list" aria-label={periodLabel}>
        {days.map((day) => {
          const intensity = getIntensity(day);
          const isOutsideMonth = day.date.getMonth() !== visibleMonth.getMonth();
          const date = new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(day.date);
          const details = day.count > 0
            ? `${day.count} activité${day.count > 1 ? "s" : ""}, ${day.distance.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km, ${Math.round(day.elevation).toLocaleString("fr-FR")} m de dénivelé`
            : "aucune activité";

          return (
            <div key={day.dateKey} className={styles.calendarDayWrap} role="listitem">
              <button
                type="button"
                className={styles.calendarDay}
                data-intensity={intensity}
                data-today={day.dateKey === todayKey || undefined}
                data-outside-month={isOutsideMonth || undefined}
                aria-label={`${date} : ${details}`}
              >
                <span className={styles.calendarDate} aria-hidden="true">{day.date.getDate()}</span>
                {day.sports.length > 0 ? (
                  <span className={styles.calendarSports} aria-hidden="true">
                    {day.sports.slice(0, 2).map((sport) => (
                      <CalendarSportIcon key={sport} sport={sport} />
                    ))}
                  </span>
                ) : null}
                {day.count > 1 ? <strong aria-hidden="true">{day.count}</strong> : null}
              </button>
              {day.count > 0 ? (
                <div className={styles.calendarTooltip} role="tooltip">
                  <span>{date}</span>
                  {day.activities.slice(0, 3).map((activity) => (
                    <div key={activity.id}>
                      <strong>{activity.title?.trim() || getSportLabel(activity.sport)}</strong>
                      <small>
                        {getSportLabel(activity.sport)} · {(activity.distance ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km · {Math.round(activity.elevationGain ?? 0).toLocaleString("fr-FR")} m D+
                      </small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={styles.calendarLegend}>
        <strong>{activeDays} jour{activeDays > 1 ? "s" : ""} actif{activeDays > 1 ? "s" : ""}</strong>
        <span><i data-intensity="0" /> Repos</span>
        <span><i data-intensity="1" /> Sortie</span>
        <span><i data-intensity="3" /> Marquante</span>
      </div>
    </section>
  );
}
