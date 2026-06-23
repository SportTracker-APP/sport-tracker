"use client";

import { RotateCw, Route } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import mapboxStyle from "@/app/json_mapbox.json";
import {
  SUMMIT_CATALOG,
  getDistanceMeters,
  type Summit,
} from "@/lib/summits";
import { MiniRouteMap } from "./mini-route-map";

import styles from "./mapbox-route-map.module.css";

type Point = {
  lat: number;
  lng: number;
};

type MapboxLike = {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMapLike;
  Marker: new (options?: Record<string, unknown>) => {
    setLngLat: (coordinates: [number, number]) => {
      addTo: (map: MapboxMapLike) => unknown;
    };
    remove: () => void;
  };
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
  easeTo: (options: Record<string, unknown>) => void;
  fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
  getLayer: (id: string) => unknown;
  getBearing?: () => number;
  getSource: (id: string) =>
    | {
        setData?: (data: RouteFeatureCollection) => void;
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
  loaded?: () => boolean;
  resize?: () => void;
};

type RouteFeatureCollection = {
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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_SCRIPT_ID = "mapbox-gl-js";
const MAPBOX_STYLE_ID = "mapbox-gl-css";
const MAPBOX_VERSION = "v3.10.0";

function decodePolyline(polyline: string | null) {
  if (!polyline) {
    return [];
  }

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

function loadMapbox() {
  return new Promise<MapboxLike>((resolve, reject) => {
    const mapboxWindow = window as unknown as { mapboxgl?: MapboxLike };

    if (mapboxWindow.mapboxgl) {
      resolve(mapboxWindow.mapboxgl);
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
        if (mapboxWindow.mapboxgl) {
          resolve(mapboxWindow.mapboxgl);
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
      if (mapboxWindow.mapboxgl) {
        resolve(mapboxWindow.mapboxgl);
      } else {
        reject(new Error("Mapbox indisponible"));
      }
    };
    script.onerror = () => reject(new Error("Mapbox indisponible"));
    document.head.appendChild(script);
  });
}

function simplifyPoints(points: Point[]) {
  if (points.length <= 900) {
    return points;
  }

  const step = Math.ceil(points.length / 900);
  const simplified = points.filter((_, index) => index % step === 0);
  const lastPoint = points.at(-1);

  if (lastPoint && simplified.at(-1) !== lastPoint) {
    simplified.push(lastPoint);
  }

  return simplified;
}

function toGeoJson(points: Point[]): RouteFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          id: "activity-route",
          title: "Trace activité",
        },
        geometry: {
          type: "LineString",
          coordinates: simplifyPoints(points).map((point) => [
            point.lng,
            point.lat,
          ]),
        },
      },
    ],
  };
}

function findNearestSummit(points: Point[]) {
  if (points.length === 0) {
    return null;
  }

  const nearestSummits = SUMMIT_CATALOG.map((summit) => {
    const summitPoint = {
      lat: summit.coordinates[1],
      lng: summit.coordinates[0],
    };
    const distance = Math.min(
      ...points.map((point) => getDistanceMeters(point, summitPoint)),
    );

    return {
      ...summit,
      distance,
    };
  }).sort((firstSummit, secondSummit) => firstSummit.distance - secondSummit.distance);

  const nearestSummit = nearestSummits[0];

  return nearestSummit && nearestSummit.distance <= 12_000
    ? nearestSummit
    : null;
}

function getSummitGeoJson(summit: Summit | null) {
  return {
    type: "FeatureCollection",
    features: summit
      ? [
          {
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
          },
        ]
      : [],
  };
}

function getStyleCopy() {
  return JSON.parse(JSON.stringify(mapboxStyle)) as Record<string, unknown>;
}

