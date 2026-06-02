import { Activity as ActivityIcon, LucideIcon } from "lucide-react";

type ActivityCardProps = {
  title: string;
  type: string;
  sport: string;
  distance: number | null;
  duration: number;
  calories: number | null;
  date: string;
  icon?: LucideIcon;
};

export function ActivityCard({
  title,
  type,
  sport,
  distance,
  duration,
  calories,
  date,
  icon: Icon = ActivityIcon,
}: ActivityCardProps) {
  const formattedDuration =
    duration >= 60
      ? `${Math.floor(duration / 60)}h ${duration % 60}`
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

  const formattedCalories =
    calories === null
      ? "—"
      : new Intl.NumberFormat("fr-FR", {
          maximumFractionDigits: 0,
        }).format(calories);

  const sportLabel =
    {
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
    }[sport] || sport;

  return (
    <div className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        {/* Partie gauche */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-black/30 text-zinc-300 transition-colors group-hover:text-white">
            <Icon size={24} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">{title}</h3>

              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {sportLabel}
              </span>

              {type !== "TRAINING" && (
                <span className="rounded-full border border-zinc-800 bg-black/20 px-3 py-1 text-xs text-zinc-500">
                  {type}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <span>{formattedDistance} km</span>

              <span>{formattedDuration}</span>

              <span>{formattedCalories} Calories</span>
            </div>
          </div>
        </div>

        {/* Date */}
        <span className="text-sm text-zinc-500">{formattedDate}</span>
      </div>
    </div>
  );
}
