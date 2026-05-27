"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  return (
    <aside className="relative hidden w-[270px] shrink-0 border-r border-white/5 bg-black lg:flex lg:flex-col">

      {/* SUBTLE BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-[-25%] top-[5%] h-[280px] w-[280px] rounded-full bg-violet-500/5 blur-3xl" />

        <div className="absolute bottom-[-20%] left-[-10%] h-[240px] w-[240px] rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      {/* HEADER */}
      <div className="relative px-7 py-8">

        <div className="flex items-center gap-4">

          {/* LOGO */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/10">
            <Zap
              size={20}
              className="text-white"
            />
          </div>

          {/* BRAND */}
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Sport Tracker
            </h1>

            <p className="mt-0.5 text-sm text-zinc-500">
              Performance Platform
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative flex flex-1 flex-col px-4">

        {/* MAIN NAV */}
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.06] text-white"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >

                {/* ACTIVE BAR */}
                <div
                  className={`h-5 w-1 rounded-full transition-all ${
                    isActive
                      ? "bg-violet-400 opacity-100"
                      : "opacity-0"
                  }`}
                />

                {/* ICON */}
                <Icon
                  size={18}
                  className={`transition-all duration-200 ${
                    isActive
                      ? "text-violet-300"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />

                {/* LABEL */}
                <span className="text-sm font-medium">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* SECONDARY */}
        <div className="mt-8 border-t border-white/5 pt-6">

          <div className="mb-4 px-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">
            Général
          </div>

          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.06] text-white"
                      : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >

                  <div
                    className={`h-5 w-1 rounded-full transition-all ${
                      isActive
                        ? "bg-violet-400 opacity-100"
                        : "opacity-0"
                    }`}
                  />

                  <Icon
                    size={18}
                    className={`transition-all duration-200 ${
                      isActive
                        ? "text-violet-300"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />

                  <span className="text-sm font-medium">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SPACER */}
        <div className="flex-1" />

        {/* PERFORMANCE CARD */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-5">

          {/* TOP */}
          <div className="mb-4 flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10">
              <Trophy
                size={20}
                className="text-violet-300"
              />
            </div>

            <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              +12%
            </div>
          </div>

          {/* CONTENT */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Excellente semaine
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Vous progressez plus vite que prévu cette semaine.
            </p>
          </div>

          {/* PROGRESS */}
          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between text-xs text-zinc-600">
              <span>72%</span>

              <span>Objectif</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}