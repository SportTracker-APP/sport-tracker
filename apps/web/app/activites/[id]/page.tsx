"use client";

import Link from "next/link";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

import {
  ArrowLeft,
  Calendar,
  Flame,
  Gauge,
  HeartPulse,
  MapPin,
  Mountain,
  Timer,
  TrendingDown,
  Zap,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const elevationData = [
  { distance: 0, elevation: 540, grade: 2 },
  { distance: 0.5, elevation: 620, grade: 4 },
  { distance: 1, elevation: 710, grade: 6 },
  { distance: 1.5, elevation: 820, grade: 8 },
  { distance: 2, elevation: 940, grade: 10 },
  { distance: 2.5, elevation: 980, grade: 7 },
  { distance: 3, elevation: 960, grade: 5 },
  { distance: 3.5, elevation: 1040, grade: 11 },
  { distance: 4, elevation: 1180, grade: 14 },
  { distance: 4.2, elevation: 1240, grade: 15 },
  { distance: 4.5, elevation: 1190, grade: 12 },
  { distance: 5, elevation: 1080, grade: 8 },
  { distance: 5.5, elevation: 1010, grade: 6 },
  { distance: 6, elevation: 960, grade: 5 },
  { distance: 6.5, elevation: 910, grade: 4 },
  { distance: 7, elevation: 860, grade: 3 },
  { distance: 7.5, elevation: 820, grade: 5 },
  { distance: 8, elevation: 660, grade: 9 },
  { distance: 8.42, elevation: 540, grade: 3 },
];

const stats = [
  {
    title: "Allure moyenne",
    value: "5:02/km",
    subtitle: "Max 3:48/km",
    icon: Timer,
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
  },
  {
    title: "Vitesse moyenne",
    value: "11.9 km/h",
    subtitle: "Max 15.8 km/h",
    icon: Gauge,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    title: "Fréq. cardiaque",
    value: "148 bpm",
    subtitle: "Max 178 bpm",
    icon: HeartPulse,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    title: "Puissance",
    value: "242 w",
    subtitle: "Max 412 w",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
];

type ActivityPageProps = {
  params: {
    id: string;
  };
};

export default function ActivityDetailsPage({
  params,
}: ActivityPageProps) {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Retour */}
        <Link
          href="/activites"
          className="inline-flex items-center gap-2 pl-1 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux activités
        </Link>

        {/* Header */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-3 xl:p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            {/* Left */}
            <div>
              <div className="inline-flex items-center rounded-full border border-lime-500/20 bg-lime-500/10 px-3 py-1 text-sm font-medium text-lime-400">
                Trail running
              </div>

              <h1 className="mt-2 text-[30px] font-bold tracking-tight text-white xl:text-[34px]">
                Course matinale
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Chamonix, France
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Aujourd’hui à 07:12
                </div>
              </div>

              <p className="mt-3 text-sm text-zinc-500">
                Saucony Endorphin Pro 3
              </p>
            </div>

            {/* Stats top */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Distance
                </p>

                <p className="mt-2 text-[25px] font-bold text-white">
                  8.42
                </p>

                <span className="text-sm text-zinc-500">km</span>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Durée
                </p>

                <p className="mt-2 text-[25px] font-bold text-white">
                  42:18
                </p>

                <span className="text-sm text-zinc-500">min</span>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Calories
                </p>

                <p className="mt-2 text-[25px] font-bold text-white">
                  560
                </p>

                <span className="text-sm text-zinc-500">kcal</span>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  D+
                </p>

                <p className="mt-2 text-[25px] font-bold text-lime-400">
                  420
                </p>

                <span className="text-sm text-zinc-500">m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Elevation section */}
        <div className="grid gap-4 xl:grid-cols-[1.65fr_260px]">
          {/* Graph */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Profil d’élévation
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Analyse du parcours et du dénivelé.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Altitude max
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  1240m
                </p>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={elevationData}
                  margin={{
                    top: 10,
                    right: 12,
                    left: 18,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="elevationGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#84cc16"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="#84cc16"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <filter id="glow">
                      <feGaussianBlur
                        stdDeviation="6"
                        result="coloredBlur"
                      />

                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    opacity={0.35}
                  />

                  <XAxis
                    dataKey="distance"
                    stroke="#71717a"
                    tickFormatter={(value) => `${value} km`}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />

                  <YAxis
                    width={60}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 1400]}
                    ticks={[0, 350, 700, 1050, 1400]}
                    tickFormatter={(value) => `${value}m`}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: "14px",
                      color: "#fff",
                    }}
                  />

                  <Area
                    type="natural"
                    dataKey="elevation"
                    stroke="#84cc16"
                    strokeWidth={3}
                    fill="url(#elevationGradient)"
                    fillOpacity={1}
                    filter="url(#glow)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Gradient de pente */}
            <div className="mt-8 px-2">
            <div className="mb-3 flex items-center justify-between">
                <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Lecture de pente
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                    Répartition visuelle des portions du parcours.
                </p>
                </div>

                <div className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-[11px] text-zinc-400">
                Pente moyenne 6.2%
                </div>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full border border-zinc-800/80 bg-zinc-950">
                <div className="flex h-full w-full">
                <div className="w-[18%] bg-lime-400" />
                <div className="w-[24%] bg-yellow-400" />
                <div className="w-[16%] bg-orange-400" />
                <div className="w-[12%] bg-red-500" />
                <div className="w-[20%] bg-yellow-400" />
                <div className="w-[10%] bg-lime-400" />
                </div>
            </div>

                <div className="mt-4 flex flex-wrap items-center gap-5 text-[11px] text-zinc-500">
                    <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.7)]" />
                    <span>Pente légère &lt; 5%</span>
                    </div>

                    <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                    <span>Montée modérée 5–10%</span>
                    </div>

                    <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.7)]" />
                    <span>Montée soutenue 10–15%</span>
                    </div>

                    <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                    <span>Très raide &gt; 15%</span>
                    </div>
                </div>
            </div>
        </div>

          {/* Right panel */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Dénivelé
              </h3>

              <div className="rounded-xl border border-zinc-800 bg-black/30 p-2">
                <Mountain className="h-4 w-4 text-lime-400" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* D+ */}
              <div className="rounded-2xl border border-lime-500/10 bg-lime-500/5 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
                  <Mountain className="h-3.5 w-3.5 text-lime-400" />
                  Dénivelé positif
                </div>

                <p className="mt-2 text-[38px] font-bold leading-none text-lime-400">
                  +420m
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  Montée cumulée totale
                </p>
              </div>

              {/* D- */}
              <div className="rounded-2xl border border-orange-500/10 bg-orange-500/5 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
                  <TrendingDown className="h-3.5 w-3.5 text-orange-400" />
                  Dénivelé négatif
                </div>

                <p className="mt-2 text-[38px] font-bold leading-none text-orange-400">
                  -398m
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  Descente cumulée totale
                </p>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-2xl border border-zinc-800 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Alt. min
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    612m
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Alt. max
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    1240m
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-sky-500/10 bg-sky-500/5 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Pente moyenne
                  </p>

                  <p className="mt-2 text-2xl font-bold text-sky-400">
                    6.2%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-xl transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl border p-2.5 ${stat.bg} ${stat.border}`}
                  >
                    <Icon
                      className={`h-4 w-4 ${stat.color}`}
                    />
                  </div>

                  <p className="text-sm text-zinc-500">
                    {stat.title}
                  </p>
                </div>

                <h3 className="mt-4 text-[28px] font-bold text-white">
                  {stat.value}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {stat.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}