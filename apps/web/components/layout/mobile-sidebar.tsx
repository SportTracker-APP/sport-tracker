"use client";

import Link from "next/link";

import {
  Activity,
  BookOpen,
  Calendar,
  ChartColumn,
  Goal,
  LayoutDashboard,
  Link2,
  Map,
  Menu,
  ShieldCheck,
  Settings,
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { useAuthStore } from "@/store/auth-store";

const links = [
  {
    label: "Refuge",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Sorties",
    href: "/activites",
    icon: Activity,
  },
  {
    label: "Statistiques",
    href: "/statistiques",
    icon: ChartColumn,
  },
  {
    label: "Exploration",
    href: "/carte",
    icon: Map,
  },
  {
    label: "Défis",
    href: "/objectifs",
    icon: Goal,
  },
  {
    label: "Planning",
    href: "/calendrier",
    icon: Calendar,
  },
  {
    label: "Journal",
    href: "/journal",
    icon: BookOpen,
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
  {
    label: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export function MobileSidebar() {
  const user = useAuthStore((state) => state.user);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="app-mobile-menu-trigger rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300 transition-colors hover:bg-zinc-800 lg:hidden">
          <span className="sr-only">Ouvrir le menu</span>
          <Menu size={20} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="app-mobile-sidebar border-zinc-800 bg-black p-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-white">Sport Tracker</h2>

            <p className="mt-1 text-sm text-zinc-500">Outdoor performance</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {links
              .filter((link) => !link.adminOnly || user?.role === "ADMIN")
              .map((link) => {
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

          <div className="border-t border-zinc-800 p-4">
            <ThemeSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
