"use client";

import Link from "next/link";
import {
  Activity,
  Calendar,
  ChartColumn,
  Goal,
  LayoutDashboard,
  SportShoe,
  Settings,
} from "lucide-react";

const navigationItems = [
  {
    title: "Tableau de bord",
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
    href: "/calendrierr",
    icon: Calendar,
  },
  {
    title: "Statistiques",
    href: "/statistiques",
    icon: ChartColumn,
  },
  {
    title: "Strava API",
    href: "/strava",
    icon: SportShoe,
  },
  {
    title: "Objectifs",
    href: "/objectifs",
    icon: Goal,
  },
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 border-r border-zinc-800 bg-zinc-950 lg:flex lg:flex-col">
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-2xl font-bold text-white">
          Sport Tracker App
        </h1>

        <p className="mt-1 text-sm text-zinc-400">
          Performance dashboard
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white"
            >
              <Icon size={18} />

              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}