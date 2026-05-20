import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ActivitiesPage() {
  return (
    <DashboardLayout>
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Activités
        </h1>

        <p className="mt-2 text-zinc-400">
          Retrouvez l’ensemble de vos entraînements récents.
        </p>
      </div>
    </div>
    </DashboardLayout>
  );
}