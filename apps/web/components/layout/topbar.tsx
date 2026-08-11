"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Mountain,
  Settings,
} from "lucide-react";

import { MobileSidebar } from "./mobile-sidebar";
import { NotificationCenter } from "./notification-center";

import { logoutSession } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import refugeShell from "./refuge-shell.module.css";

type TopbarProps = {
  variant?: "default" | "refuge";
};

export function Topbar({ variant = "default" }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

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

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);

    try {
      await logoutSession();
    } finally {
      logout();
      window.location.href = "/login";
    }
  };

  if (variant === "refuge") {
    return (
      <header className={refugeShell.topbar}>
        <div className={refugeShell.topbarStart}>
          <MobileSidebar variant="refuge" />
          <Link href="/refuge" className={refugeShell.topbarBrand}>
            <svg viewBox="0 0 48 34" aria-hidden="true" fill="none">
              <path
                d="M3 30 17 5l8 14 6-10 14 21"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
            <span>
              <strong>
                HOVREN<em>.fr</em>
              </strong>
              <small>Le carnet des sommets</small>
            </span>
          </Link>
          <span className={refugeShell.topbarLabel}>Carnet d’exploration</span>
        </div>

        <div className={refugeShell.topbarActions}>
          <div className={refugeShell.welcome}>
            <span className={refugeShell.welcomeDot} />
            {user ? `Bienvenue ${user.firstName}` : "Non connecté"}
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
              className={refugeShell.accountTrigger}
            >
              <span className={refugeShell.avatarWrap}>
                <span className={refugeShell.avatar}>
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={`Avatar de ${user.firstName}`}
                      fill
                      sizes="42px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    user?.firstName?.charAt(0).toUpperCase() || "H"
                  )}
                </span>
                <span className={refugeShell.onlineDot} />
              </span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={isAccountMenuOpen ? "rotate-180" : ""}
              />
            </button>

            {isAccountMenuOpen ? (
              <div
                role="menu"
                aria-label="Menu du compte"
                className={refugeShell.accountMenu}
              >
                <div className={refugeShell.accountIdentity}>
                  <span className={refugeShell.accountIdentityAvatar}>
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      user?.firstName?.charAt(0).toUpperCase() || "H"
                    )}
                  </span>
                  <span className={refugeShell.accountIdentityCopy}>
                    <p className="truncate text-sm font-semibold">
                      {user?.firstName || "Utilisateur HOVREN"}
                    </p>
                    <p className="mt-0.5 truncate text-xs">
                      {user?.email || "Compte connecté"}
                    </p>
                  </span>
                </div>

                <p className={refugeShell.menuHeading}>Mon espace</p>
                <Link
                  href="/refuge"
                  role="menuitem"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className={refugeShell.menuItem}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Mon Refuge
                </Link>
                <Link
                  href="/sommets"
                  role="menuitem"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className={refugeShell.menuItem}
                >
                  <Mountain className="h-4 w-4" />
                  Mes sommets
                </Link>

                <div className={refugeShell.menuDivider} />
                <Link
                  href="/parametres"
                  role="menuitem"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className={refugeShell.menuItem}
                >
                  <Settings className="h-4 w-4" />
                  Paramètres du compte
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className={`${refugeShell.menuItem} ${refugeShell.logout}`}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

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
          <span>{user ? `Bienvenue ${user.firstName}` : "Non connecté"}</span>
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
            className="app-account-trigger group relative flex items-center gap-1 rounded-full focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none"
          >
            <span className="absolute inset-0 rounded-full bg-violet-500/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" />

            <span className="relative block h-11 w-11 shrink-0 sm:h-12 sm:w-12">
              <span className="relative block h-full w-full overflow-hidden rounded-full border border-white/[0.08] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
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
            </span>

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
              className={refugeShell.accountMenu}
            >
              <div className={refugeShell.accountIdentity}>
                <span className={refugeShell.accountIdentityAvatar}>
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    user?.firstName?.charAt(0).toUpperCase() || "H"
                  )}
                </span>
                <span className={refugeShell.accountIdentityCopy}>
                  <p className="truncate text-sm font-semibold">
                    {user?.firstName || "Utilisateur HOVREN"}
                  </p>
                  <p className="mt-0.5 truncate text-xs">
                    {user?.email || "Compte connecté"}
                  </p>
                </span>
              </div>

              <p className={refugeShell.menuHeading}>Mon espace</p>
              <Link
                href="/refuge"
                role="menuitem"
                onClick={() => setIsAccountMenuOpen(false)}
                className={refugeShell.menuItem}
              >
                <LayoutDashboard className="h-4 w-4" />
                Mon Refuge
              </Link>
              <Link
                href="/sommets"
                role="menuitem"
                onClick={() => setIsAccountMenuOpen(false)}
                className={refugeShell.menuItem}
              >
                <Mountain className="h-4 w-4" />
                Mes sommets
              </Link>

              <div className={refugeShell.menuDivider} />

              <Link
                href="/parametres"
                role="menuitem"
                onClick={() => setIsAccountMenuOpen(false)}
                className={refugeShell.menuItem}
              >
                <Settings className="h-4 w-4" />
                Paramètres du compte
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className={`${refugeShell.menuItem} ${refugeShell.logout}`}
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
