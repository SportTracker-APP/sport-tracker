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


export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back 👋
          </h1>

          <p className="mt-2 text-zinc-400">
            Here is your sport performance overview.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
            <StatsCard
              title="Activités"
              value="128"
              description="+12% ce mois-ci"
              icon={Activity}
            />

            <StatsCard
              title="Distance"
              value="842 km"
              description="+84 km cette semaine"
              icon={Route}
            />

            <StatsCard
              title="Calories"
              value="24 300"
              description="Très bonne progression"
              icon={Flame}
            />

            <StatsCard
              title="Objectifs"
              value="6"
              description="2 objectifs presque atteints"
              icon={Trophy}
            />
          
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Intégration Graphique activité hebdomadaire */}
          <WeeklyActivityChart /> 
          {/* Intégration Liste récente activités */}
          <RecentActivities />
        </div>
      </div>
    </DashboardLayout>
  );
}