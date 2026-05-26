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
    <div className="min-w-0 rounded-[28px] border border-white/5 bg-zinc-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Activité hebdomadaire
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Distance parcourue cette semaine
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 px-4 py-2">
          <p className="text-sm text-zinc-400">
            Total
          </p>

          <p className="text-lg font-semibold text-white">
            61 km
          </p>
        </div>
      </div>

      <div className="mt-6 h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="#8b5cf6"
                stopOpacity={0.35}
              />

              <stop
                offset="100%"
                stopColor="#8b5cf6"
                stopOpacity={0}
              />
            </linearGradient>

            <filter id="purpleGlow">
              <feGaussianBlur stdDeviation="8" result="blur" />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                background: "#09090b",
                border: "1px solid #27272a",
                borderRadius: "16px",
                color: "#fff",
              }}
            />

            <Area
              type="monotone"
              dataKey="km"
              stroke="#a855f7"
              strokeWidth={3}
              fill="url(#colorKm)"
              filter="url(#purpleGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}