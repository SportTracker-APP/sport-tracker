"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
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
import mapboxStyle from "../json_mapbox.json";

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
  polyline: string;
  path: string;
  points: ProjectedPoint[];
  distance: number;
  duration: number;
  elevationGain: number;
  startedAt: string;
  city: string | null;
};

type MapboxLike = {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMapLike;
  NavigationControl: new (options?: Record<string, unknown>) => unknown;
  LngLatBounds: new (
    southwest?: [number, number],
    northeast?: [number, number],
  ) => {
    extend: (point: [number, number]) => void;
  };
};

type MapboxMapLike = {
  addControl: (control: unknown, position?: string) => void;
  addLayer: (layer: Record<string, unknown>, beforeId?: string) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  fitBounds: (
    bounds: unknown,
    options?: Record<string, unknown>,
  ) => void;
  getLayer: (id: string) => unknown;
  getSource: (id: string) =>
    | {
        setData?: (data: GeoJSONFeatureCollection) => void;
      }
    | undefined;
  getStyle: () => { layers?: Array<{ id: string; type?: string }> };
  on: (
    event: string,
    layerOrListener: string | ((event?: unknown) => void),
    listener?: (event?: unknown) => void,
  ) => void;
  off: (
    event: string,
    layerOrListener: string | ((event?: unknown) => void),
    listener?: (event?: unknown) => void,
  ) => void;
  remove: () => void;
  setFilter: (layerId: string, filter: unknown[]) => void;
  setFog?: (fog: Record<string, unknown>) => void;
  setTerrain?: (terrain: Record<string, unknown>) => void;
  resize?: () => void;
};

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, string | number>;
    geometry: {
      type: "LineString";
      coordinates: Array<[number, number]>;
    };
  }>;
};

declare global {
  interface Window {
    mapboxgl?: MapboxLike;
  }
}

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

const MAP_ROUTE_LIMIT = 18;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_SCRIPT_ID = "mapbox-gl-js";
const MAPBOX_STYLE_ID = "mapbox-gl-css";
const MAPBOX_VERSION = "v3.10.0";

const SUMMIT_MARKERS = [
  { name: "Pointe Percée", altitude: 2750, coordinates: [6.555, 45.955] },
  { name: "Tête Pelouse", altitude: 2537, coordinates: [6.481, 45.978] },
  { name: "Mont Charvin", altitude: 2409, coordinates: [6.41, 45.809] },
  { name: "La Tournette", altitude: 2351, coordinates: [6.287, 45.827] },
  { name: "La Sambuy", altitude: 2198, coordinates: [6.284, 45.692] },
  { name: "Mont Lachat", altitude: 2023, coordinates: [6.446, 45.958] },
  { name: "Parmelan", altitude: 1856, coordinates: [6.235, 45.963] },
  { name: "Sulens", altitude: 1839, coordinates: [6.362, 45.85] },
  { name: "Dent de Lanfon", altitude: 1824, coordinates: [6.251, 45.849] },
  { name: "Semnoz", altitude: 1699, coordinates: [6.104, 45.797] },
  { name: "Mont Veyrier", altitude: 1291, coordinates: [6.18, 45.903] },
] as const;

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

function loadMapbox() {
  return new Promise<MapboxLike>((resolve, reject) => {
    if (window.mapboxgl) {
      resolve(window.mapboxgl);
      return;
    }

    if (!document.getElementById(MAPBOX_STYLE_ID)) {
      const link = document.createElement("link");
      link.id = MAPBOX_STYLE_ID;
      link.rel = "stylesheet";
      link.href = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.css`;
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(
      MAPBOX_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.mapboxgl) {
          resolve(window.mapboxgl);
        } else {
          reject(new Error("Mapbox indisponible"));
        }
      });
      existingScript.addEventListener("error", () =>
        reject(new Error("Mapbox indisponible")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = MAPBOX_SCRIPT_ID;
    script.src = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.js`;
    script.async = true;
    script.onload = () => {
      if (window.mapboxgl) {
        resolve(window.mapboxgl);
      } else {
        reject(new Error("Mapbox indisponible"));
      }
    };
    script.onerror = () => reject(new Error("Mapbox indisponible"));
    document.head.appendChild(script);
  });
}

function toGeoJson(routes: ProjectedRoute[]): GeoJSONFeatureCollection {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => ({
      type: "Feature",
      properties: {
        id: route.id,
        sport: getSportLabel(route.sport),
        stroke: getSportTone(route.sport).stroke,
        title: route.title,
      },
      geometry: {
        type: "LineString",
        coordinates: simplifyRoutePoints(route.points).map((point) => [
          point.lng,
          point.lat,
        ]),
      },
    })),
  };
}

