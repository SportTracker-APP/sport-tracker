"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Activity,
  ArrowUpRight,
  Bike,
  Compass,
  Footprints,
  Layers3,
  Map as MapIcon,
  MapPinned,
  Mountain,
  Route,
  Sparkles,
  Trees,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { useActivities } from "@/hooks/use-activities";
import type { Activity as SportActivity } from "@/lib/activities";

type Point = {
  lat: number;
  lng: number;
};

type ProjectedPoint = Point & {
  x: number;
  y: number;
};

type ProjectedRoute = {
  id: string;
  title: string;
  sport: string;
  path: string;
  points: ProjectedPoint[];
  distance: number;
  duration: number;
  elevationGain: number;
  startedAt: string;
  city: string | null;
};

const OUTDOOR_SPORTS = new Set([
  "RUNNING",
  "TRAIL",
  "HIKING",
  "WALKING",
  "MTB",
  "ROAD_CYCLING",
  "GRAVEL",
]);

const filters = [
  { label: "Toutes", value: "ALL", icon: Sparkles },
  { label: "Course", value: "RUNNING", icon: Footprints },
  { label: "Trail", value: "TRAIL", icon: Mountain },
  { label: "Rando", value: "HIKING", icon: Trees },
  { label: "Vélo", value: "BIKE", icon: Bike },
];

function decodePolyline(polyline: string) {
  const points: Point[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

function formatDistance(distance: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance);
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  return `${Math.floor(minutes / 60)}H${String(minutes % 60).padStart(2, "0")}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(date));
}

function getSportLabel(sport: string) {
  const labels: Record<string, string> = {
    FITNESS: "Fitness",
    GRAVEL: "Gravel",
    GYM: "Muscu",
    HIKING: "Randonnée",
    MTB: "VTT",
    ROAD_CYCLING: "Cyclisme",
    RUNNING: "Course",
    TRAIL: "Trail",
    WALKING: "Marche",
  };

  return labels[sport] ?? "Sortie";
}

function getSportTone(sport: string) {
  if (sport === "RUNNING") {
    return {
      stroke: "#38bdf8",
      glow: "rgba(56,189,248,0.34)",
      label: "Course",
    };
  }

  if (sport === "TRAIL" || sport === "HIKING") {
    return {
      stroke: "#84cc16",
      glow: "rgba(132,204,22,0.38)",
      label: getSportLabel(sport),
    };
  }

  if (["MTB", "ROAD_CYCLING", "GRAVEL"].includes(sport)) {
    return {
      stroke: "#22c55e",
      glow: "rgba(34,197,94,0.34)",
      label: getSportLabel(sport),
    };
  }

  return {
    stroke: "#a78bfa",
    glow: "rgba(167,139,250,0.30)",
    label: getSportLabel(sport),
  };
}

function matchesFilter(route: ProjectedRoute, selectedFilter: string) {
  if (selectedFilter === "ALL") {
    return true;
  }

  if (selectedFilter === "BIKE") {
    return ["MTB", "ROAD_CYCLING", "GRAVEL"].includes(route.sport);
  }

  if (selectedFilter === "HIKING") {
    return ["HIKING", "WALKING"].includes(route.sport);
  }

  return route.sport === selectedFilter;
}

function getRouteData(activities: SportActivity[]) {
  const decodedRoutes = activities
    .filter(
      (activity) =>
        activity.status !== "PLANNED" &&
        activity.routePolyline &&
        OUTDOOR_SPORTS.has(activity.sport),
    )
    .map((activity) => {
      const points = decodePolyline(activity.routePolyline || "");

      return {
        activity,
        points,
      };
    })
    .filter((route) => route.points.length > 1);

  const allPoints = decodedRoutes.flatMap((route) => route.points);

  if (allPoints.length === 0) {
    return {
      routes: [] as ProjectedRoute[],
      points: [] as Point[],
    };
  }

  const minLat = Math.min(...allPoints.map((point) => point.lat));
  const maxLat = Math.max(...allPoints.map((point) => point.lat));
  const minLng = Math.min(...allPoints.map((point) => point.lng));
  const maxLng = Math.max(...allPoints.map((point) => point.lng));
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const padding = 6;

  function project(point: Point) {
    return {
      ...point,
      x: padding + ((point.lng - minLng) / lngSpan) * (100 - padding * 2),
      y: padding + ((maxLat - point.lat) / latSpan) * (100 - padding * 2),
    };
  }

  const routes = decodedRoutes.map(({ activity, points }) => {
    const projectedPoints = points.map(project);

    return {
      id: activity.id,
      title: activity.title || "Sortie sans titre",
      sport: activity.sport,
      path: projectedPoints
        .map(
          (point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(
              2,
            )}`,
        )
        .join(" "),
      points: projectedPoints,
      distance: activity.distance || 0,
      duration: activity.duration,
      elevationGain: activity.elevationGain || 0,
      startedAt: activity.startedAt,
      city: activity.city,
    };
  });

  return {
    routes,
    points: allPoints,
  };
}

