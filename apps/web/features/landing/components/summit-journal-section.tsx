import { ArrowUpRight, Award, Mountain, Trees } from "lucide-react";

export function SummitJournalSection() {
  return (
    <section
      id="sommets"
      className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
      aria-labelledby="summit-title"
    >
      <div className="pointer-events-none absolute -top-16 left-8 h-72 w-72 rounded-full bg-emerald-300/9 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(17,17,39,0.86),rgba(8,8,20,0.74)_48%,rgba(13,30,32,0.66))] p-5 shadow-[0_34px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(125,211,168,0.13),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(139,92,246,0.16),transparent_28%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-100 uppercase">
              Carnet des sommets
            </p>
            <h2
              id="summit-title"
              className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl"
            >
              Un carnet qui grandit avec chaque sommet.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
              HOVREN ne se limite pas à compter des kilomètres. L’app transforme
              tes sorties en souvenirs structurés : sommets validés, massifs
              explorés, badges débloqués et progression visible.
            </p>

            <article className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]">
              <div className="relative min-h-[18rem] p-6 sm:min-h-[20rem] sm:p-8">
                <div
                  data-discovery-image
                  className="absolute inset-0 bg-cover bg-center opacity-[0.76]"
                  style={{
                    backgroundImage:
                      "url('/landing/mountain-journal-green.svg')",
                  }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(7,7,19,0.82)_0%,rgba(9,9,24,0.60)_42%,rgba(17,17,39,0.26)_72%,rgba(47,122,99,0.18)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#070713]/92 via-[#070713]/58 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-[76%] bg-[radial-gradient(circle_at_12%_72%,rgba(7,7,19,0.88),rgba(7,7,19,0.46)_42%,transparent_72%)]" />

                <div className="relative flex min-h-[14rem] flex-col justify-end">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-emerald-100 uppercase">
                    <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
                    Dernière découverte
                  </span>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Mont Veyrier rejoint ton carnet
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                    1 291 m · Annecy · découvert lors d’une trace récente.
                  </p>
                  <a
                    href="/register"
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.075] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                  >
                    Voir le carnet
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-sm font-semibold text-slate-400">
                Progression
              </p>
              <p className="mt-3 text-5xl font-semibold tracking-tight text-white">
                33%
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-400 to-emerald-300" />
              </div>
              <p className="mt-3 text-sm text-slate-400">du carnet révélé</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-3">
                <Trees className="h-5 w-5 text-emerald-100" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-400">
                    Prochaine idée
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    Pointe de Talamarche
                  </p>
                  <p className="mt-1 text-sm text-slate-400">1 852 m · Bornes</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-violet-100" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-400">
                    Badge à viser
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    10 Sommets
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Un cap simple, visible, motivant.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
