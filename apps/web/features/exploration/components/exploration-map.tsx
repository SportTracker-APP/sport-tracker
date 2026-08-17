"use client";

import {
  Compass,
  Expand,
  LocateFixed,
  Minus,
  Plus,
  RotateCcw,
  Shrink,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import mapboxStyle from "@/app/json_mapbox.json";
import type { SummitView } from "@/lib/summit-discovery";

import type {
  ExplorationRoute,
  MapboxLike,
  MapboxMapLike,
  RouteMarkerGeoJsonFeatureCollection,
  SummitGeoJsonFeatureCollection,
} from "../exploration-types";
import {
  formatDate,
  formatDistance,
  formatInteger,
  getRecentMapAreaRoutes,
  routesToGeoJson,
} from "../exploration-utils";
import styles from "../exploration.module.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_SCRIPT_ID = "mapbox-gl-js";
const MAPBOX_STYLE_ID = "mapbox-gl-css";
const MAPBOX_VERSION = "v3.10.0";
const INITIAL_MAP_READING = { lat: 45.9, lng: 6.13, zoom: 9.4 };
const DISCOVERED_SUMMIT_LABEL_MIN_ZOOM = 9.2;
const UNDISCOVERED_SUMMIT_LABEL_MIN_ZOOM = 11.2;

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
      const handleLoad = () =>
        mapboxWindow.mapboxgl
          ? resolve(mapboxWindow.mapboxgl)
          : reject(new Error("Mapbox indisponible"));
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Mapbox indisponible")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = MAPBOX_SCRIPT_ID;
    script.src = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.js`;
    script.async = true;
    script.onload = () =>
      mapboxWindow.mapboxgl
        ? resolve(mapboxWindow.mapboxgl)
        : reject(new Error("Mapbox indisponible"));
    script.onerror = () => reject(new Error("Mapbox indisponible"));
    document.head.appendChild(script);
  });
}

function getMapboxStyle() {
  const style = JSON.parse(JSON.stringify(mapboxStyle)) as Record<
    string,
    unknown
  > & {
    layers?: Array<{
      id: string;
      type?: string;
      paint?: Record<string, unknown>;
    }>;
  };

  style.layers?.forEach((layer) => {
    if (layer.id === "roads-main" && layer.paint) {
      layer.paint["line-color"] = "#a89d88";
      layer.paint["line-opacity"] = 0.42;
    }

    if (layer.id === "trails-paths" && layer.paint) {
      layer.paint["line-color"] = "#829184";
      layer.paint["line-opacity"] = 0.38;
    }
  });

  return style;
}

function getDiscoveryTimestamp(summit: SummitView) {
  const value = summit.firstDiscoveredAt ?? summit.latestDiscoveredAt;
  if (!value) return Number.POSITIVE_INFINITY;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getLatestDiscoveryId(summits: SummitView[]) {
  return summits
    .filter((summit) => summit.discovered)
    .map((summit) => ({
      summit,
      timestamp: getDiscoveryTimestamp(summit),
    }))
    .filter(({ timestamp }) => Number.isFinite(timestamp))
    .sort(
      (firstSummit, secondSummit) =>
        secondSummit.timestamp - firstSummit.timestamp,
    )[0]?.summit.id;
}

function getSummitsGeoJson(
  summits: SummitView[],
): SummitGeoJsonFeatureCollection {
  const latestDiscoveryId = getLatestDiscoveryId(summits);
  const bookIndexes = new Map(
    summits
      .filter((summit) => summit.discovered)
      .sort((firstSummit, secondSummit) => {
        const dateDifference =
          getDiscoveryTimestamp(firstSummit) -
          getDiscoveryTimestamp(secondSummit);

        return (
          dateDifference || firstSummit.name.localeCompare(secondSummit.name)
        );
      })
      .map((summit, index) => [summit.id, index + 1]),
  );

  return {
    type: "FeatureCollection",
    features: summits.map((summit) => ({
      type: "Feature",
      properties: {
        name: summit.name,
        altitude: summit.altitude,
        bookIndex: bookIndexes.get(summit.id)?.toString() ?? "",
        label: `${summit.name} · ${summit.altitude} m`,
        status:
          summit.id === latestDiscoveryId
            ? "LATEST"
            : summit.discovered
              ? "DISCOVERED"
              : "UNDISCOVERED",
      },
      geometry: {
        type: "Point",
        coordinates: [summit.coordinates[0], summit.coordinates[1]],
      },
    })),
  };
}

function getRouteMarkersGeoJson(
  route: ExplorationRoute | null,
): RouteMarkerGeoJsonFeatureCollection {
  const start = route?.points[0];
  const finish = route?.points.at(-1);
  const annotationPoint =
    route?.points[
      Math.min(
        route.points.length - 1,
        Math.max(0, Math.round(route.points.length * 0.58)),
      )
    ];

  if (!route || !start || !finish || !annotationPoint) {
    return { type: "FeatureCollection", features: [] };
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "START", label: "Départ" },
        geometry: {
          type: "Point",
          coordinates: [start.lng, start.lat],
        },
      },
      {
        type: "Feature",
        properties: { kind: "FINISH", label: "Arrivée" },
        geometry: {
          type: "Point",
          coordinates: [finish.lng, finish.lat],
        },
      },
      {
        type: "Feature",
        properties: {
          kind: "ANNOTATION",
          label: `${formatDate(route.startedAt, true)}  ·  ${formatDistance(route.distance)} km  ·  ${formatInteger(route.elevationGain)} m D+`,
        },
        geometry: {
          type: "Point",
          coordinates: [annotationPoint.lng, annotationPoint.lat],
        },
      },
    ],
  };
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}° ${value >= 0 ? positive : negative}`;
}

