"use client";

import Link from "next/link";
import { BookOpen, CalendarPlus, Mountain, PenLine, Sparkles } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";

const journalIdeas = [
  {
    title: "Ressenti",
    text: "Notez ce qui a vraiment compté : jambes, souffle, mental, plaisir.",
    icon: PenLine,
  },
  {
    title: "Terrain",
    text: "Route, lac, sentier, montée raide ou sortie pluie : le contexte raconte la sortie.",
    icon: Mountain,
  },
  {
    title: "Message du refuge",
    text: "Une phrase simple pour garder l'app vivante sans devenir bruyante.",
    icon: Sparkles,
  },
];

export default function JournalPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <FadeIn>
          <section className="app-premium-surface relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-7 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_34%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.12),transparent_36%)]" />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <BookOpen className="h-3.5 w-3.5" />
                Journal outdoor
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Ton carnet de bord, sans blabla inutile.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                Les chiffres disent combien. Le journal dira pourquoi. Bientôt,
                chaque sortie pourra garder son ressenti, son terrain, et le
                petit détail qui donne envie d'y retourner.
              </p>

              <Link
                href="/activites/nouvelle"
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-5 text-sm font-bold text-white shadow-[0_20px_46px_rgba(16,185,129,0.22)]"
              >
                <CalendarPlus className="h-4 w-4" />
                Ajouter une sortie
              </Link>
            </div>
          </section>
        </FadeIn>

        <section className="grid gap-4 lg:grid-cols-3">
          {journalIdeas.map((idea, index) => {
            const Icon = idea.icon;

            return (
              <FadeIn key={idea.title} delay={0.08 * (index + 1)}>
                <div className="app-premium-surface h-full rounded-[26px] border border-white/[0.08] bg-[#181922]/92 p-6">
                  <div className="app-dashboard-green-icon flex h-12 w-12 items-center justify-center rounded-2xl text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-white">
                    {idea.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {idea.text}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </section>
      </div>
    </DashboardLayout>
  );
}