function getSummitsGeoJson() {
  return {
    type: "FeatureCollection",
    features: SUMMIT_MARKERS.map((summit) => ({
      type: "Feature",
      properties: {
        name: summit.name,
        altitude: summit.altitude,
        label: `${summit.name} · ${summit.altitude} m`,
      },
      geometry: {
        type: "Point",
        coordinates: summit.coordinates,
      },
    })),
  };
}

function getPremiumMapboxStyle() {
  return JSON.parse(JSON.stringify(mapboxStyle)) as Record<string, unknown>;
}

function simplifyRoutePoints(points: ProjectedPoint[]) {
  if (points.length <= 600) {
    return points;
  }

  const step = Math.ceil(points.length / 600);
  const simplified = points.filter((_, index) => index % step === 0);
  const lastPoint = points.at(-1);

  if (lastPoint && simplified.at(-1) !== lastPoint) {
    simplified.push(lastPoint);
  }

  return simplified;
}

function fitRoutes(
  map: MapboxMapLike,
  mapboxgl: MapboxLike,
  routes: ProjectedRoute[],
  variant: "full" | "compact" = "full",
) {
  const points = routes.flatMap((route) => route.points);

  if (points.length === 0) {
    return;
  }

  const firstPoint = points[0];
  const bounds = new mapboxgl.LngLatBounds(
    [firstPoint.lng, firstPoint.lat],
    [firstPoint.lng, firstPoint.lat],
  );

  points.forEach((point) => bounds.extend([point.lng, point.lat]));
  map.fitBounds(bounds, {
    padding:
      variant === "compact"
        ? { top: 34, right: 34, bottom: 34, left: 34 }
        : { top: 92, right: 96, bottom: 92, left: 96 },
    maxZoom: variant === "compact" ? 13.8 : routes.length <= 4 ? 13.6 : 11.4,
    duration: 900,
    pitch: variant === "compact" ? 50 : 62,
    bearing: -22,
  });
}

