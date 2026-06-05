"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  Activity,
  Compass,
  Map,
  MapPinned,
  Mountain,
  Route,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { useActivities } from "@/hooks/use-activities";
import type { Activity as SportActivity } from "@/lib/activities";

type Point = {
  lat: number;
  lng: number;
};

type ProjectedRoute = {
  id: string;
  title: string;
  sport: string;
  path: string;
  start: Point;
  distance: number;
  elevationGain: number;
};

const EXPLORATION_SPORTS = new Set(["TRAIL", "HIKING", "WALKING", "MTB"]);

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

function getSportLabel(sport: string) {
  const labels: Record<string, string> = {
    TRAIL: "Trail",
    HIKING: "Randonnée",
    WALKING: "Marche",
    MTB: "VTT",
    RUNNING: "Course",
    ROAD_CYCLING: "Cyclisme",
    GRAVEL: "Gravel",
  };

  return labels[sport] ?? sport;
}

function getRouteData(activities: SportActivity[]) {
  const decodedRoutes = activities
    .filter((activity) => activity.status !== "PLANNED" && activity.routePolyline)
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
  const padding = 9;

  function project(point: Point) {
    return {
      x: padding + ((point.lng - minLng) / lngSpan) * (100 - padding * 2),
      y: padding + ((maxLat - point.lat) / latSpan) * (100 - padding * 2),
    };
  }

  const routes = decodedRoutes.map(({ activity, points }) => ({
    id: activity.id,
    title: activity.title || "Sortie sans titre",
    sport: activity.sport,
    path: points
      .map((point, index) => {
        const projected = project(point);

        return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(
          2,
        )} ${projected.y.toFixed(2)}`;
      })
      .join(" "),
    start: points[0],
    distance: activity.distance || 0,
    elevationGain: activity.elevationGain || 0,
  }));

  return {
    routes,
    points: allPoints,
  };
}

export default function MapPage() {
  const { data: activities = [], isLoading, error } = useActivities();

  const completedActivities = useMemo(
    () => activities.filter((activity) => activity.status !== "PLANNED"),
    [activities],
  );

  const routeData = useMemo(
    () => getRouteData(completedActivities),
    [completedActivities],
  );

  const explorationActivities = useMemo(
    () =>
      completedActivities.filter((activity) =>
        EXPLORATION_SPORTS.has(activity.sport),
      ),
    [completedActivities],
  );

  const totalExploredDistance = explorationActivities.reduce(
    (total, activity) => total + (activity.distance || 0),
    0,
  );

  const totalElevation = explorationActivities.reduce(
    (total, activity) => total + (activity.elevationGain || 0),
    0,
  );

  const startZones = new Set(
    completedActivities
      .filter(
        (activity) =>
          activity.startLatitude !== null && activity.startLongitude !== null,
      )
      .map(
        (activity) =>
          `${activity.startLatitude?.toFixed(2)},${activity.startLongitude?.toFixed(
            2,
          )}`,
      ),
  ).size;

  const featuredRoutes = routeData.routes
    .slice()
    .sort((a, b) => b.elevationGain - a.elevationGain)
    .slice(0, 4);

  return (
    <DashboardLayout>
      <div className="app-map-page space-y-6">
        <section className="app-premium-surface relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#151720]/92 p-6 backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_38%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                <Map className="h-3.5 w-3.5" />
                Territoire sportif
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white">
                Votre terrain de jeu, trace par trace.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Visualisez vos parcours Strava, vos zones déjà explorées et les
                massifs qui commencent à prendre forme dans votre historique.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/[0.08] bg-black/18 p-5">
              <p className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                Exploration
              </p>
              <p className="mt-3 text-4xl font-bold text-white">
                {routeData.routes.length}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                tracé{routeData.routes.length > 1 ? "s" : ""} exploitable
                {routeData.routes.length > 1 ? "s" : ""}
              </p>
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
            <section className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Distance explorée",
                  value: `${formatDistance(totalExploredDistance)} km`,
                  detail: "Trail, randonnée, marche et VTT",
                  icon: Route,
                },
                {
                  label: "Dénivelé conquis",
                  value: `${new Intl.NumberFormat("fr-FR").format(
                    Math.round(totalElevation),
                  )} m`,
                  detail: "Sur vos sorties outdoor",
                  icon: Mountain,
                },
                {
                  label: "Zones de départ",
                  value: startZones.toString(),
                  detail: "Secteurs distincts détectés",
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

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="app-premium-surface relative min-h-[620px] overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#10131a] p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(132,204,22,0.18),transparent_24%),radial-gradient(circle_at_76%_28%,rgba(14,165,233,0.14),transparent_28%),linear-gradient(135deg,#111827,#172018_48%,#0f172a)]" />
                <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:84px_84px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(0,0,0,0.34)_100%)]" />

                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-emerald-200/70 uppercase">
                      Carte d'exploration
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Traces importées
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/28 px-3 py-1.5 text-xs text-white/70">
                    Relief 2D - ébauche
                  </div>
                </div>

                {routeData.routes.length > 0 ? (
                  <svg
                    viewBox="0 0 100 100"
                    className="relative mt-6 h-[500px] w-full overflow-visible rounded-[28px]"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <filter id="routeGlow">
                        <feGaussianBlur stdDeviation="0.75" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {routeData.routes.map((route, index) => (
                      <path
                        key={route.id}
                        d={route.path}
                        fill="none"
                        stroke={index % 3 === 0 ? "#22c55e" : "#67e8f9"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={index % 3 === 0 ? 0.72 : 0.56}
                        opacity={0.82}
                        filter="url(#routeGlow)"
                      />
                    ))}
                    {routeData.routes.slice(0, 18).map((route) => {
                      const start = route.path.match(/M ([0-9.]+) ([0-9.]+)/);

                      if (!start) {
                        return null;
                      }

                      return (
                        <circle
                          key={`${route.id}-start`}
                          cx={start[1]}
                          cy={start[2]}
                          r="0.72"
                          fill="#bef264"
                          stroke="#0f172a"
                          strokeWidth="0.22"
                        />
                      );
                    })}
                  </svg>
                ) : (
                  <div className="relative mt-6 flex h-[500px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/20 text-center">
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
                      <Mountain className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Massifs à suivre
                      </h2>
                      <p className="text-sm text-zinc-400">
                        Vos sorties les plus marquantes.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {featuredRoutes.length > 0 ? (
                      featuredRoutes.map((route, index) => (
                        <FadeIn key={route.id} delay={0.04 * (index + 1)}>
                          <Link
                            href={`/activites/${route.id}`}
                            className="block rounded-[22px] border border-white/[0.07] bg-white/[0.035] p-4 transition hover:border-emerald-400/30 hover:bg-emerald-500/10"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">
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
                          </Link>
                        </FadeIn>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.025] p-5 text-sm text-zinc-400">
                        Les futurs parcours apparaîtront ici.
                      </div>
                    )}
                  </div>
                </div>

                <div className="app-premium-surface rounded-[30px] border border-white/[0.08] bg-[#181922]/90 p-5">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-emerald-300" />
                    <h2 className="text-lg font-semibold text-white">
                      Prochaine étape
                    </h2>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Ajouter le mode zones grisées, puis une vraie carte relief
                    interactive pour afficher tout l'historique Strava en même
                    temps.
                  </p>
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
