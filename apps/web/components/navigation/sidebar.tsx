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
    <aside className="relative hidden w-[285px] shrink-0 overflow-hidden border-r border-white/5 bg-black/20 backdrop-blur-3xl lg:flex lg:flex-col">

      {/* SUBTLE ATMOSPHERE */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* VIOLET GLOW */}
        <div className="absolute left-[-20%] top-[5%] h-[340px] w-[340px] rounded-full bg-violet-500/8 blur-[110px]" />

        {/* FUCHSIA GLOW */}
        <div className="absolute bottom-[-15%] left-[0%] h-[280px] w-[280px] rounded-full bg-fuchsia-500/6 blur-[100px]" />

        {/* LIGHT OVERLAY */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.025),transparent_25%)]" />

        {/* INNER SHADOW */}
        <div className="absolute inset-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]" />
      </div>

      {/* HEADER */}
      <div className="relative px-7 pb-8 pt-9">

        <div className="flex items-center gap-4">

          {/* LOGO */}
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl">

            {/* GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20" />

            <Zap
              size={20}
              className="relative text-white"
            />
          </div>

          {/* BRAND */}
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-white">
              Sport Tracker
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Premium Analytics
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="relative flex flex-1 flex-col px-4">

        {/* MAIN NAV */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? "border border-white/10 bg-white/[0.07] text-white shadow-lg shadow-black/10"
                    : "border border-transparent text-zinc-500 hover:border-white/5 hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >

                {/* ACTIVE GLOW */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10" />
                )}

                {/* ICON */}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
                    isActive
                      ? "border-white/10 bg-white/[0.06] text-violet-200"
                      : "border-white/5 bg-black/10 text-zinc-500 group-hover:border-white/10 group-hover:bg-white/[0.04] group-hover:text-zinc-300"
                  }`}
                >
                  <Icon size={18} />
                </div>

                {/* LABEL */}
                <span className="relative text-sm font-medium tracking-tight">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* SECONDARY */}
        <div className="mt-8">

          <div className="mb-4 px-4 text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-600">
            Général
          </div>

          <nav className="space-y-2">
            {secondaryItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3 transition-all duration-300 ${
                    isActive
                      ? "border border-white/10 bg-white/[0.07] text-white"
                      : "border border-transparent text-zinc-500 hover:border-white/5 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >

                  {/* ACTIVE GLOW */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10" />
                  )}

                  {/* ICON */}
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
                      isActive
                        ? "border-white/10 bg-white/[0.06] text-violet-200"
                        : "border-white/5 bg-black/10 text-zinc-500 group-hover:border-white/10 group-hover:bg-white/[0.04] group-hover:text-zinc-300"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  {/* LABEL */}
                  <span className="relative text-sm font-medium tracking-tight">
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
        <div className="relative mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-3xl">

          {/* BACKGROUND */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent" />

          {/* TOP */}
          <div className="relative mb-5 flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
              <Trophy
                size={18}
                className="text-violet-300"
              />
            </div>

            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              +12%
            </div>
          </div>

          {/* CONTENT */}
          <div className="relative">
            <h3 className="text-sm font-semibold text-white">
              Excellente semaine
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Votre rythme est supérieur à votre moyenne habituelle.
            </p>
          </div>

          {/* PROGRESS */}
          <div className="relative mt-5">

            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
              <span>72%</span>

              <span>Objectif hebdo</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}