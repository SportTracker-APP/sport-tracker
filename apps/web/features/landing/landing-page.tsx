import { LandingFooter } from "./components/landing-footer";
import { LandingHeader } from "./components/landing-header";
import { LandingHero } from "./components/landing-hero";
import { FeatureCard } from "./components/feature-card";
import { HowItWorksSection } from "./components/how-it-works-section";
import { ProgressionSection } from "./components/progression-section";
import { SummitJournalSection } from "./components/summit-journal-section";
import {
  BarChart3,
  Compass,
  Footprints,
  Map,
  Mountain,
} from "lucide-react";

const features = [
  {
    title: "Suis tes sorties",
    description:
      "Distance, durée, dénivelé, rythme et historique : garde une trace claire de chaque aventure.",
    icon: Footprints,
  },
  {
    title: "Construis ton carnet",
    description:
      "Chaque sommet validé enrichit ton histoire et révèle ta progression outdoor.",
    icon: Mountain,
  },
  {
    title: "Explore plus loin",
    description:
      "Repère de nouveaux massifs, retrouve tes lieux favoris et prépare tes prochaines sorties.",
    icon: Map,
  },
  {
    title: "Mesure ta progression",
    description:
      "Objectifs, badges et statistiques t’aident à visualiser ce que tu accomplis vraiment.",
    icon: BarChart3,
  },
] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070713] text-slate-50 selection:bg-violet-400/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(139,92,246,0.28),transparent_32%),radial-gradient(circle_at_80%_12%,rgba(47,122,99,0.22),transparent_30%),linear-gradient(180deg,#070713_0%,#0b0a1a_44%,#070713_100%)]" />
      <LandingHeader />
      <LandingHero />

      <section
        id="fonctionnalites"
        className="relative mx-auto grid w-full max-w-7xl gap-4 px-5 py-14 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-20"
        aria-labelledby="landing-features-title"
      >
        <div className="pointer-events-none absolute -top-24 right-8 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 left-0 h-64 w-64 rounded-full bg-emerald-300/8 blur-3xl" />
        <div className="lg:col-span-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1.5 text-xs font-semibold tracking-[0.22em] text-emerald-100 uppercase">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Exploration guidée
          </p>
          <h2
            id="landing-features-title"
            className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Tout ce qui donne une forme à tes aventures.
          </h2>
        </div>

        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <HowItWorksSection />
      <section className="relative mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[linear-gradient(135deg,rgba(139,92,246,0.12),rgba(47,122,99,0.07))] px-6 py-8 shadow-[0_26px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-10">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_50%,rgba(125,211,168,0.14),transparent_42%)]" />
          <p className="relative max-w-4xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Chaque sortie laisse une trace. HOVREN t’aide à la garder vivante.
          </p>
          <p className="relative mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Pas seulement des chiffres : des lieux, des crêtes, des repères et
            des souvenirs qui prennent forme au fil du carnet.
          </p>
        </div>
      </section>
      <SummitJournalSection />
      <ProgressionSection />

      <section className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] px-6 py-12 shadow-[0_34px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-10 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(125,211,168,0.16),transparent_28%),radial-gradient(circle_at_12%_82%,rgba(139,92,246,0.24),transparent_34%)]" />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-50"
            aria-hidden="true"
          >
            <svg viewBox="0 0 1200 160" className="h-full w-full" role="img">
              <path
                d="M0 118 140 72l100 32 110-60 126 74 112-43 112 54 140-82 132 72 102-37 126 42v36H0z"
                fill="rgba(248,250,252,0.08)"
              />
              <path
                d="M0 138 180 96l126 32 138-55 158 73 128-46 132 60 166-73 172 63v30H0z"
                fill="rgba(125,211,168,0.09)"
              />
            </svg>
          </div>

          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-100 uppercase">
              Ouvre ton refuge
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Prêt à ouvrir ton carnet outdoor ?
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Commence à suivre tes sorties, valide tes sommets et construis ton
              histoire avec HOVREN.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-violet-500 px-6 text-sm font-bold text-white shadow-[0_18px_48px_rgba(139,92,246,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              >
                Créer mon carnet
              </a>
              <a
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.045] px-6 text-sm font-bold text-slate-100 transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              >
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
