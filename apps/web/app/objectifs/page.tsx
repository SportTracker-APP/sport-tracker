import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Footprints,
  Mountain,
  Target,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

const goals = [
  {
    title: "Distance mensuelle",
    value: "312 / 420 km",
    progress: 74,
    icon: Footprints,
    accent: "violet",
  },
  {
    title: "Dénivelé positif",
    value: "8 240 / 12 000 m",
    progress: 69,
    icon: Mountain,
    accent: "emerald",
  },
  {
    title: "Séances hebdomadaires",
    value: "4 / 5",
    progress: 80,
    icon: CalendarCheck,
    accent: "sky",
  },
];

const milestones = [
  "Planifier une sortie longue",
  "Ajouter une séance de récupération",
  "Synchroniser les activités Strava",
];

export default function GoalsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-7 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%)]" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <Target className="h-3.5 w-3.5" />
                Objectifs
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
                Gardez le cap sur vos priorités.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Suivez vos objectifs sportifs clés et les prochaines actions à
                mener pour rester régulier.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4">
              <p className="text-xs text-zinc-500">Progression moyenne</p>
              <p className="mt-2 text-3xl font-bold text-white">74%</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {goals.map((goal) => {
            const Icon = goal.icon;

            return (
              <div
                key={goal.title}
                className="rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] ${
                      goal.accent === "emerald"
                        ? "text-emerald-300"
                        : goal.accent === "sky"
                          ? "text-sky-300"
                          : "text-violet-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-white">
                  {goal.title}
                </h2>

                <p className="mt-2 text-sm text-zinc-400">{goal.value}</p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400"
                    style={{
                      width: `${goal.progress}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">
            Prochaines actions
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {milestones.map((milestone) => (
              <div
                key={milestone}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-zinc-300"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {milestone}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
