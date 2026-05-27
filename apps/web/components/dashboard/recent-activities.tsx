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
    <div className="group relative h-full min-h-[320px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">

      {/* AMBIENCE */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_32%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.06),transparent_32%)]" />

      {/* TOP LIGHT */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%)]" />

      {/* INNER BORDER */}
      <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />

      {/* CONTENT */}
      <div className="relative">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">

          {/* LEFT */}
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">
              Activités récentes
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Vos derniers entraînements
            </p>
          </div>

          {/* RIGHT ICON */}
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/[0.08] bg-white/[0.04]">

            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/16 to-transparent" />

            <Timer
              size={18}
              className="relative text-violet-300"
            />
          </div>
        </div>

        {/* ACTIVITIES */}
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div
                key={activity.title}
                className="group/item relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4 transition-all duration-300 hover:border-white/[0.10] hover:bg-white/[0.04]"
              >

                {/* CARD LIGHT */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.025),transparent_40%)]" />

                {/* COLOR AMBIENCE */}
                <div
                  className={`absolute inset-0 opacity-60 ${
                    activity.color === "violet"
                      ? "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_42%)]"
                      : activity.color === "sky"
                        ? "bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_42%)]"
                        : "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_42%)]"
                  }`}
                />

                {/* CONTENT */}
                <div className="relative flex items-center justify-between">

                  {/* LEFT */}
                  <div className="flex items-center gap-4">

                    {/* BAR */}
                    <div
                      className={`h-10 w-[3px] rounded-full ${
                        activity.color === "violet"
                          ? "bg-violet-400"
                          : activity.color === "sky"
                            ? "bg-sky-400"
                            : "bg-emerald-400"
                      }`}
                    />

                    {/* ICON */}
                    <div
                      className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/[0.08] bg-white/[0.04] transition-all duration-300 group-hover/item:scale-[1.03] ${
                        activity.color === "violet"
                          ? "text-violet-300"
                          : activity.color === "sky"
                            ? "text-sky-300"
                            : "text-emerald-300"
                      }`}
                    >

                      {/* ICON GLOW */}
                      <div
                        className={`absolute inset-0 ${
                          activity.color === "violet"
                            ? "bg-gradient-to-br from-violet-500/18 to-transparent"
                            : activity.color === "sky"
                              ? "bg-gradient-to-br from-sky-500/18 to-transparent"
                              : "bg-gradient-to-br from-emerald-500/18 to-transparent"
                        }`}
                      />

                      <Icon
                        size={18}
                        className="relative"
                      />
                    </div>

                    {/* TEXT */}
                    <div>
                      <p className="font-medium tracking-tight text-white">
                        {activity.title}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {activity.distance} • {activity.duration}
                      </p>
                    </div>
                  </div>

                  {/* DATE */}
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">
                      {activity.date}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}