"use client";

import Link from "next/link";

import {
  Activity,
  ArrowUpRight,
  Bike,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Flame,
  Leaf,
  Map,
  Menu,
  Mountain,
  Plus,
  Route,
  Sprout,
  Timer,
  Trophy,
  Waves,
} from "lucide-react";

const navItems = ["Dashboard", "Activités", "Calendrier", "Objectifs"];

const statCards = [
  {
    label: "Distance",
    value: "124 km",
    detail: "+18 km cette semaine",
    icon: Route,
    tone: "text-emerald-600 bg-emerald-100",
  },
  {
    label: "Temps actif",
    value: "12h 40",
    detail: "Objectif presque atteint",
    icon: Timer,
    tone: "text-teal-600 bg-teal-100",
  },
  {
    label: "Dénivelé",
    value: "2 840 m",
    detail: "Très belle progression",
    icon: Mountain,
    tone: "text-lime-700 bg-lime-100",
  },
];

const activities = [
  {
    sport: "Trail",
    title: "Boucle forêt du matin",
    distance: "12,4 km",
    time: "1h 18",
    color: "bg-emerald-500",
  },
  {
    sport: "VTT",
    title: "Chemins du plateau",
    distance: "31,2 km",
    time: "2h 05",
    color: "bg-teal-500",
  },
  {
    sport: "Randonnée",
    title: "Sentier des crêtes",
    distance: "8,7 km",
    time: "1h 54",
    color: "bg-lime-500",
  },
];

function MiniSidebar({ variant }: { variant: "fresh" | "forest" | "meadow" }) {
  const isForest = variant === "forest";

  return (
    <aside
      className={`hidden min-h-[560px] w-[238px] shrink-0 flex-col justify-between rounded-[28px] p-5 lg:flex ${
        isForest
          ? "bg-[#0f241b] text-white shadow-[0_24px_70px_rgba(15,36,27,0.26)]"
          : "border border-emerald-100 bg-white text-slate-900 shadow-[0_22px_60px_rgba(15,118,78,0.10)]"
      }`}
    >
      <div>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isForest
                ? "bg-gradient-to-br from-emerald-300 to-lime-300 text-emerald-950"
                : "bg-gradient-to-br from-emerald-500 to-lime-400 text-white"
            }`}
          >
            <Leaf className="h-6 w-6" />
          </div>

          <div>
            <p className="text-base font-bold">HOVREN</p>
            <p
              className={`text-xs ${
                isForest ? "text-emerald-100/70" : "text-slate-400"
              }`}
            >
              Nature edition
            </p>
          </div>
        </div>

        <nav className="mt-10 space-y-2">
          {navItems.map((item, index) => (
            <div
              key={item}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ${
                index === 0
                  ? isForest
                    ? "bg-white text-emerald-950"
                    : "bg-emerald-50 text-emerald-700"
                  : isForest
                    ? "text-emerald-50/62"
                    : "text-slate-400"
              }`}
            >
              <span>{item}</span>
              {index === 0 && <CheckCircle2 className="h-4 w-4" />}
            </div>
          ))}
        </nav>
      </div>

      <div
        className={`rounded-3xl p-4 ${
          isForest
            ? "border border-white/10 bg-white/[0.06]"
            : "border border-emerald-100 bg-emerald-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-500" />
          <p className="text-sm font-bold">Strava connecté</p>
        </div>
        <p
          className={`mt-2 text-xs leading-5 ${
            isForest ? "text-emerald-50/64" : "text-slate-500"
          }`}
        >
          Synchronisation disponible.
        </p>
      </div>
    </aside>
  );
}

function HeaderBar({ forest = false }: { forest?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
          forest
            ? "border-white/10 bg-white/[0.06] text-white"
            : "border-emerald-100 bg-white text-emerald-700"
        }`}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
          forest
            ? "border-white/10 bg-white/[0.07] text-white"
            : "border-emerald-100 bg-white text-slate-700"
        }`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        Bonjour Thibaut
      </div>
    </div>
  );
}

function ActivityList({ forest = false }: { forest?: boolean }) {
  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.title}
          className={`flex items-center justify-between rounded-2xl border p-3 ${
            forest
              ? "border-white/10 bg-white/[0.06]"
              : "border-emerald-100 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${activity.color} text-white`}
            >
              {activity.sport === "VTT" ? (
                <Bike className="h-4 w-4" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
            </div>

            <div>
              <p
                className={`text-sm font-bold ${
                  forest ? "text-white" : "text-slate-900"
                }`}
              >
                {activity.title}
              </p>
              <p
                className={`text-xs ${
                  forest ? "text-emerald-50/58" : "text-slate-400"
                }`}
              >
                {activity.sport} · {activity.distance} · {activity.time}
              </p>
            </div>
          </div>

          <ChevronRight
            className={`h-4 w-4 ${forest ? "text-white/38" : "text-slate-300"}`}
          />
        </div>
      ))}
    </div>
  );
}

