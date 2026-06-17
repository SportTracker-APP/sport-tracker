"use client";

import { useMemo } from "react";

import {
  Activity,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  MapPinned,
  Mountain,
  Plus,
  Timer,
} from "lucide-react";

import { CreateActivityForm } from "@/components/activities/create-activity-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";

const sports = [
  {
    label: "Trail",
    icon: Mountain,
  },
  {
    label: "Course",
    icon: Footprints,
  },
  {
    label: "VTT",
    icon: Bike,
  },
  {
    label: "Musculation",
    icon: Dumbbell,
  },
];

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}H`;
  }

  return `${hours}H${remainingMinutes.toString().padStart(2, "0")}`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    notation: value >= 10000 ? "compact" : "standard",
  }).format(value);
}

export default function NewActivityPage() {
  const { data: activities = [], isLoading } = useActivities();

  const recentActivities = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);

    thirtyDaysAgo.setDate(today.getDate() - 30);

    return activities.filter((activity) => {
      const startedAt = new Date(activity.startedAt);

      return (
        activity.status !== "PLANNED" &&
        startedAt >= thirtyDaysAgo &&
        startedAt <= today
      );
    });
  }, [activities]);

  const recentDuration = useMemo(
    () =>
      recentActivities.reduce(
        (total, activity) => total + activity.duration,
        0,
      ),
    [recentActivities],
  );

  const recentCalories = useMemo(
    () =>
      recentActivities.reduce(
        (total, activity) => total + (activity.calories || 0),
        0,
      ),
    [recentActivities],
  );

  const quickStats = [
    {
      label: "Activités 30 jours",
      value: isLoading ? "..." : String(recentActivities.length),
      icon: Activity,
      color: "from-violet-500/20 to-fuchsia-500/10",
    },
    {
      label: "Temps sportif",
      value: isLoading ? "..." : formatDuration(recentDuration),
      icon: Timer,
      color: "from-sky-500/20 to-cyan-500/10",
    },
    {
      label: "Calories",
      value: isLoading ? "..." : formatCompactNumber(recentCalories),
      icon: Flame,
      color: "from-orange-500/20 to-red-500/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 pb-4 [&_input[type=number]]:appearance-none [&_input[type=number]::-webkit-inner-spin-button]:appearance-none [&_input[type=number]::-webkit-outer-spin-button]:appearance-none">
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#181922]/95 p-7 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_32%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.10),transparent_32%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_24%)]" />

          <div className="relative">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl pt-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                  <Plus className="h-3.5 w-3.5" />
                  Nouvelle activité
                </div>

                <h1 className="mt-5 text-4xl leading-tight font-bold tracking-tight text-white xl:text-[44px]">
                  Enregistrez une
                  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {" "}
                    nouvelle performance
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">
                  Ajoutez vos séances de trail, randonnée, VTT ou course et
                  analysez automatiquement vos performances, votre progression
                  et votre charge d’entraînement.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {sports.map((sport) => {
                    const Icon = sport.icon;

                    return (
                      <div
                        key={sport.label}
                        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-300"
                      >
                        <Icon className="h-3.5 w-3.5 text-violet-300" />
                        {sport.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:w-[340px] xl:grid-cols-1 xl:pt-1">
                {quickStats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className={`app-new-activity-stat-card relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-br ${stat.color} p-5`}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_45%)]" />

                      <div className="relative flex items-start justify-between">
                        <div>
                          <p className="text-xs text-zinc-400">{stat.label}</p>
                          <p className="mt-2 text-3xl font-bold text-white">
                            {stat.value}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#181922]/95 p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_30%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_22%)]" />

            <div className="relative mb-8 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Détails de l’activité
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Remplissez les informations de votre séance pour alimenter vos
                  statistiques et graphiques.
                </p>
              </div>

              <div className="hidden rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 lg:flex">
                <Activity className="h-4 w-4 text-violet-300" />
              </div>
            </div>

            <div className="relative">
              <CreateActivityForm />
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#181922]/95 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
                  <MapPinned className="h-4 w-4 text-violet-300" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Conseils tracking
                  </h3>

                  <p className="text-xs text-zinc-500">
                    Optimisez vos données.
                  </p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                {[
                  [
                    "Dénivelé",
                    "Précieux pour le trail, la randonnée et le VTT.",
                  ],
                  [
                    "Localisation",
                    "Utile pour retrouver les zones fortes et les parcours.",
                  ],
                  [
                    "Ressenti",
                    "Parfait pour relier les chiffres aux sensations.",
                  ],
                ].map(([title, description]) => (
                  <div key={title} className="py-4">
                    <p className="text-sm font-medium text-white">{title}</p>

                    <p className="mt-1.5 text-xs leading-6 text-zinc-500">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-5">
              <p className="text-[11px] tracking-[0.18em] text-violet-300/80 uppercase">
                Smart tracking
              </p>

              <h3 className="mt-3 text-xl leading-tight font-semibold text-white">
                Votre futur dashboard IA commence ici.
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Chaque activité enrichira vos analyses, prédictions de
                progression et recommandations d’entraînement.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
