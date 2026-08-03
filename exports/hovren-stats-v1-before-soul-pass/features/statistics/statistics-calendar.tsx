import { CalendarDays } from "lucide-react";

import type { CalendarDay } from "./statistics-utils";
import styles from "./statistics.module.css";

function getIntensity(day: CalendarDay) {
  if (day.count === 0) {
    return 0;
  }

  if (day.elevation >= 1_000 || day.distance >= 20 || day.count >= 2) {
    return 3;
  }

  if (day.elevation >= 400 || day.distance >= 10) {
    return 2;
  }

  return 1;
}

export function StatisticsCalendar({ days }: { days: CalendarDay[] }) {
  const activeDays = days.filter((day) => day.count > 0).length;
  const firstDate = days[0]?.date;
  const lastDate = days.at(-1)?.date;
  const periodLabel =
    firstDate && lastDate
      ? `Du ${new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
        }).format(firstDate)} au ${new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
        }).format(lastDate)}`
      : "Quatre dernières semaines";

  return (
    <section className={styles.calendarPanel} aria-labelledby="rhythm-heading">
      <div className={styles.sectionHeadingCompact}>
        <span className={styles.eyebrow}>
          <CalendarDays aria-hidden="true" />
          Rythme d’exploration
        </span>
        <h2 id="rhythm-heading">Les jours où ton carnet a pris vie.</h2>
        <p>{periodLabel}</p>
      </div>

      <div className={styles.calendarGrid} role="list" aria-label={periodLabel}>
        {days.map((day) => {
          const intensity = getIntensity(day);
          const date = new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(day.date);
          const details =
            day.count > 0
              ? `${day.count} activité${day.count > 1 ? "s" : ""}, ${day.distance.toLocaleString(
                  "fr-FR",
                  { maximumFractionDigits: 1 },
                )} km, ${Math.round(day.elevation).toLocaleString("fr-FR")} m de dénivelé`
              : "aucune activité";

          return (
            <div
              key={day.dateKey}
              className={styles.calendarDay}
              data-intensity={intensity}
              role="listitem"
              title={`${date} : ${details}`}
              aria-label={`${date} : ${details}`}
            >
              {day.count > 0 ? <span aria-hidden="true">{day.count}</span> : null}
            </div>
          );
        })}
      </div>

      <div className={styles.calendarLegend}>
        <strong>{activeDays} jours actifs</strong>
        <span><i data-intensity="0" /> Repos</span>
        <span><i data-intensity="1" /> Trace légère</span>
        <span><i data-intensity="3" /> Journée marquante</span>
      </div>
    </section>
  );
}