function getScaleReading(lat: number, zoom: number) {
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  const targetMeters = Math.max(metersPerPixel * 78, 1);
  const magnitude = 10 ** Math.floor(Math.log10(targetMeters));
  const normalized = targetMeters / magnitude;
  const rounded = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  const meters = rounded * magnitude;

  return {
    label:
      meters >= 1000
        ? `${(meters / 1000).toLocaleString("fr-FR")} km`
        : `${Math.round(meters).toLocaleString("fr-FR")} m`,
    width: Math.max(38, Math.min(88, Math.round(meters / metersPerPixel))),
  };
}

function fitRoutes(
  map: MapboxMapLike,
  mapbox: MapboxLike,
  routes: ExplorationRoute[],
  selected: boolean,
) {
  const routesToFrame = selected ? routes : getRecentMapAreaRoutes(routes);
  const points = routesToFrame.flatMap((route) => route.points);
  const firstPoint = points[0];
  if (!firstPoint) return;

  const bounds = new mapbox.LngLatBounds(
    [firstPoint.lng, firstPoint.lat],
    [firstPoint.lng, firstPoint.lat],
  );
  points.forEach((point) => bounds.extend([point.lng, point.lat]));
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const viewportWidth = window.innerWidth;
  const selectedPadding =
    viewportWidth >= 1024
      ? { top: 90, right: 390, bottom: 90, left: 80 }
      : viewportWidth >= 768
        ? { top: 80, right: 70, bottom: 285, left: 70 }
        : { top: 72, right: 48, bottom: 315, left: 48 };

  if (!selected) {
    map.fitBounds(bounds, {
      padding:
        viewportWidth >= 768
          ? { top: 58, right: 58, bottom: 58, left: 58 }
          : { top: 44, right: 44, bottom: 44, left: 44 },
      maxZoom: routesToFrame.length <= 4 ? 13.2 : 11.2,
      duration: 0,
      pitch: 46,
      bearing: -18,
    });
    map.easeTo({
      zoom: Math.min(map.getZoom() + (viewportWidth >= 768 ? 0.55 : 0.3), 11.8),
      duration: reduceMotion ? 0 : 520,
      pitch: 46,
      bearing: -18,
    });
    return;
  }

  map.fitBounds(bounds, {
    padding: selectedPadding,
    maxZoom: 13.8,
    duration: reduceMotion ? 0 : 650,
    pitch: 52,
    bearing: -18,
  });
}

