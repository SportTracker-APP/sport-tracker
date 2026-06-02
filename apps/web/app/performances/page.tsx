import {
  Activity,
  Gauge,
  HeartPulse,
  Medal,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

const highlights = [
  {
    label: "Meilleure distance",
    value: "43 km",
    detail: "Randonnée longue",
    icon: Trophy,
  },
  {
    label: "Allure moyenne",
    value: "5:12",
    detail: "min/km sur course",
    icon: Gauge,
  },
  {
    label: "Fréquence max",
    value: "184",
    detail: "bpm",
    icon: HeartPulse,
  },
];

const records = [
  "Plus longue sortie : 43 km",
  "Meilleur mois : 312 km",
  "Plus gros dénivelé : 1 420 m",
  "Série actuelle : 6 jours actifs",
];

export default function PerformancesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-7 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_34%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300">
              <Medal className="h-3.5 w-3.5" />
              Performances
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
              Vos meilleurs repères sportifs.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              Retrouvez vos records, tendances et indicateurs clés pour mesurer
              votre progression.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-5 text-sm text-zinc-400">{item.label}</p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {item.value}
                </p>

                <p className="mt-2 text-sm text-zinc-500">{item.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Tendance</h2>
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-6 flex h-48 items-end gap-3">
              {[42, 56, 48, 72, 64, 84, 78].map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className="flex flex-1 items-end rounded-t-2xl bg-white/[0.04]"
                >
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-sky-500 to-violet-400"
                    style={{
                      height: `${value}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-violet-300" />
              <h2 className="text-xl font-semibold text-white">Records</h2>
            </div>

            <div className="mt-5 space-y-3">
              {records.map((record) => (
                <div
                  key={record}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
                >
                  {record}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
