"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

const data = [
  { day: "Lun", km: 4 },
  { day: "Mar", km: 8 },
  { day: "Mer", km: 0 },
  { day: "Jeu", km: 12 },
  { day: "Ven", km: 0 },
  { day: "Sam", km: 15 },
  { day: "Dim", km: 9 },
];

export function WeeklyActivityChart() {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl transition-all duration-500">

      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_32%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.08),transparent_32%)]" />

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
              Activité hebdomadaire
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Distance parcourue cette semaine
            </p>
          </div>

          {/* RIGHT */}
          <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.035] px-4 py-3">

            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_50%)]" />

            <p className="relative text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Total
            </p>

            <p className="relative mt-1 text-2xl font-bold tracking-tight text-white">
              61 km
            </p>
          </div>
        </div>

        {/* CHART */}
        <div className="h-[320px] min-w-0">

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>

              <defs>

                {/* AREA */}
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

                {/* LINE GLOW */}
                <filter id="purpleGlow">
                  <feGaussianBlur
                    stdDeviation="6"
                    result="blur"
                  />

                  <feMerge>
                    <feMergeNode in="blur" />

                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* GRID */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              {/* X AXIS */}
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#71717a",
                  fontSize: 12,
                }}
              />

              {/* TOOLTIP */}
              <Tooltip
                cursor={{
                  stroke: "rgba(168,85,247,0.28)",
                  strokeWidth: 1,
                }}
                contentStyle={{
                  background: "rgba(24,25,34,0.96)",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.28)",
                }}
                labelStyle={{
                  color: "#a1a1aa",
                }}
              />

              {/* AREA */}
              <Area
                type="monotone"
                dataKey="km"
                stroke="#a855f7"
                strokeWidth={2.5}
                fill="url(#colorKm)"
                filter="url(#purpleGlow)"
                dot={{
                  r: 0,
                }}
                activeDot={{
                  r: 5,
                  fill: "#c084fc",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}