import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { ActivityCard } from "@/components/activities/activity-card";

import { FadeIn } from "@/components/ui/fade-in";

import { activities } from "@/lib/data/activities-data";

export default function ActivitiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header page activités */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Historique sportif
          </h1>

          <p className="mt-2 text-zinc-400">
            Retrouvez l’ensemble de vos entraînements récents.
          </p>
        </div>

        {/* Liste activités */}
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <FadeIn
              key={activity.id}
              delay={0.1 * (index + 1)}
            >
              <ActivityCard
                title={activity.title}
                type={activity.type}
                distance={activity.distance}
                duration={activity.duration}
                calories={activity.calories}
                date={activity.date}
                icon={activity.icon}
              />
            </FadeIn>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}