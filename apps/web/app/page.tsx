import { DashboardLayout } from "@/components/layout/dashboard-layout";

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

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">
              Total Activities
            </p>

            <h3 className="mt-4 text-3xl font-bold text-white">
              128
            </h3>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">
              Distance
            </p>

            <h3 className="mt-4 text-3xl font-bold text-white">
              842 km
            </h3>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">
              Calories
            </p>

            <h3 className="mt-4 text-3xl font-bold text-white">
              24 300
            </h3>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">
              Active Goals
            </p>

            <h3 className="mt-4 text-3xl font-bold text-white">
              6
            </h3>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}