"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import {
  Activity,
  Calendar,
  ChartColumn,
  CheckCircle2,
  BookOpen,
  Goal,
  LayoutDashboard,
  Link2,
  Map,
  ShieldCheck,
  Settings,
} from "lucide-react";

import { api } from "@/lib/api";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { useAuthStore } from "@/store/auth-store";

interface StravaStatus {
  connected: boolean;
  hasSyncedActivities?: boolean;
  syncedActivitiesCount?: number;
}

const integrationItems = [
  {
    title: "Strava",
    href: "/integrations/strava",
    icon: Link2,
  },
];

const navigationItems = [
  {
    title: "Refuge",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Sorties",
    href: "/activites",
    icon: Activity,
  },
  {
    title: "Statistiques",
    href: "/statistiques",
    icon: ChartColumn,
  },
  {
    title: "Exploration",
    href: "/carte",
    icon: Map,
  },
  {
    title: "Défis",
    href: "/objectifs",
    icon: Goal,
  },
];

const secondaryItems = [
  {
    title: "Planning",
    href: "/calendrier",
    icon: Calendar,
  },
  {
    title: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

const normalizePath = (path: string) => path.replace(/\/$/, "");

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [isLoadingStravaStatus, setIsLoadingStravaStatus] = useState(true);
  const [hasSyncedStravaActivities, setHasSyncedStravaActivities] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStravaStatus() {
      try {
        const { data } = await api.get<StravaStatus>("/strava/status");

        if (isMounted) {
          setIsStravaConnected(data.connected);
          setHasSyncedStravaActivities(Boolean(data.hasSyncedActivities));
          setIsLoadingStravaStatus(false);
        }
      } catch {
        if (isMounted) {
          setIsStravaConnected(false);
          setHasSyncedStravaActivities(false);
          setIsLoadingStravaStatus(false);
        }
      }
    }

    void loadStravaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const isActiveRoute = (href: string) => {
    const current = normalizePath(pathname);
    const target = normalizePath(href);

    if (target === "") {
      return current === "";
    }

    return current === target || current.startsWith(`${target}/`);
  };

  return (
    <aside className="app-sidebar relative hidden w-[270px] shrink-0 overflow-hidden border-r border-white/[0.06] bg-[#0D0E14]/95 backdrop-blur-2xl lg:flex lg:flex-col">
      {/* GLOBAL BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* MAIN GRADIENT */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#11121A_0%,#0C0D13_100%)]" />

        {/* PURPLE AMBIENT */}
        <div className="absolute top-[0%] left-[-30%] h-[340px] w-[340px] rounded-full bg-violet-500/10 blur-[90px]" />

        {/* FUCHSIA DEPTH */}
        <div className="absolute bottom-[-15%] left-[-20%] h-[260px] w-[260px] rounded-full bg-fuchsia-500/10 blur-[90px]" />

        {/* SOFT LIGHT */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_22%)]" />

        {/* INNER SHADOW */}
        <div className="absolute inset-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]" />

        {/* NOISE */}
        <div className="absolute inset-0 [background-image:url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-soft-light" />
      </div>

      {/* HEADER */}
      <div className="relative px-7 py-8">
        <div className="flex items-center gap-4">
          {/* LOGO */}
          <div className="app-brand-logo relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-500 via-green-400 to-lime-400 shadow-[0_16px_42px_rgba(16,185,129,0.30)]">
            <Activity size={21} className="relative text-white" strokeWidth={2.4} />
          </div>

          {/* BRAND */}
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Montaro
            </h1>

            <p className="mt-0.5 text-sm text-zinc-500">
              Outdoor performance
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative flex flex-1 flex-col px-4">
        {/* MAIN NAV */}
        <div className="mb-4 px-4 text-xs font-medium tracking-[0.22em] text-zinc-600 uppercase">
          Refuge
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.title}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
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
                    isActive ? "bg-violet-400 opacity-100" : "opacity-0"
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
          <div className="mb-4 px-4 text-xs font-medium tracking-[0.22em] text-zinc-600 uppercase">
            Carnet
          </div>

          <nav className="space-y-1">
            {secondaryItems
              .filter((item) => !item.adminOnly || user?.role === "ADMIN")
              .map((item) => {
                const Icon = item.icon;

                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
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
                        isActive ? "bg-violet-400 opacity-100" : "opacity-0"
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

        {/* INTEGRATIONS */}
        <div className="mt-8 border-t border-white/[0.05] pt-6">
          <div className="mb-4 px-4 text-xs font-medium tracking-[0.22em] text-zinc-600 uppercase">
            Connexions
          </div>

          <nav className="space-y-1">
            {integrationItems.map((item) => {
              const Icon = item.icon;

              const isActive = isActiveRoute(item.href);
              const isConnectedIntegration =
                item.title === "Strava" && hasSyncedStravaActivities;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-[20px] px-4 py-3 transition-all duration-300 ${
                    isActive
                      ? "border border-orange-500/20 bg-orange-500/10 text-white"
                      : isConnectedIntegration
                        ? "border border-emerald-500/10 bg-emerald-500/[0.055] text-emerald-100/80 hover:border-emerald-500/18 hover:bg-emerald-500/[0.085] hover:text-emerald-100"
                        : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(249,115,22,0.12),transparent_45%)]" />
                  )}

                  {isConnectedIntegration && !isActive && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(16,185,129,0.08),transparent_45%)]" />
                  )}

                  <div
                    className={`relative h-5 w-1 rounded-full transition-all ${
                      isActive
                        ? "bg-orange-400 opacity-100"
                        : isConnectedIntegration
                          ? "bg-emerald-400/70 opacity-100"
                          : "opacity-0"
                    }`}
                  />

                  <Icon
                    size={18}
                    className={`relative transition-all duration-200 ${
                      isActive
                        ? "text-orange-300"
                        : isConnectedIntegration
                          ? "text-emerald-300/75 group-hover:text-emerald-300"
                          : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />

                  <span className="relative text-sm font-medium">
                    {item.title}
                  </span>

                  {isConnectedIntegration && (
                    <CheckCircle2 className="relative ml-auto h-4 w-4 text-emerald-300/70 group-hover:text-emerald-300" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* STRAVA CTA */}
          {!isLoadingStravaStatus && !hasSyncedStravaActivities && (
            <Link
              href="/integrations/strava"
              className="mt-5 block overflow-hidden rounded-[24px] border border-orange-500/15 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-4 transition-all duration-300 hover:border-orange-500/25 hover:from-orange-500/15 hover:to-orange-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FC4C02]/15">
                  <Link2 className="h-5 w-5 text-[#FC4C02]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {isStravaConnected ? "Strava connecté" : "Connecter Strava"}
                  </p>

                  <p className="text-xs text-zinc-400">
                    {isStravaConnected
                      ? "Prêt à synchroniser"
                      : "Synchronisation automatique"}
                  </p>
                </div>
              </div>
            </Link>
          )}

          <ThemeSwitcher />
        </div>

        {/* SPACER */}

        <div className="flex-1" />
      </div>
    </aside>
  );
}