type ExplorationMapProps = {
  routes: ExplorationRoute[];
  summits: SummitView[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  onClearSelection: () => void;
  inspector: ReactNode;
};

export function ExplorationMap({
  routes,
  summits,
  selectedRouteId,
  onSelectRoute,
  onClearSelection,
  inspector,
}: ExplorationMapProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMapLike | null>(null);
  const mapboxRef = useRef<MapboxLike | null>(null);
  const routesRef = useRef(routes);
  const summitsRef = useRef(summits);
  const onSelectRouteRef = useRef(onSelectRoute);
  const selectedRevealFrameRef = useRef<number | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "unconfigured"
  >(MAPBOX_TOKEN ? "loading" : "unconfigured");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [mapReading, setMapReading] = useState(INITIAL_MAP_READING);
  const routeData = useMemo(() => routesToGeoJson(routes), [routes]);
  const scaleReading = getScaleReading(mapReading.lat, mapReading.zoom);

  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  useEffect(() => {
    summitsRef.current = summits;
  }, [summits]);

  useEffect(() => {
    onSelectRouteRef.current = onSelectRoute;
  }, [onSelectRoute]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    let mounted = true;
    let clickHandler: ((event?: unknown) => void) | null = null;
    let enterHandler: ((event?: unknown) => void) | null = null;
    let leaveHandler: (() => void) | null = null;
    let moveHandler: (() => void) | null = null;
    const timeout = window.setTimeout(() => {
      if (mounted) setStatus("error");
    }, 12_000);

    setStatus("loading");
    loadMapbox()
      .then((mapbox) => {
        if (!mounted || !containerRef.current) return;
        mapbox.accessToken = MAPBOX_TOKEN;
        mapboxRef.current = mapbox;

        const map = new mapbox.Map({
          antialias: true,
          bearing: -18,
          center: [6.13, 45.9],
          container: containerRef.current,
          pitch: 56,
          style: getMapboxStyle(),
          zoom: 9.4,
        });
        mapRef.current = map;

        map.on("error", (event) => {
          const message = String(
            (event as { error?: { message?: string } })?.error?.message ?? "",
          ).toLowerCase();
          if (
            message.includes("token") ||
            message.includes("unauthorized") ||
            message.includes("forbidden")
          ) {
            setStatus("error");
          }
        });

        map.on("load", () => {
          if (!mounted) return;
          map.setTerrain?.({ source: "terrain-dem", exaggeration: 1.42 });
          map.setFog?.({
            color: "#d8dfd4",
            "high-color": "#aebcad",
            "horizon-blend": 0.06,
            range: [2.4, 18],
            "space-color": "#1f3028",
            "star-intensity": 0,
          });

          const labelLayer = map
            .getStyle()
            .layers?.find(
              (layer) => layer.type === "symbol" && layer.id.includes("label"),
            )?.id;

          map.addSource("sport-summits", {
            type: "geojson",
            data: getSummitsGeoJson(summitsRef.current),
          });
          map.addLayer(
            {
              id: "sport-summits-undiscovered",
              type: "circle",
              source: "sport-summits",
              filter: ["==", ["get", "status"], "UNDISCOVERED"],
              paint: {
                "circle-color": "rgba(244,239,227,.18)",
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  3.2,
                  13,
                  5.2,
                ],
                "circle-stroke-color": "#7d9587",
                "circle-stroke-width": 1.25,
                "circle-opacity": 0.62,
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-summits-discovered",
              type: "circle",
              source: "sport-summits",
              filter: ["==", ["get", "status"], "DISCOVERED"],
              paint: {
                "circle-color": "#315f49",
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  6.4,
                  13,
                  8.6,
                ],
                "circle-stroke-color": "#f4efe3",
                "circle-stroke-width": 1.8,
                "circle-opacity": 0.96,
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-summits-latest-ring",
              type: "circle",
              source: "sport-summits",
              filter: ["==", ["get", "status"], "LATEST"],
              paint: {
                "circle-color": "rgba(200,91,47,0)",
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  11,
                  13,
                  15,
                ],
                "circle-stroke-color": "#c85b2f",
                "circle-stroke-width": 1.3,
                "circle-opacity": 0.5,
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-summits-latest",
              type: "circle",
              source: "sport-summits",
              filter: ["==", ["get", "status"], "LATEST"],
              paint: {
                "circle-color": "#c85b2f",
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  7.3,
                  13,
                  9.6,
                ],
                "circle-stroke-color": "#f4efe3",
                "circle-stroke-width": 2,
                "circle-opacity": 1,
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-summit-book-indexes",
              type: "symbol",
              source: "sport-summits",
              filter: ["!=", ["get", "status"], "UNDISCOVERED"],
              layout: {
                "text-field": ["get", "bookIndex"],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-size": 9,
                "text-allow-overlap": true,
                "text-ignore-placement": true,
              },
              paint: {
                "text-color": "#fffaf0",
                "text-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0.84,
                  12,
                  1,
                ],
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-summit-labels",
              type: "symbol",
              source: "sport-summits",
              minzoom: DISCOVERED_SUMMIT_LABEL_MIN_ZOOM,
              filter: ["!=", ["get", "status"], "UNDISCOVERED"],
              layout: {
                "text-anchor": "top",
                "text-field": ["get", "label"],
                "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                "text-offset": [0, 1.15],
                "text-optional": true,
                "text-size": 10.5,
              },
              paint: {
                "text-color": "#213e31",
                "text-halo-color": "rgba(244,239,227,.94)",
                "text-halo-width": 1.8,
                "text-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9.2,
                  0,
                  10.7,
                  0.86,
                ],
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-summit-undiscovered-labels",
              type: "symbol",
              source: "sport-summits",
              minzoom: UNDISCOVERED_SUMMIT_LABEL_MIN_ZOOM,
              filter: ["==", ["get", "status"], "UNDISCOVERED"],
              layout: {
                "text-anchor": "top",
                "text-field": ["get", "label"],
                "text-font": [
                  "DIN Pro Medium",
                  "Arial Unicode MS Regular",
                ],
                "text-offset": [0, 1.05],
                "text-optional": true,
                "text-size": 10,
              },
              paint: {
                "text-color": "#526b5d",
                "text-halo-color": "rgba(244,239,227,.92)",
                "text-halo-width": 1.6,
                "text-opacity": 0.78,
              },
            },
            labelLayer,
          );

          map.addSource("sport-traces", {
            type: "geojson",
            data: routesToGeoJson(routesRef.current),
            lineMetrics: true,
          });
          map.addLayer(
            {
              id: "sport-traces-halo",
              type: "line",
              source: "sport-traces",
              paint: {
                "line-color": "rgba(31,55,43,.82)",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  5.4,
                  12,
                  7.2,
                  15,
                  8.6,
                ],
                "line-opacity": 0.58,
                "line-blur": 0.25,
              },
              layout: { "line-cap": "round", "line-join": "round" },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-traces",
              type: "line",
              source: "sport-traces",
              paint: {
                "line-color": "#c85b2f",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  2.8,
                  12,
                  4.2,
                  15,
                  5.2,
                ],
                "line-opacity": 0.94,
              },
              layout: { "line-cap": "round", "line-join": "round" },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-traces-hover",
              type: "line",
              source: "sport-traces",
              filter: ["==", ["get", "id"], ""],
              paint: {
                "line-color": "#dc6838",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  4.6,
                  12,
                  6,
                  15,
                  7,
                ],
                "line-opacity": 1,
              },
              layout: { "line-cap": "round", "line-join": "round" },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-traces-selected",
              type: "line",
              source: "sport-traces",
              filter: ["==", ["get", "id"], ""],
              paint: {
                "line-color": "#e06a37",
                "line-gradient": "#e06a37",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  5,
                  12,
                  6.8,
                  15,
                  7.8,
                ],
                "line-opacity": 1,
              },
              layout: { "line-cap": "round", "line-join": "round" },
            },
            labelLayer,
          );
          map.addSource("sport-selected-route-markers", {
            type: "geojson",
            data: getRouteMarkersGeoJson(null),
          });
          map.addLayer(
            {
              id: "sport-selected-route-start",
              type: "circle",
              source: "sport-selected-route-markers",
              filter: ["==", ["get", "kind"], "START"],
              paint: {
                "circle-color": "#315f49",
                "circle-radius": 6.5,
                "circle-stroke-color": "#fffaf0",
                "circle-stroke-width": 2.2,
                "circle-translate": [-5, 0],
              },
            },
            labelLayer,
          );
          map.addLayer(
            {
              id: "sport-selected-route-finish",
              type: "circle",
              source: "sport-selected-route-markers",
              filter: ["==", ["get", "kind"], "FINISH"],
              paint: {
                "circle-color": "#c85b2f",
                "circle-radius": 7,
                "circle-stroke-color": "#fffaf0",
                "circle-stroke-width": 2.2,
                "circle-translate": [5, 0],
              },
            },
            labelLayer,
          );
          [
            {
              id: "sport-selected-route-start-label",
              kind: "START",
              offset: [-0.75, 1.35],
            },
            {
              id: "sport-selected-route-finish-label",
              kind: "FINISH",
              offset: [0.75, 1.35],
            },
          ].forEach((endpoint) => {
            map.addLayer(
              {
                id: endpoint.id,
                type: "symbol",
                source: "sport-selected-route-markers",
                filter: ["==", ["get", "kind"], endpoint.kind],
                layout: {
                  "text-field": ["get", "label"],
                  "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                  "text-offset": endpoint.offset,
                  "text-size": 10,
                  "text-allow-overlap": true,
                },
                paint: {
                  "text-color": "#213e31",
                  "text-halo-color": "rgba(248,244,234,.96)",
                  "text-halo-width": 2.4,
                },
              },
              labelLayer,
            );
          });
          map.addLayer(
            {
              id: "sport-selected-route-annotation",
              type: "symbol",
              source: "sport-selected-route-markers",
              filter: ["==", ["get", "kind"], "ANNOTATION"],
              layout: {
                "text-anchor": "bottom",
                "text-field": ["get", "label"],
                "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                "text-offset": [0, -0.9],
                "text-size": 11,
                "text-allow-overlap": true,
              },
              paint: {
                "text-color": "#284b3a",
                "text-halo-color": "rgba(248,244,234,.96)",
                "text-halo-width": 3.5,
              },
            },
            labelLayer,
          );

          clickHandler = (event?: unknown) => {
            const feature = (
              event as {
                features?: Array<{ properties?: { id?: string } }>;
              }
            )?.features?.[0];
            if (feature?.properties?.id) {
              onSelectRouteRef.current(feature.properties.id);
            }
          };
          enterHandler = (event?: unknown) => {
            const hoveredId = (
              event as {
                features?: Array<{ properties?: { id?: string } }>;
              }
            )?.features?.[0]?.properties?.id;

            map.getCanvas().style.cursor = "pointer";
            map.setFilter("sport-traces-hover", [
              "==",
              ["get", "id"],
              hoveredId ?? "",
            ]);
          };
          leaveHandler = () => {
            map.getCanvas().style.cursor = "";
            map.setFilter("sport-traces-hover", ["==", ["get", "id"], ""]);
          };
          map.on("click", "sport-traces", clickHandler);
          map.on("mouseenter", "sport-traces", enterHandler);
          map.on("mouseleave", "sport-traces", leaveHandler);
          moveHandler = () => {
            const center = map.getCenter();
            setMapReading({
              lat: center.lat,
              lng: center.lng,
              zoom: map.getZoom(),
            });
          };
          map.on("moveend", moveHandler);
          fitRoutes(map, mapbox, routesRef.current, false);
          map.resize();
        });

        map.on("idle", () => {
          if (mounted) {
            window.clearTimeout(timeout);
            setStatus("ready");
          }
        });
      })
      .catch(() => {
        window.clearTimeout(timeout);
        if (mounted) setStatus("error");
      });

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      const map = mapRef.current;
      if (map && clickHandler && map.getLayer("sport-traces")) {
        map.off("click", "sport-traces", clickHandler);
      }
      if (map && enterHandler && map.getLayer("sport-traces")) {
        map.off("mouseenter", "sport-traces", enterHandler);
      }
      if (map && leaveHandler && map.getLayer("sport-traces")) {
        map.off("mouseleave", "sport-traces", leaveHandler);
      }
      if (map && moveHandler) {
        map.off("moveend", moveHandler);
      }
      if (selectedRevealFrameRef.current !== null) {
        window.cancelAnimationFrame(selectedRevealFrameRef.current);
        selectedRevealFrameRef.current = null;
      }
      map?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, [retryNonce]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("sport-traces");
    if (!map || !source?.setData || !mapboxRef.current) return;

    source.setData(routeData);
    if (!selectedRouteId) {
      fitRoutes(map, mapboxRef.current, routes, false);
    }
  }, [routeData, routes, selectedRouteId]);

  useEffect(() => {
    const source = mapRef.current?.getSource("sport-summits");
    source?.setData?.(getSummitsGeoJson(summits));
  }, [summits]);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !map.getLayer("sport-traces-selected")) return;

    map.setFilter("sport-traces-selected", [
      "==",
      ["get", "id"],
      selectedRouteId ?? "",
    ]);
    map.setPaintProperty(
      "sport-traces",
      "line-opacity",
      selectedRouteId
        ? ["case", ["==", ["get", "id"], selectedRouteId], 0.14, 0.055]
        : 0.94,
    );
    map.setPaintProperty(
      "sport-traces-halo",
      "line-opacity",
      selectedRouteId ? 0.07 : 0.58,
    );

    const selectedRoute = routes.find((route) => route.id === selectedRouteId);
    map
      .getSource("sport-selected-route-markers")
      ?.setData?.(getRouteMarkersGeoJson(selectedRoute ?? null));

    if (selectedRevealFrameRef.current !== null) {
      window.cancelAnimationFrame(selectedRevealFrameRef.current);
      selectedRevealFrameRef.current = null;
    }

    if (selectedRoute) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        map.setPaintProperty(
          "sport-traces-selected",
          "line-gradient",
          "#e06a37",
        );
      } else {
        const startedAt = performance.now();
        const duration = 460;

        const reveal = (timestamp: number) => {
          const progress = Math.min((timestamp - startedAt) / duration, 1);
          const easedProgress = 1 - (1 - progress) ** 3;
          map.setPaintProperty("sport-traces-selected", "line-gradient", [
            "case",
            ["<=", ["line-progress"], easedProgress],
            "#e06a37",
            "rgba(224,106,55,0)",
          ]);

          if (progress < 1) {
            selectedRevealFrameRef.current =
              window.requestAnimationFrame(reveal);
          } else {
            map.setPaintProperty(
              "sport-traces-selected",
              "line-gradient",
              "#e06a37",
            );
            selectedRevealFrameRef.current = null;
          }
        };

        selectedRevealFrameRef.current = window.requestAnimationFrame(reveal);
      }
    } else {
      map.setPaintProperty("sport-traces-selected", "line-gradient", "#e06a37");
    }

    fitRoutes(
      map,
      mapbox,
      selectedRoute ? [selectedRoute] : routes,
      Boolean(selectedRoute),
    );

    return () => {
      if (selectedRevealFrameRef.current !== null) {
        window.cancelAnimationFrame(selectedRevealFrameRef.current);
        selectedRevealFrameRef.current = null;
      }
    };
  }, [routes, selectedRouteId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
      window.setTimeout(() => mapRef.current?.resize(), 100);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function resetView() {
    if (mapRef.current && mapboxRef.current) {
      fitRoutes(
        mapRef.current,
        mapboxRef.current,
        routes,
        Boolean(selectedRouteId),
      );
    }
  }

  async function toggleFullscreen() {
    if (!frameRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await frameRef.current.requestFullscreen();
    }
  }

  return (
    <div
      ref={frameRef}
      className={styles.mapFrame}
      role="region"
      aria-label="Carte 3D interactive de tes traces outdoor"
    >
      <div ref={containerRef} className={styles.mapCanvas} />

      <div className={styles.atlasSurface} aria-hidden="true">
        <span className={styles.atlasInnerFrame} />
      </div>

      <div className={styles.atlasTitle} aria-hidden="true">
        <span>Atlas personnel</span>
        <b>HOVREN</b>
      </div>

      <div className={styles.mapLegend} aria-hidden="true">
        <span />
        Traces personnelles
      </div>

      <div className={styles.atlasScale} aria-hidden="true">
        <span style={{ width: `${scaleReading.width}px` }} />
        <b>{scaleReading.label}</b>
      </div>

      <div className={styles.atlasCoordinates} aria-hidden="true">
        {formatCoordinate(mapReading.lat, "N", "S")}
        <span />
        {formatCoordinate(mapReading.lng, "E", "O")}
      </div>

      <div className={styles.mapControls} aria-label="Contrôles de la carte">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn({ duration: 220 })}
          aria-label="Zoomer"
          title="Zoomer"
        >
          <Plus aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut({ duration: 220 })}
          aria-label="Dézoomer"
          title="Dézoomer"
        >
          <Minus aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.resetNorthPitch({ duration: 350 })}
          aria-label="Revenir au nord et à la vue 2D"
          title="Nord et vue 2D"
        >
          <Compass aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Recentrer sur les traces visibles"
          title="Recentrer"
        >
          <LocateFixed aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() =>
            mapRef.current?.easeTo({
              pitch: 56,
              bearing: -18,
              duration: 350,
            })
          }
          aria-label="Afficher le relief en 3D"
          title="Relief 3D"
        >
          <RotateCcw aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
        >
          {isFullscreen ? (
            <Shrink aria-hidden="true" />
          ) : (
            <Expand aria-hidden="true" />
          )}
        </button>
      </div>

      {selectedRouteId ? (
        <button
          type="button"
          className={styles.clearSelection}
          onClick={onClearSelection}
        >
          Vue d’ensemble
        </button>
      ) : null}

      {inspector}

      {status !== "ready" ? (
        <div className={styles.mapState} role="status">
          <Compass aria-hidden="true" />
          <strong>
            {status === "loading"
              ? "La carte déplie le relief..."
              : status === "unconfigured"
                ? "La carte attend sa clé Mapbox"
                : "Le relief n’a pas pu charger"}
          </strong>
          <p>
            {status === "error"
              ? "Tes statistiques et tes traces restent disponibles sous la carte."
              : status === "unconfigured"
                ? "Ajoute la clé publique Mapbox à l’environnement web."
                : "Quelques secondes suffisent pour révéler ton territoire."}
          </p>
          {status === "error" ? (
            <button
              type="button"
              onClick={() => setRetryNonce((value) => value + 1)}
            >
              Réessayer
            </button>
          ) : null}
        </div>
      ) : null}

      <p className={styles.mapDescription}>
        Carte interactive. Les traces restent également accessibles dans la
        liste « Traces marquantes ».
      </p>
    </div>
  );
}
