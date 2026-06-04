"use client";

import Image from "next/image";

import Link from "next/link";

import { Bell } from "lucide-react";

import { MobileSidebar } from "./mobile-sidebar";

import { useAuthStore } from "@/store/auth-store";

import { Button } from "@/components/ui/button";

export function Topbar() {
  const user = useAuthStore((state) => state.user);

  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="app-topbar relative flex h-20 items-center justify-between overflow-hidden border-b border-white/[0.05] bg-[#0b0b0f]/95 px-4 backdrop-blur-2xl sm:px-8">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] left-[10%] h-[220px] w-[220px] rounded-full bg-violet-500/5 blur-3xl" />

        <div className="absolute top-[-80px] right-[5%] h-[180px] w-[180px] rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      {/* LEFT */}
      <div className="relative z-10 flex items-center gap-4">
        <MobileSidebar />
      </div>

      {/* RIGHT */}
      <div className="relative z-10 flex items-center gap-3">
        {/* CONTEXT */}
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-xl lg:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />

          <span>{user ? `Bonjour ${user.firstName} 👋` : "Non connecté"}</span>
        </div>

        {/* NOTIFICATION */}
        <Link
          href="/calendrier"
          aria-label="Voir le calendrier"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-400 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.10] hover:bg-white/[0.05] hover:text-white"
        >
          <Bell size={18} />

          {/* BADGE */}
          <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
        </Link>

        {/* LOGOUT */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();

            window.location.href = "/login";
          }}
          className="border-white/[0.08] bg-white/[0.03] text-zinc-300 backdrop-blur-xl hover:bg-white/[0.05] hover:text-white"
        >
          Déconnexion
        </Button>

        {/* AVATAR */}
        <Link
          href="/parametres"
          aria-label="Ouvrir les paramètres du profil"
          className="group relative"
        >
          {/* GLOW */}
          <div className="absolute inset-0 rounded-full bg-violet-500/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" />

          {/* AVATAR CONTAINER */}
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/[0.08] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
            {user?.avatarUrl ? (
              <Image
                src={`${user.avatarUrl}?t=${Date.now()}`}
                alt="Avatar"
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                {user?.firstName?.charAt(0) || "U"}
              </div>
            )}

            {/* LIGHT */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.14),transparent_45%)]" />
          </div>

          {/* ONLINE STATUS */}
          <div className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-[#0b0b0f] bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
        </Link>
      </div>
    </header>
  );
}
