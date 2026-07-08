"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  Check,
  ChevronDown,
  Leaf,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";

import { MobileSidebar } from "./mobile-sidebar";
import { NotificationCenter } from "./notification-center";

import {
  type AppTheme,
  useAppTheme,
} from "@/components/theme/theme-switcher";
import { logoutSession } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

export function Topbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, setTheme } = useAppTheme();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsAccountMenuOpen(false);
      accountButtonRef.current?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    setIsAccountMenuOpen(false);

    requestAnimationFrame(() => {
      accountButtonRef.current?.focus();
    });
  };

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);

    try {
      await logoutSession();
    } finally {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <header className="app-topbar relative z-[100] flex h-16 items-center justify-between overflow-visible border-b border-white/[0.05] bg-[#0b0b0f]/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-2xl sm:h-20 sm:px-8 sm:pt-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-120px] left-[10%] h-[220px] w-[220px] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute top-[-80px] right-[5%] h-[180px] w-[180px] rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <MobileSidebar />
      </div>

      <div className="relative z-20 flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-xl lg:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
          <span>
            {user ? `Bienvenue ${user.firstName}` : "Non connecté"}
          </span>
        </div>

        <NotificationCenter />

        <div ref={accountMenuRef} className="relative">
          <button
            ref={accountButtonRef}
            type="button"
            aria-label="Ouvrir le menu du compte"
            aria-haspopup="menu"
            aria-expanded={isAccountMenuOpen}
            onClick={() => setIsAccountMenuOpen((current) => !current)}
            className="app-account-trigger group relative flex items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <span className="absolute inset-0 rounded-full bg-violet-500/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" />

            <span className="relative h-11 w-11 overflow-hidden rounded-full border border-white/[0.08] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(139,92,246,0.25)] sm:h-12 sm:w-12">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`Avatar de ${user.firstName}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {user?.firstName?.charAt(0).toUpperCase() || "U"}
                </span>
              )}

              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.14),transparent_45%)]" />
            </span>

            <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-[#0b0b0f] bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />

            <ChevronDown
              size={15}
              aria-hidden="true"
              className={`hidden text-zinc-500 transition-transform duration-200 sm:block ${
                isAccountMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isAccountMenuOpen && (
            <div
              role="menu"
              aria-label="Menu du compte"
              className="app-account-menu absolute top-[calc(100%+12px)] right-0 z-[200] w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#15161e]/96 p-2 text-zinc-100 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
            >
              <div className="app-account-identity rounded-[18px] border border-white/[0.06] bg-white/[0.035] px-4 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.firstName || "Utilisateur Hovren"}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {user?.email || "Compte connecté"}
                </p>
              </div>

              <div className="px-2 pt-4 pb-2">
                <p className="text-[0.67rem] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                  Apparence
                </p>
              </div>

              <div
                role="radiogroup"
                aria-label="Choisir le thème de l’application"
                className="grid grid-cols-2 gap-2"
              >
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === "nature"}
                  onClick={() => handleThemeChange("nature")}
                  className={`app-account-theme-option relative flex min-h-20 flex-col items-start justify-between rounded-[18px] border p-3 text-left transition ${
                    theme === "nature"
                      ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-50"
                      : "border-white/[0.06] bg-white/[0.025] text-zinc-300 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <Leaf className="h-4 w-4" />
                    {theme === "nature" && <Check className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Nature</span>
                    <span className="mt-0.5 block text-[0.68rem] opacity-65">
                      Forêt & menthe
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === "violet"}
                  onClick={() => handleThemeChange("violet")}
                  className={`app-account-theme-option relative flex min-h-20 flex-col items-start justify-between rounded-[18px] border p-3 text-left transition ${
                    theme === "violet"
                      ? "border-violet-400/35 bg-violet-500/12 text-violet-50"
                      : "border-white/[0.06] bg-white/[0.025] text-zinc-300 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <Sparkles className="h-4 w-4" />
                    {theme === "violet" && <Check className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Violet</span>
                    <span className="mt-0.5 block text-[0.68rem] opacity-65">
                      Style original
                    </span>
                  </span>
                </button>
              </div>

              <div className="my-2 h-px bg-white/[0.07]" />

              <Link
                href="/parametres"
                role="menuitem"
                onClick={() => setIsAccountMenuOpen(false)}
                className="app-account-menu-item flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Paramètres du compte
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="app-account-menu-item app-account-logout mt-1.5 flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
