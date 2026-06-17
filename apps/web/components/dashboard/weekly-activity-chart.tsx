"use client";

type WeeklyChartPoint = {
  day: string;
  km: number;
};

type WeeklyActivityChartProps = {
  data?: WeeklyChartPoint[];
  totalDistance?: number;
};

function formatDistance(distance: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance);
}

function getBarTone(km: number, maxDistance: number) {
  if (km === 0) {
    return "from-white/[0.045] to-white/[0.025]";
  }

  if (km >= maxDistance * 0.75) {
    return "from-fuchsia-400 to-violet-500 shadow-[0_0_26px_rgba(168,85,247,0.30)]";
  }

  if (km >= maxDistance * 0.35) {
    return "from-violet-400 to-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.20)]";
  }

  return "from-sky-400 to-violet-500 shadow-[0_0_16px_rgba(56,189,248,0.16)]";
}

export function WeeklyActivityChart({
  data = [],
  totalDistance = 0,
}: WeeklyActivityChartProps) {
  const activeDays = data.filter((point) => point.km > 0);
  const maxDistance = Math.max(...data.map((point) => point.km), 0);
  const bestDay = activeDays.reduce<WeeklyChartPoint | null>(
    (best, point) => (!best || point.km > best.km ? point : best),
    null,
  );

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%)]" />

      <div className="relative">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Activité sur 30 jours
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Vos sorties réelles, jour par jour.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-3 py-3">
              <p className="text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                Total
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {formatDistance(totalDistance)} km
              </p>
            </div>

            <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-3 py-3">
              <p className="text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                Jours actifs
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {activeDays.length}
              </p>
            </div>

            <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-3 py-3">
              <p className="text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                Meilleure
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {bestDay ? `${formatDistance(bestDay.km)} km` : "—"}
              </p>
            </div>
          </div>
        </div>

        {activeDays.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-black/15 p-4">
              <div
                className="grid h-[240px] min-w-0 items-end gap-1.5 sm:gap-2"
                style={
                  {
                    gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
                  } as React.CSSProperties
                }
              >
                {data.map((point, index) => {
                  const height =
                    maxDistance > 0
                      ? Math.max(10, Math.round((point.km / maxDistance) * 100))
                      : 0;
                  const showLabel =
                    index === 0 ||
                    index === data.length - 1 ||
                    index % 5 === 0 ||
                    point.km === maxDistance;

                  return (
                    <div
                      key={`${point.day}-${index}`}
                      className="group/bar flex h-full min-w-0 flex-col items-center justify-end gap-2"
                    >
                      <div className="relative flex h-full w-full items-end justify-center">
                        {point.km > 0 && (
                          <div className="pointer-events-none absolute bottom-[calc(var(--bar-height)+10px)] left-1/2 z-20 hidden min-w-max -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-[#101118]/95 px-3 py-2 text-xs text-white shadow-2xl group-hover/bar:block">
                            <span className="font-semibold">{point.day}</span>
                            <span className="ml-2 text-violet-300">
                              {formatDistance(point.km)} km
                            </span>
                          </div>
                        )}

                        <div
                          className={`w-full rounded-t-full bg-gradient-to-t transition-all duration-300 group-hover/bar:scale-y-[1.04] ${getBarTone(
                            point.km,
                            maxDistance,
                          )}`}
                          style={
                            {
                              height: `${height}%`,
                              "--bar-height": `${height}%`,
                              opacity: point.km === 0 ? 0.55 : 1,
                            } as React.CSSProperties
                          }
                        />
                      </div>

                      <span
                        className={`h-4 text-[10px] ${
                          showLabel ? "text-zinc-500" : "text-transparent"
                        }`}
                      >
                        {point.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {bestDay && (
              <p className="mt-4 text-sm text-zinc-500">
                Pic d’activité le{" "}
                <span className="font-semibold text-zinc-300">
                  {bestDay.day}
                </span>
                , avec{" "}
                <span className="font-semibold text-violet-300">
                  {formatDistance(bestDay.km)} km
                </span>
                .
              </p>
            )}
          </>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.02] text-sm text-zinc-500">
            Aucune distance enregistrée sur les 30 derniers jours.
          </div>
        )}
      </div>
    </div>
  );
}
