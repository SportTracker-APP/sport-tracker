"use client";

import { useState } from "react";

import Link from "next/link";

import { Menu, Mountain, X } from "lucide-react";

const navigationLinks = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Carnet", href: "#carnet" },
  { label: "Sommets", href: "#sommets" },
  { label: "Progression", href: "#progression" },
] as const;

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070713]/72 backdrop-blur-2xl">
      <nav
        className="mx-auto flex h-20 w-full max-w-[118rem] items-center justify-between px-5 sm:px-6 lg:px-10 2xl:px-12"
        aria-label="Navigation publique"
      >
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
          aria-label="Accueil HOVREN"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition group-hover:border-violet-300/28">
            <Mountain className="h-5 w-5 text-violet-200" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-[0.08em] text-white">
              HOVREN
            </span>
            <span className="block text-xs text-slate-400">
              Carnet outdoor
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg text-sm font-medium text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-slate-100 transition hover:border-white/18 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-violet-500 px-5 text-sm font-bold text-white shadow-[0_16px_42px_rgba(139,92,246,0.28)] transition hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
          >
            Créer mon carnet
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-100 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 lg:hidden"
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-white/[0.06] bg-[#090916]/96 px-5 py-5 shadow-2xl lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                onClick={() => setIsOpen(false)}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-violet-500 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                onClick={() => setIsOpen(false)}
              >
                Créer mon carnet
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
