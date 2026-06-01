"use client";


import {
  Activity,
  ArrowRight,
  Heart,
  Mountain,
  Timer,
  Flame,
  Link2,
  ShieldCheck,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function StravaIntegrationPage() {
  return (
    <DashboardLayout>
    <div className="space-y-8">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-[#11131A]/80 p-8 backdrop-blur-xl">

        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-[#FC4C02]/15 blur-[120px]" />

        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(252,76,2,0.12),transparent_35%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div className="max-w-2xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2">

              <Link2 className="h-4 w-4 text-orange-300" />

              <span className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                Intégration officielle
              </span>

            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white">
              Connectez votre compte Strava
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
              Importez automatiquement vos activités,
              vos performances et votre historique sportif
              dans Sport Tracker.
            </p>

          </div>

          <button
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-[#FC4C02]
              px-6
              py-4
              text-sm
              font-semibold
              text-white
              transition-all
              duration-300
              hover:scale-[1.02]
              hover:shadow-[0_0_40px_rgba(252,76,2,0.4)]
            "
          >
            Connecter Strava

            <ArrowRight className="h-4 w-4" />
          </button>

        </div>
      </section>

      {/* DATA IMPORT */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {[
          {
            icon: Activity,
            title: "Activités",
            description:
              "Courses, vélo, randonnée et plus",
          },
          {
            icon: Timer,
            title: "Temps",
            description:
              "Durée et temps en mouvement",
          },
          {
            icon: Mountain,
            title: "Dénivelé",
            description:
              "Ascension et descente",
          },
          {
            icon: Flame,
            title: "Calories",
            description:
              "Dépense énergétique",
          },
          {
            icon: Heart,
            title: "Fréquence cardiaque",
            description:
              "Moyenne et maximum",
          },
          {
            icon: ShieldCheck,
            title: "Synchronisation sécurisée",
            description:
              "Connexion OAuth officielle",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="
                rounded-[28px]
                border
                border-white/[0.06]
                bg-white/[0.03]
                p-5
                backdrop-blur-xl
              "
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">

                <Icon className="h-5 w-5 text-orange-300" />

              </div>

              <h3 className="font-semibold text-white">
                {item.title}
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                {item.description}
              </p>

            </div>
          );
        })}
      </section>

      {/* HOW IT WORKS */}
      <section className="rounded-[32px] border border-white/[0.06] bg-[#11131A]/70 p-8">

        <h2 className="text-xl font-semibold text-white">
          Comment fonctionne la synchronisation ?
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-4">

          {[
            "Connexion Strava",
            "Autorisation OAuth",
            "Synchronisation",
            "Import des activités",
          ].map((step, index) => (
            <div
              key={step}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-5"
            >
              <div className="mb-3 text-2xl font-bold text-orange-300">
                0{index + 1}
              </div>

              <p className="text-sm font-medium text-white">
                {step}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* STATUS */}
      <section className="rounded-[32px] border border-white/[0.06] bg-[#11131A]/70 p-8">

        <h2 className="text-xl font-semibold text-white">
          Statut de synchronisation
        </h2>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.03] p-5">

          <div>
            <p className="font-medium text-white">
              Aucun compte connecté
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Connectez Strava pour importer vos activités.
            </p>
          </div>

          <div className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
            Non connecté
          </div>

        </div>

      </section>

    </div>
    </DashboardLayout>
  );
}