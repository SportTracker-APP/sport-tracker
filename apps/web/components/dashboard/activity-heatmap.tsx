const heatmapData = [
  [1, 2, 0, 3, 2, 1, 0],
  [0, 1, 2, 3, 2, 1, 1],
  [2, 3, 1, 0, 0, 2, 3],
  [3, 2, 2, 1, 1, 0, 2],
];

export function ActivityHeatmap() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white">
          Heatmap activité
        </h3>

        <p className="mt-1 text-sm text-zinc-400">
          Intensité des entraînements
        </p>
      </div>

      <div className="space-y-3">
        {heatmapData.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-3"
          >
            {row.map((value, cellIndex) => (
              <div
                key={cellIndex}
                className={`
                  h-10 w-10 rounded-xl border border-zinc-800 transition-all
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
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between text-sm text-zinc-500">
        <span>Faible</span>

        <span>Intense</span>
      </div>
    </div>
  );
}