function MapboxOutdoorMap({
  routes,
  totalRoutes,
  selectedRouteId,
  onSelectRoute,
  variant = "full",
}: {
  routes: ProjectedRoute[];
  totalRoutes: number;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  variant?: "full" | "compact";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMapLike | null>(null);
  const mapboxRef = useRef<MapboxLike | null>(null);
  const latestRoutesRef = useRef<ProjectedRoute[]>(routes);
  const latestRouteDataRef = useRef<GeoJSONFeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [mapStatus, setMapStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >(MAPBOX_TOKEN ? "loading" : "idle");
  const routeData = useMemo(() => toGeoJson(routes), [routes]);
  const isCompact = variant === "compact";

  latestRoutesRef.current = routes;
  latestRouteDataRef.current = routeData;

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || mapRef.current) {
      return;
    }

    let isMounted = true;
    const loadingTimeout = window.setTimeout(() => {
      if (isMounted) {
        setMapStatus((status) => (status === "loading" ? "error" : status));
      }
    }, 12_000);

    loadMapbox()
      .then((mapboxgl) => {
        if (!isMounted || !containerRef.current || mapRef.current) {
          return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;
        mapboxRef.current = mapboxgl;

        const map = new mapboxgl.Map({
          antialias: true,
          bearing: -22,
          center: [6.13, 45.9],
          container: containerRef.current,
          pitch: isCompact ? 50 : 62,
          style: getPremiumMapboxStyle(),
          zoom: isCompact ? 10.4 : 9.4,
        });

        mapRef.current = map;
        if (!isCompact) {
          map.addControl(
            new mapboxgl.NavigationControl({ visualizePitch: true }),
            "top-right",
          );
        }
        window.setTimeout(() => map.resize?.(), 120);

        map.on("error", (event) => {
          const message = String(
            (event as { error?: { message?: string } })?.error?.message ?? "",
          );

          if (
            message.toLowerCase().includes("token") ||
            message.toLowerCase().includes("unauthorized") ||
            message.toLowerCase().includes("forbidden")
          ) {
            setMapStatus("error");
          }
        });

        map.on("load", () => {
          if (!isMounted) {
            return;
          }

          map.setTerrain?.({ source: "terrain-dem", exaggeration: 1.55 });
          map.setFog?.({
            color: "#e8fff2",
            "high-color": "#7dd3fc",
            "horizon-blend": 0.2,
            range: [0.5, 10],
            "space-color": "#06130f",
            "star-intensity": 0.12,
          });

          const labelLayer = map
            .getStyle()
            .layers?.find(
              (layer) =>
                layer.type === "symbol" && layer.id.includes("label"),
            )?.id;

          map.addSource("sport-summits", {
            type: "geojson",
            data: getSummitsGeoJson(),
          });
          map.addLayer(
            {
              id: "sport-summits-glow",
              type: "circle",
              source: "sport-summits",
              paint: {
                "circle-color": "rgba(132, 204, 22, 0.48)",
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  4,
                  13,
                  8,
                ],
                "circle-blur": 0.55,
                "circle-opacity": 0.78,
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-summits",
              type: "symbol",
              source: "sport-summits",
              layout: {
                "icon-image": "mountain-15",
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0.72,
                  13,
                  1.05,
                ],
                "text-anchor": "top",
                "text-field": ["get", "label"],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-offset": [0, 1],
                "text-optional": true,
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  10,
                  13,
                  13,
                ],
              },
              paint: {
                "icon-color": "#f8fff7",
                "icon-halo-color": "#052014",
                "icon-halo-width": 1.4,
                "text-color": "#f8fff7",
                "text-halo-color": "#052014",
                "text-halo-width": 1.8,
                "text-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8.5,
                  0,
                  10,
                  1,
                ],
              },
            },
            labelLayer,
          );

          map.addSource("sport-traces", {
            type: "geojson",
            data: latestRouteDataRef.current,
            lineMetrics: true,
          });
          map.addLayer(
            {
              id: "sport-traces-halo",
              type: "line",
              source: "sport-traces",
              paint: {
                "line-color": "rgba(5, 12, 18, 0.78)",
                "line-width": 9,
                "line-opacity": 0.72,
                "line-blur": 1,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-traces",
              type: "line",
              source: "sport-traces",
              paint: {
                "line-color": ["get", "stroke"],
                "line-width": 4.5,
                "line-opacity": 0.92,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-traces-selected",
              type: "line",
              source: "sport-traces",
              filter: ["==", ["get", "id"], selectedRouteId ?? ""],
              paint: {
                "line-color": "#fef08a",
                "line-width": 7,
                "line-opacity": 1,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            },
            labelLayer,
          );

          map.on("click", "sport-traces", (event) => {
            const feature = (
              event as {
                features?: Array<{ properties?: { id?: string } }>;
              }
            ).features?.[0];

            if (feature?.properties?.id) {
              onSelectRoute(feature.properties.id);
            }
          });

          fitRoutes(map, mapboxgl, latestRoutesRef.current, variant);
          map.resize?.();
        });

        map.on("idle", () => {
          if (isMounted) {
            window.clearTimeout(loadingTimeout);
            setMapStatus("ready");
          }
        });
      })
      .catch(() => {
        window.clearTimeout(loadingTimeout);
        if (isMounted) {
          setMapStatus("error");
        }
      });

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimeout);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [isCompact, onSelectRoute, variant]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("sport-traces");

    if (!map || !source?.setData) {
      return;
    }

    source.setData(routeData);

    if (mapboxRef.current) {
      fitRoutes(map, mapboxRef.current, routes, variant);
    }
  }, [routeData, routes, variant]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map?.getLayer("sport-traces-selected")) {
      return;
    }

    map.setFilter("sport-traces-selected", [
      "==",
      ["get", "id"],
      selectedRouteId ?? "",
    ]);
  }, [selectedRouteId]);

  if (routes.length === 0) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-[30px] border border-dashed border-white/10 bg-black/22 text-center ${
          isCompact ? "h-[250px]" : "mt-5 h-[560px]"
        }`}
      >
        <div>
          <Compass className="mx-auto h-10 w-10 text-zinc-500" />
          <p className="mt-4 font-semibold text-white">
            Aucune trace disponible
          </p>
          <p className="mt-2 max-w-sm text-sm text-zinc-400">
            Synchronisez Strava ou ajoutez des activités avec un tracé pour
            alimenter cette carte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`app-mapbox-frame relative overflow-hidden border border-emerald-200/20 bg-[#08120e] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
        isCompact
          ? "app-mapbox-frame-compact h-[250px] rounded-[24px]"
          : "mt-5 h-[560px] rounded-[30px]"
      }`}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {(mapStatus === "loading" ||
        mapStatus === "idle" ||
        mapStatus === "error") && (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_34%),linear-gradient(135deg,#08120e,#102019)] p-6 text-center">
          <div className="max-w-md rounded-[28px] border border-white/12 bg-white/10 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <MapPinned className="mx-auto h-10 w-10 text-emerald-300" />
            <p className="mt-4 text-lg font-bold">
              {mapStatus === "error"
                ? "Mapbox n'a pas chargé"
                : MAPBOX_TOKEN
                  ? "Chargement de la carte 3D..."
                  : "Carte 3D prête à brancher"}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/68">
              {mapStatus === "error"
                ? "Vérifiez la clé publique Mapbox ou la connexion réseau, puis rechargez la page."
                : MAPBOX_TOKEN
                  ? "Mapbox Outdoor prépare le relief et vos traces."
                  : "Ajoutez NEXT_PUBLIC_MAPBOX_TOKEN dans l'environnement web pour afficher Mapbox Outdoor 3D."}
            </p>
          </div>
        </div>
      )}

      {!isCompact && (
        <div className="pointer-events-none absolute top-4 left-4 rounded-full border border-white/16 bg-slate-950/72 px-3 py-1.5 text-xs font-bold text-white shadow-[0_14px_34px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          {routes.length} traces récentes en 3D
        </div>
      )}

      {!isCompact && (
        <div className="pointer-events-none absolute right-4 bottom-4 left-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/14 bg-slate-950/72 px-4 py-3 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(15,23,42,0.24)] backdrop-blur-xl">
          <span>Mapbox Outdoor 3D</span>
          <span className="text-white/62">
            {totalRoutes > routes.length
              ? `${totalRoutes - routes.length} traces plus anciennes dans la liste`
              : "Glissez, zoomez, pivotez le relief"}
          </span>
        </div>
      )}
    </div>
  );
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
      polyline: activity.routePolyline || "",
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
  const visibleMapRoutes = useMemo(() => {
    if (
      selectedRoute &&
      !filteredRoutes
        .slice(0, MAP_ROUTE_LIMIT)
        .some((route) => route.id === selectedRoute.id)
    ) {
      return [
        selectedRoute,
        ...filteredRoutes
          .filter((route) => route.id !== selectedRoute.id)
          .slice(0, MAP_ROUTE_LIMIT - 1),
      ];
    }

    return filteredRoutes.slice(0, MAP_ROUTE_LIMIT);
  }, [filteredRoutes, selectedRoute]);

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
        <section className="app-map-hero relative overflow-hidden rounded-[34px] border border-white/[0.10] bg-[#07120d] p-6 text-white shadow-[0_28px_86px_rgba(15,23,42,0.20)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1800')] bg-cover bg-center opacity-[0.82]" />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(4,12,9,0.84)_0%,rgba(7,20,16,0.58)_45%,rgba(9,21,18,0.26)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,253,245,0.26),transparent_34%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(125,211,252,0.20),transparent_38%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                <MapIcon className="h-3.5 w-3.5" />
                Exploration outdoor
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
                Votre terrain de jeu, vu d’en haut.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-200/82 md:text-base">
                Lac, route, sentier, forêt ou montagne : chaque sortie ajoute
                une ligne à votre atlas personnel. L’idée est simple : voir ce
                qui est déjà exploré, et repérer le prochain coin à aller
                chercher.
              </p>
            </div>

            <div className="app-map-message-card rounded-[28px] border border-white/14 bg-slate-950/58 p-5 text-white shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <p className="text-xs tracking-[0.18em] text-emerald-100/70 uppercase">
                Message du refuge
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
          <div className="rounded-[28px] border border-white/[0.08] bg-[#181922]/90 p-8 text-center text-zinc-400">
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
            <section className="app-map-control-panel rounded-[28px] border border-white/[0.08] bg-[#181922]/90 p-4 shadow-[0_18px_54px_rgba(15,23,42,0.12)]">
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
                    className="app-map-stat-card rounded-[26px] border border-white/[0.08] bg-[#181922]/90 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.10)]"
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
                      <div className="app-map-stat-icon flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-400 text-white shadow-[0_16px_34px_rgba(16,185,129,0.22)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
              <div className="app-atlas-map relative self-start overflow-hidden rounded-[36px] border border-white/[0.08] bg-[#16131f] p-5 shadow-[0_34px_100px_rgba(0,0,0,0.26)]">
                <div className="app-atlas-map-photo absolute inset-0 bg-[url('https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1800')] bg-cover bg-center" />
                <div className="app-atlas-map-wash absolute inset-0" />
                <div className="app-atlas-map-grid absolute inset-0" />

                <div className="absolute inset-x-8 top-28 h-36 rotate-[-5deg] rounded-[100%] bg-emerald-300/8 blur-2xl" />
                <div className="absolute right-12 bottom-14 h-44 w-64 rotate-[-12deg] rounded-[100%] bg-sky-300/8 blur-2xl" />

                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-emerald-200/70 uppercase">
                      Exploration live
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Carte Outdoor 3D
                    </h2>
                  </div>
                  <div className="app-map-view-pill inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/28 px-3 py-1.5 text-xs text-white/70">
                    <Layers3 className="h-3.5 w-3.5 text-emerald-300" />
                    Vue territoire
                  </div>
                </div>

                <MapboxOutdoorMap
                  routes={visibleMapRoutes}
                  totalRoutes={filteredRoutes.length}
                  selectedRouteId={selectedRoute?.id ?? null}
                  onSelectRoute={setSelectedRouteId}
                />
              </div>

              <aside className="space-y-4">
                <div className="app-route-detail-panel rounded-[30px] border border-white/[0.08] bg-[#111827]/92 p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.20)]">
                  <div className="flex items-center gap-3">
                    <div className="app-map-panel-icon flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-400 text-white shadow-[0_16px_34px_rgba(16,185,129,0.22)]">
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
                    <div className="app-selected-route-card mt-5 rounded-[24px] border border-white/[0.10] bg-slate-950/36 p-4">
                      <MapboxOutdoorMap
                        routes={[selectedRoute]}
                        totalRoutes={1}
                        selectedRouteId={selectedRoute.id}
                        onSelectRoute={setSelectedRouteId}
                        variant="compact"
                      />

                      <p className="mt-4 text-xs tracking-[0.16em] text-emerald-300 uppercase">
                        {getSportLabel(selectedRoute.sport)}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-bold text-white">
                        {selectedRoute.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        {formatDate(selectedRoute.startedAt)}
                      </p>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="app-route-metric-chip rounded-2xl border border-white/[0.08] bg-white/[0.08] p-3">
                          <p className="text-[11px] text-white/58">Distance</p>
                          <p className="mt-1 font-bold text-white">
                            {formatDistance(selectedRoute.distance)}
                          </p>
                        </div>
                        <div className="app-route-metric-chip rounded-2xl border border-white/[0.08] bg-white/[0.08] p-3">
                          <p className="text-[11px] text-white/58">Durée</p>
                          <p className="mt-1 font-bold text-white">
                            {formatDuration(selectedRoute.duration)}
                          </p>
                        </div>
                        <div className="app-route-metric-chip rounded-2xl border border-white/[0.08] bg-white/[0.08] p-3">
                          <p className="text-[11px] text-white/58">D+</p>
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

                <div className="app-route-detail-panel rounded-[30px] border border-white/[0.08] bg-[#111827]/92 p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.20)]">
                  <div className="flex items-center gap-3">
                    <div className="app-map-panel-icon flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-400 text-white shadow-[0_16px_34px_rgba(16,185,129,0.22)]">
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
                              className={`app-featured-route-card block w-full rounded-[22px] border p-4 text-left transition ${
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
                                <span className="app-route-elevation-pill rounded-full border border-white/[0.08] bg-black/15 px-2.5 py-1 text-xs text-zinc-400">
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
