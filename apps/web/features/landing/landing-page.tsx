import { LandingFooter } from "./components/landing-footer";
import { LandingHeader } from "./components/landing-header";
import { LandingHero } from "./components/landing-hero";
import { FeatureCard } from "./components/feature-card";
import { HowItWorksSection } from "./components/how-it-works-section";
import { ProgressionSection } from "./components/progression-section";
import { SummitJournalSection } from "./components/summit-journal-section";
import {
  BarChart3,
  CheckCircle2,
  Compass,
  Footprints,
  Map,
  Mountain,
  RefreshCw,
  Route,
} from "lucide-react";

const features = [
  {
    title: "Synchronisation Strava",
    description:
      "Retrouve tes activités sans tout ressaisir. HOVREN transforme tes sorties importées en carnet d’exploration.",
    icon: RefreshCw,
  },
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

const summitCollectionSteps = [
  {
    title: "À découvrir",
    description: "Les sommets du catalogue attendent ta prochaine trace.",
    icon: Map,
  },
  {
    title: "Révélé",
    description: "Une sortie passe près d’un sommet : HOVREN le repère.",
    icon: Route,
  },
  {
    title: "Validé",
    description: "Le sommet rejoint ta liste et reste dans ton carnet.",
    icon: CheckCircle2,
  },
] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03110d] text-slate-50 selection:bg-emerald-300/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(47,122,99,0.36),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(185,246,208,0.14),transparent_28%),radial-gradient(circle_at_52%_40%,rgba(70,42,132,0.18),transparent_38%),linear-gradient(180deg,#03110d_0%,#071713_46%,#03110d_100%)]" />
      <LandingHeader />
      <LandingHero />

      <section
        id="fonctionnalites"
        className="relative mx-auto grid w-full max-w-7xl gap-4 px-5 py-14 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-20 xl:grid-cols-5"
        aria-labelledby="landing-features-title"
      >
        <div className="pointer-events-none absolute -top-24 right-8 h-72 w-72 rounded-full bg-emerald-300/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 left-0 h-64 w-64 rounded-full bg-[#2f7a63]/16 blur-3xl" />
        <div className="lg:col-span-3 xl:col-span-5">
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

      <section className="relative mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/[0.12] bg-[linear-gradient(135deg,rgba(7,23,19,0.96),rgba(16,42,34,0.82)_52%,rgba(8,18,27,0.66))] p-6 shadow-[0_30px_110px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute -top-24 right-16 h-72 w-72 rounded-full bg-emerald-200/13 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-[#2f7a63]/18 blur-3xl" />
          <svg
            className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 text-white/[0.045]"
            viewBox="0 0 620 360"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M58 86c90-22 169-18 244 12 78 31 154 33 255-8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M36 132c108-30 204-25 286 12 88 40 168 40 258-2"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M24 184c126-34 238-29 334 14 96 43 174 38 238-5"
              stroke="currentColor"
              strokeWidth="0.9"
            />
            <path
              d="M0 280 98 230l72 25 110-82 92 78 74-46 88 70 86-36v121H0z"
              fill="currentColor"
              opacity="0.55"
            />
          </svg>

          <div className="relative grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100/15 bg-emerald-300/9 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-emerald-100 uppercase">
              <Route className="h-3.5 w-3.5" aria-hidden="true" />
              Positionnement
            </p>
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Pas une app de performance de plus.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                HOVREN ne cherche pas seulement à compter tes kilomètres.
                L’app transforme tes sorties en repères : lieux explorés,
                sommets validés, souvenirs structurés et progression visible.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <SummitJournalSection />
      <section className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/[0.12] bg-[linear-gradient(135deg,rgba(11,31,25,0.9),rgba(16,42,34,0.62)_48%,rgba(3,17,13,0.86))] px-6 py-8 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute -right-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#2f7a63]/18 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1.5 text-xs font-semibold tracking-[0.2em] text-emerald-100 uppercase">
                <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
                Collection
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Ta liste de sommets se remplit sortie après sortie.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Comme un carnet de collection outdoor : chaque sommet parcouru
                devient un repère clair, retrouvé plus tard avec son massif, sa
                trace et ton souvenir.
              </p>
            </div>

            <ol className="grid gap-4 sm:grid-cols-3">
              {summitCollectionSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.title}
                    className="relative border-t border-white/[0.09] pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5 sm:first:border-l-0"
                  >
                    <span className="text-xs font-semibold tracking-[0.18em] text-emerald-100/80 uppercase">
                      0{index + 1}
                    </span>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.055] text-emerald-100">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <strong className="text-base font-semibold text-white">
                        {step.title}
                      </strong>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {step.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
      <ProgressionSection />

      <section className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/[0.13] bg-[linear-gradient(135deg,rgba(11,31,25,0.86),rgba(7,23,19,0.66),rgba(8,18,27,0.8))] px-6 py-12 shadow-[0_34px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-10 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(125,211,168,0.18),transparent_28%),radial-gradient(circle_at_12%_82%,rgba(47,122,99,0.28),transparent_34%)]" />
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
              Connecte tes sorties existantes, valide tes sommets et commence à
              construire ton carnet outdoor avec HOVREN.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#2f7a63] px-6 text-sm font-bold text-white shadow-[0_18px_48px_rgba(47,122,99,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
              >
                Créer mon carnet
              </a>
              <a
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-100/14 bg-white/[0.045] px-6 text-sm font-bold text-slate-100 transition hover:-translate-y-0.5 hover:border-emerald-100/24 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
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
