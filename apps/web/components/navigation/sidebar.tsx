"use client";

import Link from "next/link";

import {
  Activity,
  Calendar,
  ChartColumn,
  Goal,
  LayoutDashboard,
  Settings,
  Trophy,
  Zap,
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Activités",
    href: "/activites",
    icon: Activity,
  },
  {
    title: "Calendrier",
    href: "/calendrier",
    icon: Calendar,
  },
  {
    title: "Statistiques",
    href: "/statistiques",
    icon: ChartColumn,
  },
  {
    title: "Objectifs",
    href: "/objectifs",
    icon: Goal,
  },
];

const secondaryItems = [
  {
    title: "Performances",
    href: "/performances",
    icon: Trophy,
  },
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

export function Sidebar() {
  return (
    <aside className="relative hidden w-[290px] shrink-0 border-r border-white/10 bg-black lg:flex lg:flex-col">

      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-[-20%] top-[10%] h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-3xl" />

        <div className="absolute bottom-[-10%] left-[-10%] h-[250px] w-[250px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* HEADER */}
      <div className="relative border-b border-white/10 px-7 py-8">

        <div className="flex items-center gap-4">

          {/* LOGO */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">

            <Zap
              size={24}
              className="text-white"
            />

            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
          </div>

          {/* BRAND */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sport Tracker
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Performance Platform
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden">

        {/* MAIN NAV */}
        <nav className="space-y-2 p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-transparent bg-white/[0.02] px-4 py-3.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              >

                {/* ICON */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/40 ring-1 ring-white/5 transition-all group-hover:bg-violet-500/10 group-hover:ring-violet-500/20">

                  <Icon
                    size={19}
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                </div>

                {/* LABEL */}
                <span className="tracking-tight">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM */}
        <div className="space-y-6 border-t border-white/10 p-4">

          {/* SECONDARY NAV */}
          <nav className="space-y-2">
            {secondaryItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-500 transition-all hover:bg-white/[0.04] hover:text-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] transition-all group-hover:bg-white/[0.06]">
                    <Icon size={18} />
                  </div>

                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* PERFORMANCE CARD */}
          <div className="overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-5">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20">
                <Trophy
                  size={22}
                  className="text-violet-300"
                />
              </div>

              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                +12%
              </div>
            </div>

            <h3 className="text-base font-semibold text-white">
              Excellente semaine
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Vous êtes en avance sur vos objectifs cette semaine.
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>72% complété</span>

              <span>Objectif hebdo</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}