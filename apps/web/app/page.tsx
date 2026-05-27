import { DashboardLayout } from "@/components/layout/dashboard-layout";

import {
  ArrowUpRight,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";

import { StatsCard } from "@/components/dashboard/stats-card";

import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";

import { RecentActivities } from "@/components/dashboard/recent-activities";

import { MonthlyGoalCard } from "@/components/dashboard/monthly-goal-card";

import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";

import { FadeIn } from "@/components/ui/fade-in";

import { statsData } from "@/lib/data/dashboard-data";

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HERO */}
        <FadeIn delay={0.1}>
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.025] px-6 py-6 md:px-8 md:py-7">

            {/* BACKGROUND */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

              <div className="absolute left-[-10%] top-[-20%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-3xl" />

              <div className="absolute bottom-[-20%] right-[-10%] h-[260px] w-[260px] rounded-full bg-fuchsia-500/10 blur-3xl" />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_35%)]" />
            </div>

            <div className="relative grid items-start gap-6 xl:grid-cols-[1.7fr_260px]">

              {/* LEFT */}
              <div>

                {/* BADGE */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                  <Zap size={14} />

                  Semaine productive
                </div>

                {/* TITLE */}
                <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white md:text-[38px]">
                  Continuez votre progression.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                  Vous êtes en avance sur vos objectifs hebdomadaires.
                  Continuez sur cette dynamique pour battre vos records personnels.
                </p>

                {/* QUICK STATS */}
                <div className="mt-6 flex flex-wrap gap-3">

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Flame
                        size={14}
                        className="text-orange-400"
                      />

                      Calories
                    </div>

                    <p className="mt-1.5 text-xl font-semibold text-white">
                      12 480
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Trophy
                        size={14}
                        className="text-yellow-400"
                      />

                      Objectifs
                    </div>

                    <p className="mt-1.5 text-xl font-semibold text-white">
                      72%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <ArrowUpRight
                        size={14}
                        className="text-emerald-400"
                      />

                      Progression
                    </div>

                    <p className="mt-1.5 text-xl font-semibold text-emerald-400">
                      +12%
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD */}
              <div className="relative h-fit overflow-hidden rounded-3xl border border-violet-500/15 bg-gradient-to-br from-violet-500/10 via-violet-500/[0.03] to-fuchsia-500/10 p-4">

                {/* TOP */}
                <div className="flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/20">
                    <Trophy
                      size={18}
                      className="text-violet-300"
                    />
                  </div>

                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                    +12%
                  </div>
                </div>

                {/* CONTENT */}
                <div className="mt-4">
                  <h2 className="text-base font-semibold text-white">
                    Excellente semaine
                  </h2>

                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                    Vous êtes en avance sur vos objectifs.
                  </p>
                </div>

                {/* PROGRESS */}
                <div className="mt-5">

                  <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Progression</span>

                    <span>72%</span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {statsData.map((stat, index) => (
            <FadeIn
              key={stat.title}
              delay={0.2 * (index + 1)}
            >
              <StatsCard
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
              />
            </FadeIn>
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">

          <FadeIn delay={0.5}>
            <WeeklyActivityChart />
          </FadeIn>

          <FadeIn delay={0.6}>
            <RecentActivities />
          </FadeIn>
        </div>

        {/* BOTTOM */}
        <div className="grid gap-4 xl:grid-cols-2">

          <FadeIn delay={0.7}>
            <MonthlyGoalCard />
          </FadeIn>

          <FadeIn delay={0.8}>
            <ActivityHeatmap />
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
}