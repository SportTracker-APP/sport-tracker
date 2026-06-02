"use client";

import Link from "next/link";

import {
  Activity,
  Calendar,
  ChartColumn,
  Goal,
  LayoutDashboard,
  Link2,
  Menu,
  Settings,
  Trophy,
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Activités",
    href: "/activites",
    icon: Activity,
  },
  {
    label: "Calendrier",
    href: "/calendrier",
    icon: Calendar,
  },
  {
    label: "Statistiques",
    href: "/statistiques",
    icon: ChartColumn,
  },
  {
    label: "Objectifs",
    href: "/objectifs",
    icon: Goal,
  },
  {
    label: "Performances",
    href: "/performances",
    icon: Trophy,
  },
  {
    label: "Strava",
    href: "/integrations/strava",
    icon: Link2,
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300 transition-colors hover:bg-zinc-800 lg:hidden">
          <Menu size={20} />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="border-zinc-800 bg-black p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-white">Sport Tracker</h2>

            <p className="mt-1 text-sm text-zinc-500">Dashboard sportif</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white"
                >
                  <Icon size={20} />

                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
