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

const normalizePath = (path: string) => path.replace(/\/$/, "");

export function Sidebar() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    const current = normalizePath(pathname);
    const target = normalizePath(href);

    return current === target || current.startsWith(target + "/");
  };

  return (
    <aside className="relative hidden w-[270px] shrink-0 overflow-hidden border-r border-white/[0.06] bg-[#0D0E14]/95 backdrop-blur-2xl lg:flex lg:flex-col">

      {/* GLOBAL BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* MAIN GRADIENT */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#11121A_0%,#0C0D13_100%)]" />

        {/* PURPLE AMBIENT */}
        <div className="absolute left-[-30%] top-[0%] h-[340px] w-[340px] rounded-full bg-violet-500/10 blur-[90px]" />

        {/* FUCHSIA DEPTH */}
        <div className="absolute bottom-[-15%] left-[-20%] h-[260px] w-[260px] rounded-full bg-fuchsia-500/10 blur-[90px]" />

        {/* SOFT LIGHT */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_22%)]" />

        {/* INNER SHADOW */}
        <div className="absolute inset-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]" />

        {/* NOISE */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-soft-light [background-image:url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* HEADER */}
      <div className="relative px-7 py-8">

        <div className="flex items-center gap-4">

          {/* LOGO */}
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_10px_40px_rgba(168,85,247,0.35)]">

            {/* LIGHT */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),transparent_45%)]" />

            <Zap
              size={20}
              className="relative text-white"
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
                className={`group relative flex items-center gap-3 overflow-hidden rounded-[20px] px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? "border border-white/[0.06] bg-white/[0.05] text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >

                {/* ACTIVE BG */}
                {isActive && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(139,92,246,0.14),transparent_45%)]" />
                )}

                {/* ACTIVE BAR */}
                <div
                  className={`relative h-5 w-1 rounded-full transition-all ${
                    isActive
                      ? "bg-violet-400 opacity-100"
                      : "opacity-0"
                  }`}
                />

                {/* ICON */}
                <Icon
                  size={18}
                  className={`relative transition-all duration-200 ${
                    isActive
                      ? "text-violet-300"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />

                {/* LABEL */}
                <span className="relative text-sm font-medium">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* SECONDARY */}
        <div className="mt-8 border-t border-white/[0.05] pt-6">

          <div className="mb-4 px-4 text-xs font-medium uppercase tracking-[0.22em] text-zinc-600">
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
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-[20px] px-4 py-3 transition-all duration-300 ${
                    isActive
                      ? "border border-white/[0.06] bg-white/[0.05] text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                      : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >

                  {/* ACTIVE BG */}
                  {isActive && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(139,92,246,0.14),transparent_45%)]" />
                  )}

                  {/* ACTIVE BAR */}
                  <div
                    className={`relative h-5 w-1 rounded-full transition-all ${
                      isActive
                        ? "bg-violet-400 opacity-100"
                        : "opacity-0"
                    }`}
                  />

                  {/* ICON */}
                  <Icon
                    size={18}
                    className={`relative transition-all duration-200 ${
                      isActive
                        ? "text-violet-300"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />

                  {/* LABEL */}
                  <span className="relative text-sm font-medium">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SPACER */}
        <div className="flex-1" />

      </div>
    </aside>
  );
}