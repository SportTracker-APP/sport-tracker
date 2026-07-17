import { Activity, Clock, Goal, Mountain, TrendingUp } from "lucide-react";

const metrics = [
  { label: "Distance totale", value: "286 km" },
  { label: "Dénivelé", value: "12 480 m" },
  { label: "Sorties", value: "21" },
  { label: "Temps d’activité", value: "39 h" },
] as const;

export function ProgressionSection() {
  return (
    <section
      id="progression"
      className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
      aria-labelledby="progression-title"
    >
      <div className="pointer-events-none absolute -top-10 right-8 h-72 w-72 rounded-full bg-violet-400/9 blur-3xl" />
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.22em] text-violet-200 uppercase">
            Progression personnelle
          </p>
          <h2
            id="progression-title"
            className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Des statistiques qui restent au service de l’aventure.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-400">
            HOVREN suit les chiffres importants sans voler la place au carnet :
            distance, D+, régularité, objectifs et rythme d’exploration.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/[0.07] bg-[linear-gradient(145deg,rgba(255,255,255,0.052),rgba(139,92,246,0.052),rgba(47,122,99,0.04))] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.4rem] border border-white/8 bg-[#111127]/70 p-5"
              >
                <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.4rem] border border-white/8 bg-[#111127]/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  Progression mensuelle
                </p>
                <TrendingUp className="h-5 w-5 text-emerald-100" aria-hidden="true" />
              </div>
              <div className="mt-6 flex h-32 items-end gap-2">
                {[34, 62, 46, 88, 54, 76, 92, 58, 70, 82].map((height, index) => (
                  <div
                    key={`${height}-${index}`}
                    className="flex-1 rounded-t-full bg-gradient-to-t from-violet-500/42 to-violet-300"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-emerald-200/12 bg-emerald-300/[0.07] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-100">
                  <Goal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Objectif en cours
                  </p>
                  <p className="text-xs text-slate-400">30 km cette semaine</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-300 to-violet-300" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                  4 traces
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
                  820 m
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  5 h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
