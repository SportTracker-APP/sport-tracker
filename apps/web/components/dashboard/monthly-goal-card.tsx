type MonthlyGoalCardProps = {
  current: number;
  target: number;
};

function formatDistance(distance: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance);
}

export function MonthlyGoalCard({ current, target }: MonthlyGoalCardProps) {
  const progress =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);

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
        {/* TOP */}
        <div className="flex items-start justify-between gap-5">
          {/* LEFT */}
          <div>
            <p className="text-sm font-medium text-zinc-400">
              Objectif 30 jours
            </p>

            <h3 className="mt-4 text-[44px] font-bold tracking-tight text-white">
              {formatDistance(current)} km
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              sur {formatDistance(target)} km en 30 jours
            </p>
          </div>

          {/* RIGHT CARD */}
          <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-5 py-4">
            {/* LIGHT */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_45%)]" />

            {/* GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/16 to-transparent" />

            <p className="relative text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              Progression
            </p>

            <p className="relative mt-2 text-3xl font-bold tracking-tight text-white">
              {progress}%
            </p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-10">
          {/* LABELS */}
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-zinc-500">0 km</span>

            <span className="text-zinc-400">{formatDistance(target)} km</span>
          </div>

          {/* BAR */}
          <div className="relative h-3 overflow-hidden rounded-full border border-white/[0.05] bg-white/[0.04]">
            {/* BAR LIGHT */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.025),transparent)]" />

            {/* PROGRESS */}
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-400 transition-all duration-1000"
              style={{
                width: `${progress}%`,
              }}
            >
              {/* SOFT GLOW */}
              <div className="absolute inset-0 shadow-[0_0_20px_rgba(168,85,247,0.35)]" />

              {/* SHINE */}
              <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-50" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="relative mt-8 overflow-hidden rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-5">
          {/* LIGHT */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.025),transparent_45%)]" />

          {/* AMBIENCE */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(139,92,246,0.10),transparent_40%)]" />

          <p className="relative text-sm leading-relaxed text-zinc-300">
            Encore{" "}
            <span className="font-semibold text-white">
              {formatDistance(remaining)} km
            </span>{" "}
            pour atteindre votre objectif des 30 derniers jours.
          </p>
        </div>
      </div>
    </div>
  );
}
