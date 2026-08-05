import Link from "next/link";

import { ArrowDown, ArrowRight, Compass, Play, ShieldCheck } from "lucide-react";

import { ProductPreview } from "./product-preview";

function MountainSilhouette() {
  return (
    <svg
      viewBox="0 0 1440 420"
      className="absolute inset-x-0 bottom-0 h-[28rem] w-full text-white/10"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 318 96 244l88 34 156-158 132 126 74-54 150 122 102-96 116 64 118-128 162 160 90-56 156 74v88H0z"
        fill="currentColor"
      />
      <path
        d="M0 366 150 270l132 46 176-94 162 116 154-170 178 168 142-80 180 92 166-118v190H0z"
        fill="rgba(125,211,168,0.08)"
      />
    </svg>
  );
}

export function LandingHero() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-5rem)] overflow-hidden px-5 pt-14 pb-20 sm:px-6 lg:min-h-[calc(100vh-5rem)] lg:px-10 lg:pt-16 lg:pb-16 2xl:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20rem] left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#2f7a63]/26 blur-3xl" />
        <div className="absolute top-32 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-emerald-200/14 blur-3xl" />
        <div className="absolute left-[-14rem] top-24 h-[34rem] w-[34rem] rounded-full bg-[#071713]/70 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(185,246,208,0.10),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:92px_92px] opacity-20" />
        <svg
          className="absolute top-24 right-0 h-[28rem] w-[48rem] text-emerald-100/[0.075]"
          viewBox="0 0 760 420"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M46 92c118-34 225-28 328 18 106 48 211 45 340-16"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M28 142c130-39 254-32 370 20 118 53 222 49 335-8"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M18 194c145-42 282-36 406 22 126 58 230 52 320-2"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
        <MountainSilhouette />
      </div>

      <div className="mx-auto grid w-full max-w-[118rem] items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] 2xl:gap-16">
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100/16 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold tracking-[0.22em] text-emerald-100 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Carnet outdoor intelligent
          </p>

          <h1 className="mt-7 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl min-[1536px]:text-[5.8rem] min-[1800px]:text-[6.45rem]">
            TES SOMMETS. TON HISTOIRE.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
            Suis tes traces, découvre tes sommets et mesure ta progression au
            fil de tes aventures.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#2f7a63] px-6 text-sm font-bold text-white shadow-[0_22px_60px_rgba(47,122,99,0.34)] transition hover:-translate-y-0.5 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
            >
              Créer mon carnet
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#fonctionnalites"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-emerald-100/12 bg-white/[0.045] px-6 text-sm font-bold text-slate-100 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-emerald-100/24 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Découvrir HOVREN
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
            {[
              "Synchronisation Strava",
              "Sommets validés",
              "Progression outdoor",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5"
              >
                <ShieldCheck
                  className="h-3.5 w-3.5 text-emerald-200"
                  aria-hidden="true"
                />
                {item}
              </span>
            ))}
          </div>
        </div>

        <ProductPreview />
      </div>

      <a
        href="#fonctionnalites"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-100/12 bg-white/[0.055] px-4 py-2 text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase backdrop-blur-xl transition hover:border-emerald-100/20 hover:bg-white/[0.085] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 lg:inline-flex"
      >
        Défiler
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </section>
  );
}
