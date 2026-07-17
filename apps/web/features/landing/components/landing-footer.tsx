import Link from "next/link";

import { Mountain } from "lucide-react";

import { XSocialLink } from "./x-social-link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.07] px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-violet-100">
            <Mountain className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-semibold text-white">HOVREN</p>
            <p className="text-sm text-slate-400">
              Carnet outdoor intelligent pour sorties, sommets et progression.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-400">
          <a
            href="mailto:contact@hovren.fr"
            className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
          >
            contact@hovren.fr
          </a>
          <Link
            href="/conditions"
            className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
          >
            Conditions
          </Link>
          <Link
            href="/confidentialite"
            className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
          >
            Confidentialité
          </Link>
          <Link
            href="/login"
            className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
          >
            Connexion
          </Link>
          <XSocialLink className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.075] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200" />
        </div>
      </div>
    </footer>
  );
}