function getMapMood(routes: ProjectedRoute[]) {
  const distance = routes.reduce((total, route) => total + route.distance, 0);
  const elevation = routes.reduce(
    (total, route) => total + route.elevationGain,
    0,
  );

  if (routes.length === 0) {
    return "Synchronise Strava et la carte commence à respirer.";
  }

  if (elevation >= 10_000) {
    return "Les reliefs commencent sérieusement à porter ton nom.";
  }

  if (distance >= 250) {
    return "Le terrain de jeu s’agrandit. Le GPS a arrêté de poser des questions.";
  }

  return "Chaque trace débloque un bout de territoire.";
}

export default function MapPage() {
  const { data: activities = [], isLoading, error } = useActivities();
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const completedActivities = useMemo(
    () => activities.filter((activity) => activity.status !== "PLANNED"),
    [activities],
  );

  const routeData = useMemo(
    () => getRouteData(completedActivities),
    [completedActivities],
  );

  const filteredRoutes = useMemo(
    () =>
      routeData.routes
        .filter((route) => matchesFilter(route, selectedFilter))
        .sort(
          (firstRoute, secondRoute) =>
            new Date(secondRoute.startedAt).getTime() -
            new Date(firstRoute.startedAt).getTime(),
        ),
    [routeData.routes, selectedFilter],
  );

  const selectedRoute =
    filteredRoutes.find((route) => route.id === selectedRouteId) ??
    filteredRoutes[0] ??
    null;

  const totalExploredDistance = filteredRoutes.reduce(
    (total, route) => total + route.distance,
    0,
  );

  const totalElevation = filteredRoutes.reduce(
    (total, route) => total + route.elevationGain,
    0,
  );

  const startZones = new Set(
    filteredRoutes
      .map((route) => route.points[0])
      .filter(Boolean)
      .map((point) => `${point.lat.toFixed(2)},${point.lng.toFixed(2)}`),
  ).size;

  const featuredRoutes = filteredRoutes
    .slice()
    .sort((a, b) => b.elevationGain - a.elevationGain)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="app-map-page space-y-6">
        <section className="app-premium-surface relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#151720]/92 p-6 backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,16,24,0.92),rgba(12,36,28,0.70),rgba(6,12,20,0.92))]" />
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=1800')] bg-cover bg-center opacity-[0.24]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.22),transparent_35%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_38%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                <MapIcon className="h-3.5 w-3.5" />
                Carte outdoor
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
                Vos traces dessinent votre territoire.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-200/82 md:text-base">
                Course au bord du lac, trail, rando ou vélo : chaque activité
                ajoute une ligne à votre carte personnelle. Ici, on voit ce que
                vous avez déjà exploré et ce qu’il reste à aller chercher.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-black/28 p-5 backdrop-blur-xl">
              <p className="text-xs tracking-[0.18em] text-emerald-100/70 uppercase">
                Humeur du terrain
              </p>
              <p className="mt-3 text-lg font-semibold leading-7 text-white">
                {getMapMood(routeData.routes)}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                  <p className="text-xs text-zinc-300">Traces</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {routeData.routes.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                  <p className="text-xs text-zinc-300">Zones</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {startZones}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="app-premium-surface rounded-[28px] border border-white/[0.08] bg-[#181922]/90 p-8 text-center text-zinc-400">
            Chargement de la carte...
          </div>
        )}

        {error && (
          <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-8 text-center text-red-300">
            Impossible de charger vos parcours.
          </div>
        )}

        {!isLoading && !error && (
          <>
            <section className="app-premium-surface app-map-control-panel rounded-[28px] border border-white/[0.08] bg-[#181922]/90 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = selectedFilter === filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => {
                          setSelectedFilter(filter.value);
                          setSelectedRouteId(null);
                        }}
                        data-active={isActive}
                        className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                          isActive
                            ? "border-emerald-400/30 bg-emerald-500/18 text-emerald-100"
                            : "border-white/[0.08] bg-white/[0.035] text-zinc-400 hover:border-white/15 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-sm text-zinc-400">
                  {filteredRoutes.length} trace
                  {filteredRoutes.length > 1 ? "s" : ""} affichée
                  {filteredRoutes.length > 1 ? "s" : ""}
                </p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Distance affichée",
                  value: `${formatDistance(totalExploredDistance)} km`,
                  detail: "Selon le filtre actif",
                  icon: Route,
                },
                {
                  label: "D+ visible",
                  value: `${new Intl.NumberFormat("fr-FR").format(
                    Math.round(totalElevation),
                  )} m`,
                  detail: "Relief cumulé des traces",
                  icon: Mountain,
                },
                {
                  label: "Départs détectés",
                  value: startZones.toString(),
                  detail: "Secteurs distincts",
                  icon: MapPinned,
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="app-premium-surface rounded-[26px] border border-white/[0.08] bg-[#181922]/90 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-zinc-400">{stat.label}</p>
                        <p className="mt-3 text-3xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          {stat.detail}
                        </p>
                      </div>
                      <div className="app-dashboard-green-icon flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="app-premium-surface app-explorer-map relative min-h-[680px] overflow-hidden rounded-[36px] border border-white/[0.08] bg-[#0c1116] p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(132,204,22,0.22),transparent_24%),radial-gradient(circle_at_76%_28%,rgba(14,165,233,0.16),transparent_28%),linear-gradient(135deg,#111827,#172018_48%,#07111b)]" />
                <div className="absolute inset-0 opacity-[0.20] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:88px_88px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(0,0,0,0.42)_100%)]" />

                <div className="absolute inset-x-8 top-28 h-36 rotate-[-5deg] rounded-[100%] bg-emerald-300/8 blur-2xl" />
                <div className="absolute right-12 bottom-14 h-44 w-64 rotate-[-12deg] rounded-[100%] bg-sky-300/8 blur-2xl" />

                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-emerald-200/70 uppercase">
                      Exploration live
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Carte des traces
                    </h2>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/28 px-3 py-1.5 text-xs text-white/70">
                    <Layers3 className="h-3.5 w-3.5 text-emerald-300" />
                    Relief stylisé
                  </div>
                </div>

                {filteredRoutes.length > 0 ? (
                  <div className="relative mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-black/18">
                    <svg
                      viewBox="0 0 100 100"
                      className="h-[540px] w-full overflow-visible"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <filter id="premiumRouteGlow">
                          <feGaussianBlur stdDeviation="1.1" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient
                          id="fogGradient"
                          x1="0"
                          x2="1"
                          y1="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                      </defs>

                      {Array.from({ length: 12 }).map((_, index) => (
                        <path
                          key={`contour-${index}`}
                          d={`M ${4 + index * 2} ${18 + index * 5} C ${
                            20 + index
                          } ${6 + index * 2}, ${42 + index * 1.5} ${
                            40 + index * 2
                          }, ${96 - index} ${22 + index * 4}`}
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="0.18"
                        />
                      ))}

                      {filteredRoutes.map((route) => {
                        const tone = getSportTone(route.sport);
                        const isSelected = selectedRoute?.id === route.id;

                        return (
                          <g
                            key={route.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedRouteId(route.id)}
                          >
                            <path
                              d={route.path}
                              fill="none"
                              stroke={tone.glow}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={isSelected ? 2.2 : 1.35}
                              opacity={isSelected ? 0.95 : 0.26}
                              filter="url(#premiumRouteGlow)"
                            />
                            <path
                              d={route.path}
                              fill="none"
                              stroke={tone.stroke}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={isSelected ? 0.92 : 0.56}
                              opacity={isSelected ? 1 : 0.72}
                            />
                          </g>
                        );
                      })}

                      {filteredRoutes.slice(0, 26).map((route) => {
                        const start = route.points[0];
                        const isSelected = selectedRoute?.id === route.id;

                        return (
                          <circle
                            key={`${route.id}-start`}
                            cx={start.x}
                            cy={start.y}
                            r={isSelected ? 1.15 : 0.72}
                            fill={isSelected ? "#fef08a" : "#bef264"}
                            stroke="#0f172a"
                            strokeWidth="0.24"
                          />
                        );
                      })}
                    </svg>

                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_18%,rgba(0,0,0,0.24))]" />
                    <div className="pointer-events-none absolute top-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-xl">
                      {selectedRoute
                        ? `${getSportLabel(selectedRoute.sport)} · ${formatDistance(
                            selectedRoute.distance,
                          )} km`
                        : "Sélectionnez une trace"}
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-5 flex h-[540px] items-center justify-center rounded-[30px] border border-dashed border-white/10 bg-black/22 text-center">
                    <div>
                      <Compass className="mx-auto h-10 w-10 text-zinc-500" />
                      <p className="mt-4 font-semibold text-white">
                        Aucune trace disponible
                      </p>
                      <p className="mt-2 max-w-sm text-sm text-zinc-400">
                        Synchronisez Strava ou ajoutez des activités avec un
                        tracé pour alimenter cette carte.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="app-premium-surface rounded-[30px] border border-white/[0.08] bg-[#181922]/90 p-5">
                  <div className="flex items-center gap-3">
                    <div className="app-dashboard-green-icon flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-emerald-300">
                      <MapPinned className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Trace sélectionnée
                      </h2>
                      <p className="text-sm text-zinc-400">
                        Cliquez dans la liste pour isoler une aventure.
                      </p>
                    </div>
                  </div>

                  {selectedRoute ? (
                    <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
                      <p className="text-xs tracking-[0.16em] text-emerald-300 uppercase">
                        {getSportLabel(selectedRoute.sport)}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-bold text-white">
                        {selectedRoute.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        {formatDate(selectedRoute.startedAt)}
                      </p>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-white/[0.06] bg-black/16 p-3">
                          <p className="text-[11px] text-zinc-500">Distance</p>
                          <p className="mt-1 font-bold text-white">
                            {formatDistance(selectedRoute.distance)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-black/16 p-3">
                          <p className="text-[11px] text-zinc-500">Durée</p>
                          <p className="mt-1 font-bold text-white">
                            {formatDuration(selectedRoute.duration)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-black/16 p-3">
                          <p className="text-[11px] text-zinc-500">D+</p>
                          <p className="mt-1 font-bold text-white">
                            {new Intl.NumberFormat("fr-FR").format(
                              Math.round(selectedRoute.elevationGain),
                            )}{" "}
                            m
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/activites/${selectedRoute.id}`}
                        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-sm font-bold text-white"
                      >
                        Voir le détail
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.025] p-5 text-sm text-zinc-400">
                      Aucune trace sélectionnée.
                    </div>
                  )}
                </div>

                <div className="app-premium-surface rounded-[30px] border border-white/[0.08] bg-[#181922]/90 p-5">
                  <div className="flex items-center gap-3">
                    <div className="app-dashboard-green-icon flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-emerald-300">
                      <Mountain className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Traces marquantes
                      </h2>
                      <p className="text-sm text-zinc-400">
                        Les plus gros D+ du filtre actif.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {featuredRoutes.length > 0 ? (
                      featuredRoutes.map((route, index) => {
                        const isSelected = selectedRoute?.id === route.id;

                        return (
                          <FadeIn key={route.id} delay={0.04 * (index + 1)}>
                            <button
                              type="button"
                              onClick={() => setSelectedRouteId(route.id)}
                              className={`block w-full rounded-[22px] border p-4 text-left transition ${
                                isSelected
                                  ? "border-emerald-400/35 bg-emerald-500/12"
                                  : "border-white/[0.07] bg-white/[0.035] hover:border-emerald-400/24 hover:bg-emerald-500/8"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="line-clamp-2 font-semibold text-white">
                                    {route.title}
                                  </p>
                                  <p className="mt-1 text-xs text-zinc-500">
                                    {getSportLabel(route.sport)} ·{" "}
                                    {formatDistance(route.distance)} km
                                  </p>
                                </div>
                                <span className="rounded-full border border-white/[0.08] bg-black/15 px-2.5 py-1 text-xs text-zinc-400">
                                  {new Intl.NumberFormat("fr-FR").format(
                                    Math.round(route.elevationGain),
                                  )}{" "}
                                  m
                                </span>
                              </div>
                            </button>
                          </FadeIn>
                        );
                      })
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.025] p-5 text-sm text-zinc-400">
                        Les futurs parcours apparaîtront ici.
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