function fitRoute(
  map: MapboxMapLike,
  mapboxgl: MapboxLike,
  points: Point[],
  animated = true,
) {
  const firstPoint = points[0];

  if (!firstPoint) {
    return;
  }

  const bounds = new mapboxgl.LngLatBounds(
    [firstPoint.lng, firstPoint.lat],
    [firstPoint.lng, firstPoint.lat],
  );

  points.forEach((point) => bounds.extend([point.lng, point.lat]));
  map.fitBounds(bounds, {
    bearing: -18,
    duration: animated ? 850 : 0,
    maxZoom: 14.2,
    padding: { top: 86, right: 58, bottom: 82, left: 58 },
    pitch: 58,
  });
}

function createMarker(className: string) {
  const marker = document.createElement("div");
  marker.className = `${styles.marker} ${className}`;

  return marker;
}

type ActivityMapboxRouteProps = {
  city?: string | null;
  country?: string | null;
  distance: number | null;
  polyline: string | null;
  title: string;
};

export function ActivityMapboxRoute({
  city,
  country,
  distance,
  polyline,
  title,
}: ActivityMapboxRouteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMapLike | null>(null);
  const mapboxRef = useRef<MapboxLike | null>(null);
  const markersRef = useRef<Array<{ remove: () => void }>>([]);
  const points = useMemo(() => decodePolyline(polyline), [polyline]);
  const routeData = useMemo(() => toGeoJson(points), [points]);
  const nearestSummit = useMemo(() => findNearestSummit(points), [points]);
  const startPoint = points[0] ?? null;
  const areaLabel =
    nearestSummit
      ? `${nearestSummit.name} · ${nearestSummit.altitude} m`
      : city && country
      ? `${city}, ${country}`
      : city
        ? city
        : startPoint
          ? `${new Intl.NumberFormat("fr-FR", {
              maximumFractionDigits: 2,
            }).format(startPoint.lat)}, ${new Intl.NumberFormat("fr-FR", {
              maximumFractionDigits: 2,
            }).format(startPoint.lng)}`
          : title;
  const [mapStatus, setMapStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >(MAPBOX_TOKEN ? "loading" : "idle");
  const hasRoute = points.length > 1;

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || mapRef.current || !hasRoute) {
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

        const firstPoint = points[0];
        mapboxgl.accessToken = MAPBOX_TOKEN;
        mapboxRef.current = mapboxgl;

        const map = new mapboxgl.Map({
          antialias: true,
          bearing: -18,
          center: firstPoint ? [firstPoint.lng, firstPoint.lat] : [6.13, 45.9],
          container: containerRef.current,
          pitch: 58,
          style: getStyleCopy(),
          zoom: 11,
        });

        mapRef.current = map;
        map.addControl(
          new mapboxgl.NavigationControl({ visualizePitch: true }),
          "top-right",
        );
        window.setTimeout(() => map.resize?.(), 140);

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

          map.setTerrain?.({ source: "terrain-dem", exaggeration: 1.45 });
          map.setFog?.({
            color: "#eafff4",
            "high-color": "#7dd3fc",
            "horizon-blend": 0.18,
            range: [0.5, 10],
            "space-color": "#06130f",
            "star-intensity": 0.1,
          });

          const labelLayer = map
            .getStyle()
            .layers?.find(
              (layer) =>
                layer.type === "symbol" && layer.id.includes("label"),
            )?.id;

          map.addSource("activity-summit", {
            type: "geojson",
            data: getSummitGeoJson(nearestSummit),
          });
          map.addLayer(
            {
              id: "activity-summit-glow",
              type: "circle",
              source: "activity-summit",
              paint: {
                "circle-blur": 0.55,
                "circle-color": "rgba(254, 240, 138, 0.62)",
                "circle-opacity": 0.86,
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  6,
                  14,
                  12,
                ],
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "activity-summit",
              type: "symbol",
              source: "activity-summit",
              layout: {
                "icon-image": "mountain-15",
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  0.85,
                  14,
                  1.18,
                ],
                "text-anchor": "top",
                "text-field": ["get", "label"],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-offset": [0, 1.05],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  11,
                  14,
                  15,
                ],
              },
              paint: {
                "icon-color": "#fef9c3",
                "icon-halo-color": "#052014",
                "icon-halo-width": 1.6,
                "text-color": "#fef9c3",
                "text-halo-color": "#052014",
                "text-halo-width": 2.2,
              },
            },
            labelLayer,
          );

          map.addSource("activity-route", {
            type: "geojson",
            data: routeData,
            lineMetrics: true,
          });
          map.addLayer(
            {
              id: "activity-route-shadow",
              type: "line",
              source: "activity-route",
              paint: {
                "line-blur": 1.2,
                "line-color": "rgba(3, 7, 18, 0.82)",
                "line-opacity": 0.8,
                "line-width": 11,
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
              id: "activity-route-halo",
              type: "line",
              source: "activity-route",
              paint: {
                "line-color": "rgba(255, 255, 255, 0.86)",
                "line-opacity": 0.96,
                "line-width": 7.2,
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
              id: "activity-route-main",
              type: "line",
              source: "activity-route",
              paint: {
                "line-gradient": [
                  "interpolate",
                  ["linear"],
                  ["line-progress"],
                  0,
                  "#34d399",
                  0.55,
                  "#38bdf8",
                  1,
                  "#fb7185",
                ],
                "line-opacity": 1,
                "line-width": 4.8,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            },
            labelLayer,
          );

          const startPoint = points[0];
          const endPoint = points.at(-1);

          markersRef.current.forEach((marker) => marker.remove());
          markersRef.current = [];

          if (startPoint) {
            markersRef.current.push(
              new mapboxgl.Marker({
                element: createMarker(styles.markerStart),
              })
                .setLngLat([startPoint.lng, startPoint.lat])
                .addTo(map) as { remove: () => void },
            );
          }

          if (endPoint) {
            markersRef.current.push(
              new mapboxgl.Marker({
                element: createMarker(styles.markerEnd),
              })
                .setLngLat([endPoint.lng, endPoint.lat])
                .addTo(map) as { remove: () => void },
            );
          }

          fitRoute(map, mapboxgl, points);
          map.resize?.();
        });

        map.on("idle", () => {
          if (isMounted) {
            window.clearTimeout(loadingTimeout);
            setMapStatus(map.loaded?.() === false ? "error" : "ready");
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
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hasRoute, nearestSummit, points, routeData]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("activity-route");

    if (!map || !source?.setData) {
      return;
    }

    source.setData(routeData);

    if (mapboxRef.current) {
      fitRoute(map, mapboxRef.current, points, false);
    }
  }, [points, routeData]);

  if (!MAPBOX_TOKEN || !hasRoute || mapStatus === "error") {
    return <MiniRouteMap display="wide" polyline={polyline} size="large" />;
  }

  function rotateCamera() {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.easeTo({
      bearing: (map.getBearing?.() ?? -18) + 45,
      duration: 650,
      pitch: 62,
    });
  }

  return (
    <div className={`app-mapbox-frame app-mapbox-frame-compact ${styles.mapShell}`}>
      <div ref={containerRef} className={styles.mapCanvas} />
      <div className={styles.shade} aria-hidden="true" />

      {(mapStatus === "loading" || mapStatus === "idle") && (
        <div className={styles.loading}>
          Mapbox Outdoor prépare le relief et votre trace.
        </div>
      )}

      <button
        type="button"
        className={styles.rotateButton}
        onClick={rotateCamera}
        title="Tourner la caméra"
        aria-label="Tourner la caméra"
      >
        <RotateCw aria-hidden="true" />
      </button>

      <div className={styles.legend}>
        <span className={styles.legendPoint}>
          <span className={styles.dotStart} />
          Départ
        </span>
        <span className={styles.legendDistance}>
          <Route aria-hidden="true" />
          {distance
            ? `${new Intl.NumberFormat("fr-FR", {
                maximumFractionDigits: 1,
              }).format(distance)} km`
            : "Trace"}
        </span>
        <span className={styles.legendArea}>{areaLabel}</span>
        <span className={styles.legendPoint}>
          Arrivée
          <span className={styles.dotEnd} />
        </span>
      </div>
    </div>
  );
}
