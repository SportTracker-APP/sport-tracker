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


export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back 👋
          </h1>

          <p className="mt-2 text-zinc-400">
            Here is your sport performance overview.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-4">
          <FadeIn delay={0.2}>
            <StatsCard
              title="Activités"
              value="128"
              description="+12% ce mois-ci"
              icon={Activity}
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <StatsCard
              title="Distance"
              value="842 km"
              description="+84 km cette semaine"
              icon={Route}
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <StatsCard
              title="Calories"
              value="24 300"
              description="Très bonne progression"
              icon={Flame}
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <StatsCard
              title="Objectif mensuel"
              value="6"
              description="2 objectifs presque atteints"
              icon={Trophy}
            />
          </FadeIn>
          
        </div>
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
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