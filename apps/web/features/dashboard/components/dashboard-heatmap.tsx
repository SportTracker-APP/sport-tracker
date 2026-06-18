import type { Activity as SportActivity } from "@/lib/activities";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import { getSportIcon } from "../utils/activity-calculations";
import {
  addDays,
  getLocalDateKey,
  startOfMonth,
  startOfWeek,
} from "../utils/date-format";
import { SurfaceHeader } from "./dashboard-surface-header";

export function ExplorationHeatmap({
  activities,
}: {
  activities: SportActivity[];
}) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const gridStart = startOfWeek(monthStart);
  const displayedDayCount = 28;
  const monthEndDay = Math.min(
    displayedDayCount,
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  );

  const activitiesByDay = new Map<string, SportActivity[]>();

  activities.forEach((activity) => {
    const key = getLocalDateKey(activity.startedAt);
    const dayActivities = activitiesByDay.get(key) ?? [];
    dayActivities.push(activity);
    activitiesByDay.set(key, dayActivities);
  });

  const cells = Array.from({ length: displayedDayCount }, (_, index) => {
    const day = addDays(gridStart, index);
    const isCurrentMonth = day.getMonth() === now.getMonth();
    const isInsideDisplayedMonthRange =
      isCurrentMonth && day.getDate() >= 1 && day.getDate() <= monthEndDay;
    const dayActivities = isInsideDisplayedMonthRange
      ? (activitiesByDay.get(getLocalDateKey(day)) ?? [])
      : [];
    const totalDuration = dayActivities.reduce(
      (total, activity) => total + activity.duration,
      0,
    );
    const intensity =
      dayActivities.length === 0
        ? 0
        : totalDuration < 45
          ? 1
          : totalDuration < 120
            ? 2
            : 3;
    const firstActivity = dayActivities[0] ?? null;
    const Icon = firstActivity ? getSportIcon(firstActivity.sport) : null;
    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(day);

    return {
      id: getLocalDateKey(day),
      day,
      intensity,
      Icon,
      isInsideDisplayedMonthRange,
      title:
        dayActivities.length > 0
          ? `${formattedDate} — ${dayActivities.length} ${
              dayActivities.length === 1 ? "sortie" : "sorties"
            }`
          : formattedDate,
    };
  });

  return (
    <div className={styles.heatmap}>
      <div className={styles.heatmapWeekdays}>
        {["LU", "MA", "ME", "JE", "VE", "SA", "DI"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles.heatmapBody}>
        {[0, 1, 2, 3].map((week) => (
          <div className={styles.heatmapRow} key={week}>
            <span className={styles.heatmapWeek}>S{week + 1}</span>
            {cells.slice(week * 7, week * 7 + 7).map((cell) => {
              const Icon = cell.Icon;

              return (
                <div
                  className={`${styles.heatmapCell} ${styles[`heatmapLevel${cell.intensity}`]} ${
                    cell.isInsideDisplayedMonthRange
                      ? ""
                      : styles.heatmapOutsideMonth
                  }`}
                  key={cell.id}
                  title={cell.title}
                  aria-label={cell.title}
                >
                  {Icon ? <Icon aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.heatmapLegend}>
        <span>Charge réelle par jour</span>
        <span>
          <i className={styles.legendRest} />
          Repos
        </span>
        <span>
          <i className={styles.legendLow} />
          Courte
        </span>
        <span>
          <i className={styles.legendMedium} />
          Soutenue
        </span>
        <span>
          <i className={styles.legendHigh} />
          Longue
        </span>
      </div>
    </div>
  );
}

export function DashboardHeatmap({
  description,
  monthLabel,
  activities,
}: {
  description: string;
  monthLabel: string;
  activities: SportActivity[];
}) {
  return (
    <div className={styles.heatmapPanelWrap}>
      <FadeIn delay={0.46}>
        <div className={`${styles.surface} ${styles.heatmapPanel}`}>
          <SurfaceHeader
            title="Rythme d’exploration"
            description={description}
            action={
              <span className={styles.monthBadge}>
                {monthLabel} · 4 semaines
              </span>
            }
          />
          <ExplorationHeatmap activities={activities} />
        </div>
      </FadeIn>
    </div>
  );
}
