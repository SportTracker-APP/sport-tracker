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
      <div className="pointer-events-none absolute -top-10 right-8 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.22em] text-emerald-700 uppercase">
            Progression personnelle
          </p>
          <h2
            id="progression-title"
            className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl"
          >
            Des statistiques qui restent au service de l’aventure.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            HOVREN suit les chiffres importants sans voler la place au carnet :
            distance, D+, régularité, objectifs et rythme d’exploration.
          </p>
        </div>

        <div className="rounded-[2rem] border border-emerald-900/10 bg-white/82 p-5 shadow-[0_24px_70px_rgba(15,64,49,0.14)] backdrop-blur-2xl sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.4rem] border border-emerald-900/10 bg-[#f5fbf6] p-5"
              >
                <p className="text-xs font-bold tracking-[0.18em] text-emerald-800/70 uppercase">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.4rem] border border-emerald-900/10 bg-[#f5fbf6] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950">
                  Progression mensuelle
                </p>
                <TrendingUp className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              </div>
              <div className="mt-6 flex h-32 items-end gap-2">
                {[34, 62, 46, 88, 54, 76, 92, 58, 70, 82].map((height, index) => (
                  <div
                    key={`${height}-${index}`}
                    className="flex-1 rounded-t-full bg-gradient-to-t from-[#2f7a63]/55 to-emerald-200"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-emerald-900/10 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <Goal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Objectif en cours
                  </p>
                  <p className="text-xs text-slate-600">30 km cette semaine</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-900/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-200 to-emerald-400" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-slate-600">
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
