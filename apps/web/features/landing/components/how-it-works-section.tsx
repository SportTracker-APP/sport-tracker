import { BookOpen, Flag, Mountain, RefreshCw } from "lucide-react";

const steps = [
  {
    title: "Connecte Strava",
    description:
      "Importe tes sorties automatiquement et retrouve tes traces dans HOVREN.",
    icon: RefreshCw,
  },
  {
    title: "HOVREN révèle tes sommets",
    description:
      "Tes activités deviennent des repères : sommets validés, massifs explorés, lieux atteints.",
    icon: Mountain,
  },
  {
    title: "Construis ton carnet",
    description:
      "Chaque sortie enrichit ton historique outdoor avec badges, progression et souvenirs.",
    icon: BookOpen,
  },
  {
    title: "Suis ta progression",
    description:
      "Visualise ce que tu explores vraiment, sortie après sortie.",
    icon: Flag,
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="carnet"
      className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
      aria-labelledby="how-title"
    >
      <div className="pointer-events-none absolute right-6 top-10 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold tracking-[0.22em] text-violet-200 uppercase">
            Comment ça marche
          </p>
          <h2
            id="how-title"
            className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Une sortie devient une page de ton histoire.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
            HOVREN garde le produit simple : tu bouges, l’app structure ce que
            tes traces racontent déjà.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="relative overflow-hidden rounded-[1.65rem] border border-white/[0.065] bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.055]"
              >
                <div className="absolute top-5 right-5 text-5xl font-semibold text-white/[0.035]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/14 bg-emerald-300/9 text-emerald-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="relative mt-6 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="relative mt-3 text-sm leading-7 text-slate-400">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
