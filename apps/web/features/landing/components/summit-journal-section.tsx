import { ArrowUpRight, Mountain } from "lucide-react";

const summitMarkers = [
  { value: "8", label: "sommets validés" },
  { value: "3", label: "massifs explorés" },
  { value: "33 %", label: "du carnet révélé" },
] as const;

export function SummitJournalSection() {
  return (
    <section
      id="sommets"
      className="relative mx-auto w-full max-w-7xl scroll-mt-28 px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
      aria-labelledby="summit-title"
    >
      <div className="pointer-events-none absolute -top-16 left-8 h-72 w-72 rounded-full bg-emerald-300/9 blur-3xl" />
      <div className="pointer-events-none absolute top-36 right-0 h-80 w-80 rounded-full bg-violet-400/12 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2.15rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(16,16,38,0.92),rgba(7,7,19,0.84)_48%,rgba(13,25,35,0.72))] px-5 py-8 shadow-[0_34px_120px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(139,92,246,0.17),transparent_34%),radial-gradient(circle_at_84%_24%,rgba(125,211,168,0.12),transparent_30%),radial-gradient(circle_at_58%_100%,rgba(20,184,166,0.07),transparent_42%)]" />
        <svg
          className="pointer-events-none absolute top-4 right-0 h-96 w-[46rem] text-white/[0.035]"
          viewBox="0 0 760 420"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M52 92c120-34 232-28 336 18 110 48 214 44 326-16"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M34 148c138-40 270-33 390 21 122 54 220 48 304-7"
            stroke="currentColor"
          />
          <path
            d="M20 204c154-43 296-36 420 22 126 58 220 50 304-8"
            stroke="currentColor"
            strokeWidth="0.9"
          />
        </svg>

        <div className="relative">
          <header className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1.5 text-xs font-semibold tracking-[0.22em] text-emerald-100 uppercase">
              <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
              Sommets
            </p>
            <h2
              id="summit-title"
              className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Chaque sommet devient un repère.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              HOVREN transforme tes sorties en souvenirs structurés : les lieux
              que tu atteins, les massifs que tu explores et les traces qui
              construisent ton histoire.
            </p>
          </header>

          <article className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#080814] shadow-[0_30px_110px_rgba(0,0,0,0.34)]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.64]"
              style={{
                backgroundImage: "url('/landing/mountain-journal-green.svg')",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(7,7,19,0.93)_0%,rgba(21,17,45,0.72)_38%,rgba(11,36,39,0.35)_68%,rgba(7,7,19,0.5)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#070713]/96 via-[#070713]/54 to-transparent" />
            <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -left-16 bottom-8 h-64 w-64 rounded-full bg-violet-400/14 blur-3xl" />

            <svg
              className="absolute inset-x-0 bottom-0 h-52 w-full text-white/[0.055]"
              viewBox="0 0 1200 260"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 178l140-82 116 54 168-116 164 146 150-104 132 74 162-128 168 118v120H0z"
                fill="currentColor"
              />
              <path
                d="M72 188c112-30 228-28 350 7 145 42 282 37 414-14 118-45 218-47 300-6"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <path
                d="M128 220c128-27 244-22 348 13 120 40 232 34 336-18 114-57 226-60 336-8"
                stroke="currentColor"
                strokeWidth="0.9"
              />
            </svg>

            <div className="relative flex min-h-[30rem] flex-col justify-between p-6 sm:p-8 lg:min-h-[34rem] lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-emerald-100 uppercase">
                  Dernière découverte
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-slate-200 uppercase">
                  Trace récente
                </span>
              </div>

              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.18em] text-emerald-100/90 uppercase">
                  Mont Veyrier
                </p>
                <h3 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  rejoint ton carnet
                </h3>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-300 sm:text-base">
                  <span>1 291 m</span>
                  <span className="text-emerald-100/70">Annecy</span>
                  <span>découvert lors de ta dernière sortie</span>
                </div>
                <a
                  href="/register"
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                >
                  Voir le carnet
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>

          <div className="mt-9 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <p className="max-w-3xl text-2xl font-medium leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Ce n’est pas seulement un sommet validé. C’est une trace qui
              rejoint ton histoire.
            </p>

            <dl className="grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              {summitMarkers.map((marker) => (
                <div key={marker.label} className="min-w-0">
                  <dt className="text-3xl font-semibold tracking-tight text-white">
                    {marker.value}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-400">
                    {marker.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
