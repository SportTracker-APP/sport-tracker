import { Award, MapPinned, Mountain, Route, Sparkles } from "lucide-react";

function MiniRoute() {
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="landing-route" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#b9f6d0" />
          <stop offset="100%" stopColor="#7dd3a8" />
        </linearGradient>
      </defs>
      <path
        d="M18 84 C38 28 76 102 102 54 C130 2 152 90 202 28"
        fill="none"
        stroke="url(#landing-route)"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <circle cx="18" cy="84" r="7" fill="#b9f6d0" />
      <circle cx="202" cy="28" r="7" fill="#7dd3a8" />
    </svg>
  );
}

const stats = [
  { label: "Sorties", value: "21" },
  { label: "D+", value: "12 480 m" },
  { label: "Badges", value: "16" },
] as const;

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[44rem] lg:mx-0 xl:max-w-[50rem] min-[1800px]:max-w-[58rem]">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-300/14 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/14 bg-[#0b1f19]/78 p-3 shadow-[0_40px_140px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="rounded-[1.5rem] border border-emerald-100/[0.09] bg-[#03110d]/84 p-4 min-[1536px]:p-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-emerald-100 uppercase">
                Refuge
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                Carnet des sommets
              </p>
            </div>
            <span className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              33% du carnet
            </span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-[0.86]"
                style={{
                  backgroundImage: "url('/landing/alpine-forest-card.png')",
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(3,17,13,0.80)_0%,rgba(7,23,19,0.52)_48%,rgba(20,61,54,0.16)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#03110d]/86 via-[#03110d]/34 to-transparent" />
              <div className="absolute inset-y-0 left-0 w-[82%] bg-[radial-gradient(circle_at_18%_38%,rgba(125,211,168,0.16),transparent_34%)]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-100 shadow-[0_0_28px_rgba(125,211,168,0.12)]">
                    <Mountain className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                      Dernière découverte
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      Mont Veyrier
                    </p>
                  </div>
                </div>
                <div className="mt-4 inline-flex rounded-full border border-emerald-200/14 bg-emerald-300/10 px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.14em] text-emerald-100 uppercase">
                  Sommet validé
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Mont Veyrier rejoint ton carnet après une trace au-dessus du
                  lac d’Annecy.
                </p>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  1 291 m · Annecy · découvert lors de ta dernière sortie
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/[0.09] bg-black/24 p-3 backdrop-blur-sm"
                    >
                      <p className="text-[0.65rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                    Trace récente
                  </p>
                  <Route className="h-4 w-4 text-emerald-100" aria-hidden="true" />
                </div>
                <div className="mt-4 h-28">
                  <MiniRoute />
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-100">
                    <Award className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Badge à viser
                    </p>
                    <p className="text-xs text-slate-400">10 Sommets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">
                  Progression du carnet
                </span>
                <span className="text-sm font-bold text-white">33%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-200 to-emerald-400" />
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-emerald-200" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Prochaine idée
                  </p>
                  <p className="text-xs text-slate-400">Pointe de Talamarche</p>
                </div>
                <Sparkles className="ml-auto h-4 w-4 text-emerald-100" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
