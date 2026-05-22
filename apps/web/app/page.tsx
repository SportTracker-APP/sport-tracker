import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Activity,
  Flame,
  Route,
  Trophy,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { MonthlyGoalCard } from "@/components/dashboard/monthly-goal-card";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { FadeIn } from "@/components/ui/fade-in";

import {
  monthlyGoal,
  recentActivities,
  statsData,
} from "@/lib/data/dashboard-data";


export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="-mt-6 space-y-6 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_42%)] pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Continuez votre progression. 👋
          </h1>

          <p className="mt-2 text-zinc-400">
            Suivez vos performances et gardez le rythme cette semaine.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-4">
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
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2 min-w-0">
          {/* Intégration Graphique activité hebdomadaire */}
          <FadeIn delay={0.5}>
            <WeeklyActivityChart /> 
          </FadeIn>

          {/* Intégration Liste récente activités */}
          <FadeIn delay={0.6}>
            <RecentActivities />
          </FadeIn>

        </div>
        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
          {/* Intégration Graphique Objectif Mensuel Card */}
          <FadeIn delay={0.7}>
            <MonthlyGoalCard /> 
          </FadeIn>

          {/* Intégration Heatmap */}
          <FadeIn delay={0.7}>
           <ActivityHeatmap />
          </FadeIn>

        </div>
      </div>
    </DashboardLayout>
  );
}