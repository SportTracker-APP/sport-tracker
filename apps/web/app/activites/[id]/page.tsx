"use client";

import Link from "next/link";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

import {
  Activity,
  ArrowLeft,
  Calendar,
  Flame,
  Gauge,
  HeartPulse,
  MapPin,
  Timer,
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

const performanceStats = [
  {
    title: "Allure",
    value: "5'01",
    unit: "/km",
    icon: Timer,
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
  },
  {
    title: "Vitesse",
    value: "11.9",
    unit: "km/h",
    icon: Gauge,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    title: "BPM moyen",
    value: "154",
    unit: "bpm",
    icon: HeartPulse,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    title: "Cadence",
    value: "172",
    unit: "spm",
    icon: Activity,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    title: "Calories",
    value: "560",
    unit: "kcal",
    icon: Flame,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
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

            {/* Top stats */}
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

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
          {/* LEFT */}
          <div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-xl">
              {/* Graph header */}
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-tight text-white">
                    Profil d&apos;élévation
                  </h2>

                  <p className="mt-1 text-[15px] text-zinc-400">
                    Analyse du parcours et du dénivelé.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Altitude max
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-white">
                    1240m
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[340px] w-full">
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
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="100%"
                          stopColor="#84cc16"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      <filter id="glow">
                        <feGaussianBlur
                          stdDeviation="8"
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
                      tick={{
                        fill: "#71717a",
                        fontSize: 12,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      width={60}
                      tick={{
                        fill: "#71717a",
                        fontSize: 12,
                      }}
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
                        borderRadius: "16px",
                        color: "#fff",
                      }}
                    />

                    <Area
                      type="natural"
                      dataKey="elevation"
                      stroke="#84cc16"
                      strokeWidth={3}
                      fill="url(#elevationGradient)"
                      filter="url(#glow)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Gradient */}
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

              {/* Elevation stats */}
              <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-lime-500/15 bg-lime-500/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lime-300/70">
                    Dénivelé positif
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-lime-400">
                    +420m
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-orange-300/70">
                    Dénivelé négatif
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-orange-400">
                    -398m
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                    Alt. min
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-white">
                    612m
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-sky-300/70">
                    Pente moyenne
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-sky-400">
                    6.2%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PERFORMANCE PANEL */}
          <div>
            <div className="sticky top-6 flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-xl">
              <div className="mb-5">
                <h3 className="text-2xl font-semibold text-white">
                  Performance
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Résumé de la séance
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {performanceStats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className={`rounded-2xl border p-4 ${stat.bg} ${stat.border}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-white/5 bg-black/20 p-2">
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>

                        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                          {stat.title}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end gap-1">
                        <p
                          className={`text-3xl font-semibold ${stat.color}`}
                        >
                          {stat.value}
                        </p>

                        <span className="pb-1 text-sm text-zinc-500">
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}