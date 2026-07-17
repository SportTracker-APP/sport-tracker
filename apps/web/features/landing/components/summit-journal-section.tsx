import { ArrowUpRight, MapPin, Mountain, Route, Ruler } from "lucide-react";

const summitMarkers = [
  { value: "8", label: "sommets validés", accent: false },
  { value: "3", label: "massifs explorés", accent: false },
  { value: "33 %", label: "du carnet révélé", accent: true },
] as const;

export function SummitJournalSection() {
  return (
    <section
      id="sommets"
      className="relative mx-auto w-full max-w-7xl scroll-mt-28 px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
      aria-labelledby="summit-title"
    >
      <div className="pointer-events-none absolute -top-16 left-8 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="pointer-events-none absolute top-36 right-0 h-80 w-80 rounded-full bg-violet-400/14 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/7 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,15,37,0.96),rgba(7,7,20,0.92)_46%,rgba(8,24,34,0.8))] px-5 py-9 shadow-[0_42px_140px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:px-8 sm:py-11 lg:px-11 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_13%_18%,rgba(139,92,246,0.2),transparent_34%),radial-gradient(circle_at_86%_30%,rgba(125,211,168,0.15),transparent_31%),radial-gradient(circle_at_54%_100%,rgba(20,184,166,0.09),transparent_44%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:92px_92px] opacity-20" />
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
              className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Chaque sommet devient un repère.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300/95 sm:text-lg">
              HOVREN transforme tes sorties en souvenirs structurés : les lieux
              que tu atteins, les massifs que tu explores et les traces qui
              construisent ton histoire.
            </p>
          </header>

          <article className="relative mt-12 overflow-hidden rounded-[2.1rem] border border-white/[0.09] bg-[#070713] shadow-[0_38px_140px_rgba(0,0,0,0.42)]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.44]"
              style={{
                backgroundImage: "url('/landing/mountain-journal-green.svg')",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,7,19,0.98)_0%,rgba(16,14,38,0.9)_42%,rgba(9,31,41,0.42)_72%,rgba(7,7,19,0.68)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#070713]/98 via-[#070713]/42 to-transparent" />
            <div className="absolute -right-24 top-4 h-80 w-80 rounded-full bg-emerald-300/16 blur-3xl" />
            <div className="absolute -left-16 bottom-8 h-80 w-80 rounded-full bg-violet-400/17 blur-3xl" />
            <div className="absolute right-1/3 top-1/4 h-44 w-44 rounded-full bg-cyan-200/8 blur-3xl" />

            <svg
              className="absolute inset-x-0 bottom-0 h-56 w-full text-white/[0.052]"
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

            <div className="relative grid min-h-[30rem] gap-8 p-6 sm:p-8 lg:min-h-[33rem] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:p-10 xl:p-12">
              <div className="relative z-10 max-w-xl">
                <span className="inline-flex rounded-full border border-emerald-200/20 bg-emerald-300/12 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-emerald-100 shadow-[0_0_32px_rgba(110,231,183,0.12)] uppercase">
                  Dernière découverte
                </span>

                <p className="mt-12 text-sm font-semibold tracking-[0.22em] text-emerald-100/90 uppercase lg:mt-16">
                  Mont Veyrier
                </p>
                <h3 className="mt-3 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Mont Veyrier
                </h3>

                <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2">
                    <Ruler className="h-4 w-4 text-emerald-100" aria-hidden="true" />
                    1291 m
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2">
                    <MapPin className="h-4 w-4 text-emerald-100" aria-hidden="true" />
                    Annecy
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 uppercase tracking-[0.12em] text-slate-300">
                    <Route className="h-4 w-4 text-violet-200" aria-hidden="true" />
                    Trace récente
                  </span>
                </div>

                <a
                  href="/register"
                  className="group relative mt-8 inline-flex w-fit overflow-hidden rounded-2xl bg-gradient-to-r from-violet-300/70 via-emerald-200/70 to-violet-300/70 p-px text-sm font-bold text-white shadow-[0_18px_54px_rgba(125,211,168,0.12)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
                >
                  <span className="inline-flex items-center gap-2 rounded-[calc(1rem-1px)] bg-[#111126]/92 px-4 py-3 transition duration-200 group-hover:bg-[#17162f]/94">
                    Voir le carnet
                    <ArrowUpRight
                      className="h-4 w-4 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </a>
              </div>

              <div className="relative min-h-[20rem] overflow-hidden rounded-[1.8rem] border border-white/[0.055] bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:min-h-[25rem] lg:border-transparent lg:bg-transparent lg:shadow-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_26%,rgba(110,231,183,0.24),transparent_28%),radial-gradient(circle_at_36%_74%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_56%_55%,rgba(56,189,248,0.08),transparent_36%),linear-gradient(145deg,rgba(8,8,24,0.04),rgba(2,6,23,0.36))]" />
                <div className="absolute inset-y-8 left-6 right-0 rounded-[2rem] border border-white/[0.045] bg-white/[0.018] blur-[0.2px] lg:left-0" />
                <svg
                  className="absolute inset-0 h-full w-full text-white/[0.08]"
                  viewBox="0 0 640 430"
                  fill="none"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                >
                  <path d="M26 104c98-22 178-17 240 15 70 36 142 33 218-9 45-25 88-30 132-16" stroke="currentColor" strokeWidth="1" />
                  <path d="M18 152c108-28 206-24 294 14 82 36 160 34 234-4 43-22 82-25 118-10" stroke="currentColor" strokeWidth="0.85" />
                  <path d="M8 200c116-32 226-28 330 13 84 33 160 27 228-18 42-28 80-35 114-22" stroke="currentColor" strokeWidth="0.75" />
                </svg>
                <svg
                  className="absolute inset-x-0 bottom-0 h-[84%] w-full text-white/[0.095]"
                  viewBox="0 0 680 360"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M0 270l96-72 76 30 118-146 86 104 82-52 104 98 118-128v256H0z" fill="currentColor" />
                  <path d="M220 360l118-160 82 72 48-42 128 130H220z" fill="rgba(110,231,183,0.105)" />
                  <path d="M0 316c88-24 166-23 234 4 74 30 146 23 216-20 76-46 154-50 234-13" stroke="rgba(167,139,250,0.26)" strokeWidth="1.2" />
                  <path d="M24 340c110-26 204-22 282 12 68 29 132 22 192-22 56-41 112-48 168-20" stroke="rgba(125,211,168,0.24)" strokeWidth="1" />
                </svg>
                <div className="absolute right-8 bottom-8 rounded-full border border-emerald-200/18 bg-emerald-300/12 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-emerald-100 shadow-[0_0_40px_rgba(110,231,183,0.16)] uppercase">
                  Carnet vivant
                </div>
              </div>
            </div>
          </article>

          <div className="mt-12 text-center">
            <p className="mx-auto max-w-4xl text-2xl font-medium leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Ce n’est pas seulement un sommet validé. C’est une{" "}
              <span className="bg-gradient-to-r from-emerald-200 to-cyan-100 bg-clip-text text-transparent">
                trace
              </span>{" "}
              qui rejoint{" "}
              <span className="bg-gradient-to-r from-violet-100 via-white to-emerald-100 bg-clip-text text-transparent">
                ton histoire
              </span>
              .
            </p>

            <dl className="mx-auto mt-10 grid max-w-4xl gap-7 border-t border-white/[0.085] pt-8 sm:grid-cols-3 sm:gap-0">
              {summitMarkers.map((marker) => (
                <div
                  key={marker.label}
                  className="min-w-0 sm:border-l sm:border-white/[0.09] sm:first:border-l-0"
                >
                  <dt
                    className={
                      marker.accent
                        ? "bg-gradient-to-r from-emerald-200 via-cyan-100 to-violet-200 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl"
                        : "text-5xl font-semibold tracking-tight text-white sm:text-6xl"
                    }
                  >
                    {marker.value}
                  </dt>
                  <dd className="mt-2 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
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
