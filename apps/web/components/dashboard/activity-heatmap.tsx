const heatmapData = [
  [1, 2, 0, 3, 2, 1, 0],
  [0, 1, 2, 3, 2, 1, 1],
  [2, 3, 1, 0, 0, 2, 3],
  [3, 2, 2, 1, 1, 0, 2],
];

const days = ["L", "M", "M", "J", "V", "S", "D"];

export function ActivityHeatmap() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Heatmap activité
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Activité des 30 derniers jours
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3">
          <p className="text-sm text-zinc-400">
            Série actuelle
          </p>

          <p className="text-2xl font-bold text-white">
            6 jours
          </p>
        </div>
      </div>

      {/* Jours semaine */}
      <div className="mb-4 ml-16 flex gap-3">
        {days.map((day) => (
          <div
            key={day}
            className="flex h-10 w-10 items-center justify-center text-sm text-zinc-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-[620px] space-y-3">
        {heatmapData.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-3"
          >
            {/* Label semaine */}
            <div className="w-12 text-sm text-zinc-500">
              S{rowIndex + 1}
            </div>

            {/* Cases */}
            <div className="flex gap-3">
              {row.map((value, cellIndex) => (
                <div
                  key={cellIndex}
                  className={`
                    h-10 w-10 rounded-xl border border-zinc-800 transition-all duration-300 hover:scale-105
                    ${
                      value === 0
                        ? "bg-zinc-900"
                        : value === 1
                          ? "bg-zinc-700"
                          : value === 2
                            ? "bg-zinc-500"
                            : "bg-white"
                    }
                  `}
                />
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Intensité des entraînements
        </p>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-zinc-800" />

          <div className="h-3 w-3 rounded-full bg-zinc-700" />

          <div className="h-3 w-3 rounded-full bg-zinc-500" />

          <div className="h-3 w-3 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}