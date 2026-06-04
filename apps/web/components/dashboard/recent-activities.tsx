import Link from "next/link";

import {
  Activity,
  ArrowUpRight,
  Bike,
  CalendarDays,
  Footprints,
  Mountain,
  Timer,
} from "lucide-react";

import type { Activity as SportActivity } from "@/lib/activities";

type RecentActivitiesProps = {
  activities: SportActivity[];
};

function getSportIcon(sport: string) {
  if (["ROAD_CYCLING", "GRAVEL", "MTB"].includes(sport)) {
    return Bike;
  }

  if (["HIKING", "WALKING"].includes(sport)) {
    return Footprints;
  }

  if (sport === "TRAIL") {
    return Mountain;
  }

  return Activity;
}

function getSportColor(sport: string) {
  if (["ROAD_CYCLING", "GRAVEL", "MTB"].includes(sport)) {
    return "sky";
  }

  if (["HIKING", "WALKING"].includes(sport)) {
    return "emerald";
  }

  return "violet";
}

function formatDistance(distance: number | null) {
  if (!distance) {
    return "Distance non renseignée";
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance)} km`;
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="group relative h-full min-h-[320px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_32%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.06),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%)]" />
      <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />

      <div className="relative">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">
              Activités récentes
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Vos derniers entraînements réels
            </p>
          </div>

          <div className="app-dashboard-green-icon relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/[0.08] bg-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/16 to-transparent" />
            <Timer size={18} className="relative text-violet-300" />
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-white/[0.08] bg-white/[0.025] p-6 text-sm text-zinc-500">
            Aucune activité récente à afficher.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = getSportIcon(activity.sport);
              const color = getSportColor(activity.sport);

              return (
                <Link
                  key={activity.id}
                  href={`/activites/${activity.id}`}
                  className="group/item relative block overflow-hidden rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4 transition-all duration-300 hover:border-white/[0.10] hover:bg-white/[0.04]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.025),transparent_40%)]" />
                  <div
                    className={`absolute inset-0 opacity-60 ${
                      color === "violet"
                        ? "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_42%)]"
                        : color === "sky"
                          ? "bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_42%)]"
                          : "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_42%)]"
                    }`}
                  />

                  <div className="relative">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`h-10 w-[3px] shrink-0 rounded-full ${
                          color === "violet"
                            ? "bg-violet-400"
                            : color === "sky"
                              ? "bg-sky-400"
                              : "bg-emerald-400"
                        }`}
                      />

                      <div
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-white/[0.08] bg-white/[0.04] ${
                          color === "violet"
                            ? "text-violet-300"
                            : color === "sky"
                              ? "text-sky-300"
                              : "text-emerald-300"
                        }`}
                      >
                        <Icon size={18} className="relative" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium tracking-tight text-white">
                          {activity.title || "Activité sans titre"}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-medium">
                          <span className="inline-flex items-center gap-1.5 text-zinc-500">
                            <CalendarDays className="h-3.5 w-3.5 text-emerald-300" />
                            {formatDate(activity.startedAt)}
                          </span>

                          <span className="inline-flex items-center gap-2 text-zinc-500 transition-colors group-hover/item:text-violet-200">
                            Voir le détail
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-zinc-400">
                          {formatDistance(activity.distance)} •{" "}
                          {formatDuration(activity.duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
