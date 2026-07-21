import Link from "next/link";

import { Mountain } from "lucide-react";

import { XSocialLink } from "./x-social-link";

export function LandingFooter() {
  return (
    <footer className="border-t border-emerald-900/10 px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-900/10 bg-emerald-50 text-emerald-700">
            <Mountain className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-950">HOVREN</p>
            <p className="text-sm text-slate-600">
              Carnet outdoor intelligent pour sorties, sommets et progression.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600">
          <a
            href="mailto:contact@hovren.fr"
            className="transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            contact@hovren.fr
          </a>
          <Link
            href="/conditions"
            className="transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            Conditions
          </Link>
          <Link
            href="/confidentialite"
            className="transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            Confidentialité
          </Link>
          <Link
            href="/login"
            className="transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            Connexion
          </Link>
          <XSocialLink className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/10 bg-white/70 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700/20 hover:bg-white hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" />
        </div>
      </div>
    </footer>
  );
}
