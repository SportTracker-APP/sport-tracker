import {
  Bike,
  Footprints,
  Mountain,
  Timer,
} from "lucide-react";

const activities = [
  {
    title: "Course matinale",
    distance: "8.4 km",
    duration: "42 min",
    date: "Aujourd’hui",
    icon: Footprints,
    color: "violet",
  },
  {
    title: "Sortie vélo",
    distance: "36 km",
    duration: "1h52",
    date: "Hier",
    icon: Bike,
    color: "sky",
  },
  {
    title: "Trail forêt",
    distance: "14 km",
    duration: "1h24",
    date: "Samedi",
    icon: Mountain,
    color: "emerald",
  },
];

export function RecentActivities() {
  return (
    <div className="h-full min-h-[320px] rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white">
            Activités récentes
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Vos derniers entraînements
          </p>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
          <Timer
            size={20}
            className="text-violet-400"
          />
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div
              key={activity.title}
              className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/20 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-zinc-900/80"
            >
              <div className="flex items-center gap-4">
                {/* Colored left bar */}
                <div
                  className={`h-12 w-1 rounded-full ${
                    activity.color === "violet"
                      ? "bg-violet-500"
                      : activity.color === "sky"
                        ? "bg-sky-500"
                        : "bg-emerald-500"
                  }`}
                />

                {/* Icon */}
                <div
                  className={`rounded-2xl border p-3 transition-all duration-300 group-hover:scale-105 ${
                    activity.color === "violet"
                      ? "border-violet-500/20 bg-violet-500/10 text-violet-400"
                      : activity.color === "sky"
                        ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  <Icon size={20} />
                </div>

                {/* Content */}
                <div>
                  <p className="font-medium text-white">
                    {activity.title}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {activity.distance} • {activity.duration}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="text-right">
                <p className="text-sm text-zinc-500">
                  {activity.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}