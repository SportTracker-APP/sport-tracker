"use client";

import dynamic from "next/dynamic";

const AreaChart = dynamic(
  async () => {
    const recharts = await import("recharts");

    return function Chart() {
      const {
        Area,
        AreaChart,
        CartesianGrid,
        Tooltip,
        XAxis,
      } = recharts;

      const data = [
        { day: "Lun", km: 4 },
        { day: "Mar", km: 8 },
        { day: "Mer", km: 0 },
        { day: "Jeu", km: 12 },
        { day: "Ven", km: 0 },
        { day: "Sam", km: 15 },
        { day: "Dim", km: 9 },
      ];

      return (
        <AreaChart
          width={900}
          height={320}
          data={data}
        >
          <defs>
            <linearGradient
              id="colorKm"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#8b5cf6"
                stopOpacity={0.42}
              />

              <stop
                offset="55%"
                stopColor="#a855f7"
                stopOpacity={0.14}
              />

              <stop
                offset="100%"
                stopColor="#8b5cf6"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "#71717a",
              fontSize: 12,
            }}
          />

          <Tooltip
            contentStyle={{
              background:
                "rgba(24,25,34,0.96)",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              color: "#fff",
            }}
          />

          <Area
            type="monotone"
            dataKey="km"
            stroke="#a855f7"
            strokeWidth={2.5}
            fill="url(#colorKm)"
            dot={false}
          />
        </AreaChart>
      );
    };
  },
  {
    ssr: false,
  },
);

export function WeeklyActivityChart() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-6">

      <div className="mb-8 flex items-center justify-between">

        <div>
          <h3 className="text-xl font-semibold text-white">
            Activité hebdomadaire
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Distance parcourue cette semaine
          </p>
        </div>

        <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.035] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Total
          </p>

          <p className="mt-1 text-2xl font-bold text-white">
            61 km
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <AreaChart />
      </div>
    </div>
  );
}