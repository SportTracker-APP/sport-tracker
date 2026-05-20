export function MonthlyGoalCard() {
  const progress = 74;

  return (
    <div className="h-full min-h-[320px] rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Objectif mensuel
          </p>

          <h3 className="mt-3 text-4xl font-bold text-white">
            312 km
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            sur 420 km ce mois-ci
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3">
          <p className="text-sm text-zinc-400">
            Progression
          </p>

          <p className="text-2xl font-bold text-white">
            {progress}%
          </p>
        </div>
      </div>

      {/* Barre progression */}
      <div className="mt-8">
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-zinc-500">
          <span>0 km</span>

          <span>420 km</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-black/20 p-4">
        <p className="text-sm text-zinc-400">
          Encore 108 km pour atteindre votre objectif.
        </p>
      </div>
    </div>
  );
}