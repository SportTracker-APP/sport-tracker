import {
  Activity as ActivityIcon,
  ArrowUpRight,
  CalendarDays,
  Flame,
  LucideIcon,
  MapPin,
  Timer,
} from "lucide-react";
import Link from "next/link";

import { MiniRouteMap } from "./mini-route-map";

type ActivityCardProps = {
  id: string;
  title: string;
  type: string;
  sport: string;
  distance: number | null;
  duration: number;
  calories: number | null;
  routePolyline: string | null;
  date: string;
  icon?: LucideIcon;
};

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
  SKI: "Ski",
  SNOWBOARD: "Snowboard",
  CLIMBING: "Escalade",
};

function getDisplayCalories({
  calories,
  distance,
  duration,
  sport,
}: {
  calories: number | null;
  distance: number | null;
  duration: number;
  sport: string;
}) {
  const distanceKm = distance ?? 0;
  const durationHours = duration / 60;
  const sportFactors: Record<string, number> = {
    RUNNING: 70,
    TRAIL: 78,
    HIKING: 58,
    WALKING: 48,
    MTB: 38,
    ROAD_CYCLING: 32,
    GRAVEL: 34,
  };
  const distanceEstimate =
    distanceKm > 0 ? distanceKm * (sportFactors[sport] ?? 55) : 0;
  const durationEstimate =
    durationHours > 0 ? durationHours * (sport === "TRAIL" ? 520 : 420) : 0;
  const estimatedCalories = Math.round(
    Math.max(distanceEstimate, durationEstimate),
  );

  if (!calories || calories <= 0) {
    return estimatedCalories > 0 ? estimatedCalories : null;
  }

  if (
    ["RUNNING", "TRAIL", "HIKING", "WALKING"].includes(sport) &&
    estimatedCalories > 0 &&
    calories < estimatedCalories * 0.45
  ) {
    return estimatedCalories;
  }

  return calories;
}

export function ActivityCard({
  id,
  title,
  type,
  sport,
  distance,
  duration,
  calories,
  routePolyline,
  date,
  icon: Icon = ActivityIcon,
}: ActivityCardProps) {
  const formattedDuration =
    duration >= 60
      ? `${Math.floor(duration / 60)}H${String(duration % 60).padStart(2, "0")}`
      : `${duration} min`;

  const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedDistance =
    distance === null
      ? "0"
      : new Intl.NumberFormat("fr-FR", {
          maximumFractionDigits: 2,
        }).format(distance);

  const displayCalories = getDisplayCalories({
    calories,
    distance,
    duration,
    sport,
  });

  const formattedCalories =
    displayCalories === null
      ? "—"
      : new Intl.NumberFormat("fr-FR", {
          maximumFractionDigits: 0,
        }).format(displayCalories);

  const sportLabel = sportLabels[sport] || sport;

  return (
    <Link
      href={`/activites/${id}`}
      className="app-activity-card group relative block w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#171922]/92 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-[#1b1d28]/95 focus:ring-2 focus:ring-violet-400/60 focus:outline-none"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_34%)] opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_30%)]" />

      <div className="relative grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-4">
            <div className="app-activity-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-violet-300 transition-colors group-hover:text-white">
              <Icon size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="app-activity-badge rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                  {sportLabel}
                </span>

                {type !== "TRAINING" && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                    {type}
                  </span>
                )}
              </div>

              <h3 className="mt-3 line-clamp-2 text-lg leading-snug font-semibold tracking-tight text-white">
                {title}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 text-zinc-500">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-300" />
                  {formattedDate}
                </span>

                <span className="inline-flex items-center gap-2 text-zinc-500 transition-colors group-hover:text-violet-200">
                  Voir le détail
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="app-activity-metric rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <MapPin className="h-3.5 w-3.5 text-sky-300" />
                Distance
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                {formattedDistance} km
              </p>
            </div>

            <div className="app-activity-metric rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Timer className="h-3.5 w-3.5 text-violet-300" />
                Durée
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                {formattedDuration}
              </p>
            </div>

            <div className="app-activity-metric rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Flame className="h-3.5 w-3.5 text-orange-300" />
                Calories
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                {formattedCalories}
              </p>
            </div>
          </div>
        </div>

        <div className="app-activity-map-frame relative flex items-center">
          <MiniRouteMap polyline={routePolyline} />
        </div>
      </div>
    </Link>
  );
}
