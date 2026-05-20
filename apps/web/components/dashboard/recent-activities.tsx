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
  },
  {
    title: "Sortie vélo",
    distance: "36 km",
    duration: "1h52",
    date: "Hier",
    icon: Bike,
  },
  {
    title: "Trail forêt",
    distance: "14 km",
    duration: "1h24",
    date: "Samedi",
    icon: Mountain,
  },
];

export function RecentActivities() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Activités récentes
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Vos derniers entraînements
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3">
          <Timer
            size={20}
            className="text-zinc-300"
          />
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div
              key={activity.title}
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/20 p-4 transition-colors hover:border-zinc-700 hover:bg-black/30"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <Icon
                    size={20}
                    className="text-zinc-300"
                  />
                </div>

                <div>
                  <p className="font-medium text-white">
                    {activity.title}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {activity.distance} • {activity.duration}
                  </p>
                </div>
              </div>

              <p className="text-sm text-zinc-500">
                {activity.date}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}