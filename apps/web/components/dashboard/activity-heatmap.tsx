import {
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  Waves,
} from "lucide-react";

const heatmapData = [
  [
    {
      intensity: 1,
      type: "running",
    },
    {
      intensity: 2,
      type: "cycling",
    },
    {
      intensity: 0,
      type: null,
    },
    {
      intensity: 3,
      type: "hiking",
    },
    {
      intensity: 2,
      type: "gym",
    },
    {
      intensity: 1,
      type: "running",
    },
    {
      intensity: 0,
      type: null,
    },
  ],

  [
    {
      intensity: 0,
      type: null,
    },
    {
      intensity: 1,
      type: "swimming",
    },
    {
      intensity: 2,
      type: "running",
    },
    {
      intensity: 3,
      type: "cycling",
    },
    {
      intensity: 2,
      type: "gym",
    },
    {
      intensity: 1,
      type: "running",
    },
    {
      intensity: 1,
      type: "running",
    },
  ],

  [
    {
      intensity: 2,
      type: "hiking",
    },
    {
      intensity: 3,
      type: "cycling",
    },
    {
      intensity: 1,
      type: "running",
    },
    {
      intensity: 0,
      type: null,
    },
    {
      intensity: 0,
      type: null,
    },
    {
      intensity: 2,
      type: "gym",
    },
    {
      intensity: 3,
      type: "running",
    },
  ],

  [
    {
      intensity: 3,
      type: "hiking",
    },
    {
      intensity: 2,
      type: "running",
    },
    {
      intensity: 2,
      type: "cycling",
    },
    {
      intensity: 1,
      type: "swimming",
    },
    {
      intensity: 1,
      type: "running",
    },
    {
      intensity: 0,
      type: null,
    },
    {
      intensity: 2,
      type: "gym",
    },
  ],
];

const days = [
  "Lu",
  "Ma",
  "Me",
  "Je",
  "Ve",
  "Sa",
  "Di",
];

function getActivityIcon(
  type: string | null,
) {
  switch (type) {
    case "running":
      return Footprints;

    case "cycling":
      return Bike;

    case "hiking":
      return Mountain;

    case "swimming":
      return Waves;

    case "gym":
      return Dumbbell;

    default:
      return null;
  }
}

export function ActivityHeatmap() {
  return (
    <div className="group relative h-full min-h-[320px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">

      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_34%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.07),transparent_34%)]" />

      {/* TOP LIGHT */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%)]" />

      {/* INNER BORDER */}
      <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />

      {/* CONTENT */}
      <div className="relative">

        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between">

          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">
              Heatmap activité
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Activité des 30 derniers jours
            </p>
          </div>

          {/* STREAK CARD */}
          <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-5 py-4">

            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_45%)]" />

            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/16 to-transparent" />

            <p className="relative text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Série actuelle
            </p>

            <p className="relative mt-2 text-3xl font-bold tracking-tight text-white">
              6 jours
            </p>
          </div>
        </div>

        {/* DAYS */}
        <div className="mb-4 ml-14 flex gap-3">
          {days.map((day) => (
            <div
              key={day}
              className="flex h-9 w-9 items-center justify-center text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* HEATMAP */}
        <div className="overflow-x-auto">

          <div className="min-w-[560px] space-y-3">

            {heatmapData.map(
              (row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-center gap-3"
                >

                  {/* WEEK */}
                  <div className="w-10 text-sm font-medium text-zinc-500">
                    S{rowIndex + 1}
                  </div>

                  {/* CELLS */}
                  <div className="flex gap-3">

                    {row.map(
                      (
                        activity,
                        cellIndex,
                      ) => {
                        const Icon =
                          getActivityIcon(
                            activity.type,
                          );

                        return (
                          <div
                            key={cellIndex}
                            className={`
                              relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[12px] border transition-all duration-300 hover:scale-[1.06]

                              ${
                                activity.intensity ===
                                0
                                  ? "border-white/[0.05] bg-white/[0.025]"
                                  : activity.intensity ===
                                      1
                                    ? "border-violet-500/10 bg-violet-500/12"
                                    : activity.intensity ===
                                        2
                                      ? "border-violet-400/16 bg-violet-400/24"
                                      : "border-fuchsia-400/20 bg-gradient-to-br from-violet-400 to-fuchsia-400 shadow-[0_0_16px_rgba(168,85,247,0.28)]"
                              }
                            `}
                          >

                            {/* LIGHT */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_50%)]" />

                            {/* ICON */}
                            {Icon && (
                              <Icon
                                size={14}
                                className={`
                                  relative z-10

                                  ${
                                    activity.intensity ===
                                    1
                                      ? "text-violet-200/60"
                                      : activity.intensity ===
                                          2
                                        ? "text-violet-100/80"
                                        : "text-white"
                                  }
                                `}
                              />
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex items-center justify-between">

          <p className="text-sm text-zinc-500">
            Intensité des entraînements
          </p>

          {/* LEGEND */}
          <div className="flex items-center gap-4">

            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full border border-white/[0.06] bg-white/[0.03]" />

              <span className="text-xs text-zinc-500">
                Faible
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-violet-500/30" />

              <span className="text-xs text-zinc-500">
                Moyen
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />

              <span className="text-xs text-zinc-500">
                Élevé
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}