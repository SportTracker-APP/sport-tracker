import {
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  Waves,
} from "lucide-react";

import type { Activity as SportActivity } from "@/lib/activities";

type ActivityHeatmapProps = {
  activities?: SportActivity[];
};

const days = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

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

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getActivityIcon(type: string | null) {
  switch (type) {
    case "RUNNING":
      return Footprints;

    case "MTB":
    case "ROAD_CYCLING":
    case "GRAVEL":
      return Bike;

    case "HIKING":
    case "TRAIL":
      return Mountain;

    case "SWIMMING":
      return Waves;

    case "GYM":
    case "FITNESS":
      return Dumbbell;

    default:
      return Activity;
  }
}

function getCurrentStreak(activities: SportActivity[]) {
  const activeDays = new Set(
    activities.map((activity) => getDateKey(new Date(activity.startedAt))),
  );
  const cursor = new Date();
  let streak = 0;

  while (activeDays.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function ActivityHeatmap({ activities = [] }: ActivityHeatmapProps) {
  const today = new Date();
  const currentWeekStart = startOfWeek(today);
  const heatmapStart = addDays(currentWeekStart, -21);
  const currentStreak = getCurrentStreak(activities);

  const rows = Array.from({
    length: 4,
  }).map((_, weekIndex) =>
    Array.from({
      length: 7,
    }).map((__, dayIndex) => {
      const day = addDays(heatmapStart, weekIndex * 7 + dayIndex);
      const dayActivities = activities.filter(
        (activity) =>
          getDateKey(new Date(activity.startedAt)) === getDateKey(day),
      );
      const totalDistance = dayActivities.reduce(
        (total, activity) => total + (activity.distance || 0),
        0,
      );
      const intensity =
        dayActivities.length === 0
          ? 0
          : totalDistance >= 20
            ? 3
            : totalDistance >= 8
              ? 2
              : 1;

      return {
        date: day,
        intensity,
        type: dayActivities[0]?.sport || null,
      };
    }),
  );

  return (
    <div className="group relative h-full min-h-[320px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.07),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%)]" />
      <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />

      <div className="relative">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">
              Heatmap activité
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Activité réelle des 28 derniers jours
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-5 py-4">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_45%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/16 to-transparent" />

            <p className="relative text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              Série actuelle
            </p>

            <p className="relative mt-2 text-3xl font-bold tracking-tight text-white">
              {currentStreak} jour{currentStreak > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mb-4 ml-14 flex gap-3">
          {days.map((day) => (
            <div
              key={day}
              className="flex h-9 w-9 items-center justify-center text-[11px] font-medium tracking-[0.12em] text-zinc-500 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[560px] space-y-3">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-3">
                <div className="w-10 text-sm font-medium text-zinc-500">
                  S{rowIndex + 1}
                </div>

                <div className="flex gap-3">
                  {row.map((activity) => {
                    const Icon = getActivityIcon(activity.type);

                    return (
                      <div
                        key={getDateKey(activity.date)}
                        className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[12px] border transition-all duration-300 hover:scale-[1.06] ${
                          activity.intensity === 0
                            ? "border-white/[0.05] bg-white/[0.025]"
                            : activity.intensity === 1
                              ? "border-violet-500/10 bg-violet-500/12"
                              : activity.intensity === 2
                                ? "border-violet-400/16 bg-violet-400/24"
                                : "border-fuchsia-400/20 bg-gradient-to-br from-violet-400 to-fuchsia-400 shadow-[0_0_16px_rgba(168,85,247,0.28)]"
                        }`}
                        title={new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "long",
                        }).format(activity.date)}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_50%)]" />

                        {activity.intensity > 0 && (
                          <Icon
                            size={14}
                            className={`relative z-10 ${
                              activity.intensity === 1
                                ? "text-violet-200/60"
                                : activity.intensity === 2
                                  ? "text-violet-100/80"
                                  : "text-white"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-zinc-500">Intensité des entraînements</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full border border-white/[0.06] bg-white/[0.03]" />
              <span className="text-xs text-zinc-500">Repos</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-violet-500/30" />
              <span className="text-xs text-zinc-500">Moyen</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
              <span className="text-xs text-zinc-500">Élevé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
