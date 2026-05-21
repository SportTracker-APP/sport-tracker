"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export function Topbar() {
  const pathname = usePathname();
  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 sm:px-8">
      {/* Partie gauche */}
      <div className="flex items-center gap-4">
        <MobileSidebar />

        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            {pathname === "/"
             ? "Tableau de bord"
             : pathname === "/activites"
              ? "Activités"
              : "Sport Tracker"}
          </h2>
        </div>
      </div>

      {/* Partie droite */}
      <div className="flex items-center gap-4">
        <button className="rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:text-white">
          <Bell size={18} />
        </button>

        <Avatar>
          <AvatarFallback>
            TR
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}