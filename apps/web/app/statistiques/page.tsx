"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Trophy,
  BarChart3,
} from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";

const performanceScore = 78;

export default function StatisticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HERO - ANALYTICS ORIENTED */}
        <FadeIn delay={0.1}>
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.025] px-6 py-6 md:px-8 md:py-7">

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-[-10%] top-[-20%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute bottom-[-20%] right-[-10%] h-[260px] w-[260px] rounded-full bg-fuchsia-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_35%)]" />
            </div>

            <div className="relative space-y-6">

              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <Zap size={14} />
                Performance Analytics
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-[38px]">
                Analyse de tes performances
              </h1>

              <p className="max-w-2xl text-sm text-zinc-400 md:text-base">
                Comprends tes tendances, identifie tes points forts et optimise ton entraînement grâce à l’analyse de tes données.
              </p>

              {/* PERFORMANCE SCORE */}
              <div className="flex items-end justify-between">

                <div>
                  <p className="text-xs text-zinc-500">
                    Performance score global
                  </p>

                  <p className="text-4xl font-bold text-white">
                    {performanceScore}
                    <span className="text-sm text-zinc-500"> / 100</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-400 text-sm">
                  <TrendingUp size={16} />
                  +6 pts vs semaine dernière
                </div>

              </div>

            </div>
          </section>
        </FadeIn>

        {/* ANALYTICS GRID */}
        <div className="grid gap-4 xl:grid-cols-3">

          {/* TREND BLOCK */}
          <FadeIn delay={0.2}>
            <section className="rounded-[30px] border border-white/10 bg-white/[0.025] p-6">

              <div className="mb-4 flex items-center gap-2 text-violet-300">
                <TrendingUp size={18} />
                <h2 className="font-semibold text-white">
                  Tendances
                </h2>
              </div>

              <div className="space-y-4 text-sm">

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Endurance</span>
                  <span className="text-emerald-400">+12%</span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Régularité</span>
                  <span className="text-emerald-400">+8%</span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Intensité</span>
                  <span className="text-red-400">-3%</span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Récupération</span>
                  <span className="text-emerald-400">+5%</span>
                </div>

              </div>
            </section>
          </FadeIn>

          {/* DISTRIBUTION */}
          <FadeIn delay={0.3}>
            <section className="rounded-[30px] border border-white/10 bg-white/[0.025] p-6">

              <div className="mb-4 flex items-center gap-2 text-violet-300">
                <BarChart3 size={18} />
                <h2 className="font-semibold text-white">
                  Répartition
                </h2>
              </div>

              <div className="space-y-3 text-sm text-zinc-300">

                <div className="flex justify-between">
                  <span>Course</span>
                  <span>52%</span>
                </div>

                <div className="flex justify-between">
                  <span>Vélo</span>
                  <span>28%</span>
                </div>

                <div className="flex justify-between">
                  <span>Musculation</span>
                  <span>20%</span>
                </div>

              </div>

            </section>
          </FadeIn>

          {/* INSIGHTS */}
          <FadeIn delay={0.4}>
            <section className="rounded-[30px] border border-white/10 bg-white/[0.025] p-6">

              <div className="mb-4 flex items-center gap-2 text-violet-300">
                <Trophy size={18} />
                <h2 className="font-semibold text-white">
                  Insights IA
                </h2>
              </div>

              <div className="space-y-3 text-sm text-zinc-300">

                <p>🔥 Tu performes mieux après 1 jour de repos</p>
                <p>📈 Ta régularité est ton plus gros levier</p>
                <p>⚡ Baisse d’intensité détectée en fin de semaine</p>
                <p>🎯 Recommandation : +1 séance cardio légère</p>

              </div>

            </section>
          </FadeIn>

        </div>

        {/* CHARTS */}
        <div className="grid gap-4 xl:grid-cols-2">

          <FadeIn delay={0.5}>
            <WeeklyActivityChart />
          </FadeIn>

          <FadeIn delay={0.6}>
            <ActivityHeatmap />
          </FadeIn>

        </div>

      </div>
    </DashboardLayout>
  );
}