function FreshDashboard() {
  return (
    <section className="overflow-hidden rounded-[36px] border border-emerald-100 bg-[#f8fbf6] p-4 shadow-[0_30px_90px_rgba(21,128,61,0.12)]">
      <div className="flex gap-5">
        <MiniSidebar variant="fresh" />

        <main className="min-w-0 flex-1 rounded-[30px] bg-white p-5">
          <HeaderBar />

          <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-500 via-green-400 to-lime-300 p-7 text-white">
              <div className="absolute top-[-90px] right-[-80px] h-64 w-64 rounded-full bg-white/22 blur-2xl" />
              <div className="absolute bottom-[-120px] left-[20%] h-64 w-64 rounded-full bg-teal-700/18 blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                  <Leaf className="h-4 w-4" />
                  Respiration verte
                </div>

                <h2 className="mt-5 max-w-xl text-4xl leading-tight font-black">
                  Un dashboard plus frais, lumineux, proche du terrain.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">
                  Une base blanche très lisible, avec des rappels verts pour
                  évoquer la nature, les sorties outdoor et la progression.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-emerald-700 shadow-[0_16px_36px_rgba(6,95,70,0.22)]">
                    <Plus className="h-4 w-4" />
                    Nouvelle activité
                  </button>
                  <button className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-5 text-sm font-bold text-white backdrop-blur">
                    <CalendarDays className="h-4 w-4" />
                    Calendrier
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-emerald-600 uppercase">
                    Objectif semaine
                  </p>
                  <h3 className="mt-2 text-3xl font-black text-slate-950">
                    72%
                  </h3>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-sm">
                  <Trophy className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Variante très friendly : fond blanc, vert lumineux, beaucoup
                d’air et des cartes nettes.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_16px_40px_rgba(21,128,61,0.07)]"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{stat.detail}</p>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </section>
  );
}

function ForestDashboard() {
  return (
    <section className="overflow-hidden rounded-[36px] bg-[#eaf5ec] p-4 shadow-[0_30px_90px_rgba(20,83,45,0.14)]">
      <div className="flex gap-5">
        <MiniSidebar variant="forest" />

        <main className="min-w-0 flex-1 rounded-[30px] bg-[#f9fcf8] p-5">
          <HeaderBar />

          <div className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[390px] overflow-hidden rounded-[34px] bg-[#10251b] p-7 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.32),transparent_34%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(190,242,100,0.22),transparent_36%)]" />
              <div className="absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-[#08170f] to-transparent" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                  <Waves className="h-4 w-4" />
                  Forest glass
                </div>

                <h2 className="mt-5 max-w-xl text-4xl leading-tight font-black">
                  Premium nature, plus profond, mais toujours lumineux.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/70">
                  Une piste plus élégante : blanc autour, hero vert forêt,
                  glassmorphism léger et accents lime.
                </p>
              </div>

              <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Activités", "18"],
                  ["Temps", "30h"],
                  ["Calories", "3 833"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur"
                  >
                    <p className="text-xs text-emerald-50/58">{label}</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-emerald-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-emerald-600 uppercase">
                    Dernières sorties
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    Historique vivant
                  </h3>
                </div>
                <Map className="h-6 w-6 text-emerald-500" />
              </div>

              <div className="mt-5">
                <ActivityList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

function MeadowDashboard() {
  return (
    <section className="overflow-hidden rounded-[36px] border border-lime-100 bg-white p-4 shadow-[0_30px_90px_rgba(101,163,13,0.12)]">
      <main className="rounded-[30px] bg-gradient-to-br from-white via-lime-50/60 to-emerald-50 p-5">
        <HeaderBar />

        <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[34px] border border-lime-100 bg-white p-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-lime-300 to-emerald-400 text-white">
              <Sprout className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-4xl leading-tight font-black text-slate-950">
              Minimal, doux, très facile à lire.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Une option plus “app santé” : moins de profondeur, plus de
              blancheur, des verts doux et quelques accents chauds.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(5,150,105,0.22)]">
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
              <button className="inline-flex h-12 items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-5 text-sm font-bold text-emerald-800">
                <Leaf className="h-4 w-4" />
                Semaine
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Progression",
                value: "+12%",
                icon: ArrowUpRight,
                color: "from-emerald-500 to-lime-400",
              },
              {
                label: "Calories",
                value: "3 833",
                icon: Flame,
                color: "from-amber-400 to-lime-400",
              },
              {
                label: "Objectifs",
                value: "6",
                icon: Trophy,
                color: "from-teal-500 to-emerald-400",
              },
              {
                label: "Activités",
                value: "18",
                icon: Activity,
                color: "from-green-500 to-emerald-300",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-[30px] border border-lime-100 bg-white p-5 shadow-[0_14px_34px_rgba(101,163,13,0.08)]"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="mt-5 text-sm font-bold text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </section>
  );
}

export default function ThemeLabPage() {
  return (
    <div className="min-h-screen bg-[#f7faf4] px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1680px] space-y-8">
        <header className="flex flex-col gap-5 rounded-[34px] border border-emerald-100 bg-white p-6 shadow-[0_20px_70px_rgba(21,128,61,0.10)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <Leaf className="h-4 w-4" />
              Theme lab
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl leading-tight font-black tracking-tight text-slate-950 lg:text-5xl">
              Esquisses dashboard blanc & vert.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
              Trois pistes isolées pour tester une identité plus nature, claire
              et friendly sans remplacer le thème actuel.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-12 w-fit items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_16px_34px_rgba(5,150,105,0.22)]"
          >
            Retour dashboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="space-y-10">
          <div>
            <p className="mb-3 text-sm font-black tracking-[0.18em] text-emerald-700 uppercase">
              Direction 1 · Fresh white
            </p>
            <FreshDashboard />
          </div>

          <div>
            <p className="mb-3 text-sm font-black tracking-[0.18em] text-emerald-700 uppercase">
              Direction 2 · Forest glass
            </p>
            <ForestDashboard />
          </div>

          <div>
            <p className="mb-3 text-sm font-black tracking-[0.18em] text-emerald-700 uppercase">
              Direction 3 · Meadow minimal
            </p>
            <MeadowDashboard />
          </div>
        </div>
      </div>
    </div>
  );
}
