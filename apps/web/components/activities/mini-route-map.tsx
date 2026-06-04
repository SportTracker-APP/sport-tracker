"use client";

import { LocateFixed, Minus, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";

type Point = {
  lat: number;
  lng: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type MapTile = {
  key: string;
  url: string;
  x: number;
  y: number;
};

type MapInteraction = {
  panX: number;
  panY: number;
  zoomOffset: number;
};

type MiniRouteMapProps = {
  polyline: string | null;
  display?: "wide" | "square";
  size?: "mini" | "large";
};

const TILE_SIZE = 256;
const VIEW_WIDTH = 512;
const VIEW_HEIGHT = 300;
const DEFAULT_TILE_TEMPLATE =
  process.env.NEXT_PUBLIC_TOPO_TILE_URL ||
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";

const contourPaths = [
  "M-8 104 C18 86 38 93 58 76 C79 58 98 66 120 48 C145 28 170 35 229 8",
  "M-12 116 C24 95 42 101 67 83 C91 65 106 74 132 55 C153 40 178 43 228 22",
  "M-10 88 C20 73 44 79 64 61 C83 44 103 50 122 34 C145 15 170 18 228 -4",
  "M12 132 C35 115 56 118 78 98 C102 76 126 84 148 64 C170 44 192 48 236 30",
  "M-14 54 C18 42 36 48 58 33 C82 17 105 24 126 10 C148 -4 174 -1 226 -16",
  "M22 14 C44 29 58 22 77 38 C96 54 118 47 140 63 C162 79 180 72 218 94",
  "M-10 22 C16 37 37 31 58 48 C80 67 102 58 124 75 C148 94 170 88 226 112",
  "M64 133 C78 112 89 109 104 92 C121 73 138 78 154 59 C171 39 188 38 221 51",
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

function lngLatToWorld(point: Point, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((point.lat * Math.PI) / 180);
  const x = ((point.lng + 180) / 360) * scale;
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;

  return {
    x,
    y,
  };
}

function chooseZoom(points: Point[], isLarge: boolean) {
  const padding = isLarge ? 72 : 48;
  const normalizedPoints = points.map((point) => lngLatToWorld(point, 0));
  const minX = Math.min(...normalizedPoints.map((point) => point.x));
  const maxX = Math.max(...normalizedPoints.map((point) => point.x));
  const minY = Math.min(...normalizedPoints.map((point) => point.y));
  const maxY = Math.max(...normalizedPoints.map((point) => point.y));

  for (let zoom = 16; zoom >= 3; zoom -= 1) {
    const scale = 2 ** zoom;
    const spanX = (maxX - minX) * scale;
    const spanY = (maxY - minY) * scale;

    if (
      spanX <= VIEW_WIDTH - padding * 2 &&
      spanY <= VIEW_HEIGHT - padding * 2
    ) {
      return zoom;
    }
  }

  return 3;
}

function buildTileUrl(zoom: number, x: number, y: number) {
  const subdomains = ["a", "b", "c"];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];

  return DEFAULT_TILE_TEMPLATE.replace("{s}", subdomain)
    .replace("{z}", zoom.toString())
    .replace("{x}", x.toString())
    .replace("{y}", y.toString());
}

function buildPath(points: ProjectedPoint[]) {
  return points
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(
        1,
      )} ${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function buildRoute(
  points: Point[],
  isLarge: boolean,
  interaction: MapInteraction,
) {
  if (points.length < 2) {
    return null;
  }

  const baseZoom = chooseZoom(points, isLarge);
  const zoom = isLarge
    ? Math.min(17, Math.max(3, baseZoom + interaction.zoomOffset))
    : baseZoom;
  const worldPoints = points.map((point) => lngLatToWorld(point, zoom));
  const minX = Math.min(...worldPoints.map((point) => point.x));
  const maxX = Math.max(...worldPoints.map((point) => point.x));
  const minY = Math.min(...worldPoints.map((point) => point.y));
  const maxY = Math.max(...worldPoints.map((point) => point.y));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const viewportLeft =
    centerX - VIEW_WIDTH / 2 + (isLarge ? interaction.panX : 0);
  const viewportTop =
    centerY - VIEW_HEIGHT / 2 + (isLarge ? interaction.panY : 0);

  const projectedPoints = worldPoints.map((point) => ({
    x: point.x - viewportLeft,
    y: point.y - viewportTop,
  }));

  const tileMinX = Math.floor(viewportLeft / TILE_SIZE);
  const tileMaxX = Math.floor((viewportLeft + VIEW_WIDTH) / TILE_SIZE);
  const tileMinY = Math.floor(viewportTop / TILE_SIZE);
  const tileMaxY = Math.floor((viewportTop + VIEW_HEIGHT) / TILE_SIZE);
  const tileLimit = 2 ** zoom;
  const tiles: MapTile[] = [];

  for (let tileX = tileMinX; tileX <= tileMaxX; tileX += 1) {
    for (let tileY = tileMinY; tileY <= tileMaxY; tileY += 1) {
      if (tileY < 0 || tileY >= tileLimit) {
        continue;
      }

      const wrappedTileX = ((tileX % tileLimit) + tileLimit) % tileLimit;

      tiles.push({
        key: `${zoom}-${tileX}-${tileY}`,
        url: buildTileUrl(zoom, wrappedTileX, tileY),
        x: tileX * TILE_SIZE - viewportLeft,
        y: tileY * TILE_SIZE - viewportTop,
      });
    }
  }

  return {
    path: buildPath(projectedPoints),
    start: projectedPoints[0],
    end: projectedPoints[projectedPoints.length - 1],
    tiles,
  };
}

function DecorativeTerrain() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#172215_0%,#1f2b1c_28%,#141b1e_58%,#251d32_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(190,242,100,0.24),transparent_25%),radial-gradient(circle_at_72%_28%,rgba(45,212,191,0.14),transparent_28%),radial-gradient(circle_at_76%_78%,rgba(168,85,247,0.18),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.11),transparent_26%,rgba(0,0,0,0.34)_66%,rgba(0,0,0,0.48))] mix-blend-soft-light" />
      <svg
        viewBox="0 0 220 128"
        className="absolute inset-0 h-full w-full opacity-80"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="terrain-shadow"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feDropShadow
              dx="1.6"
              dy="1.8"
              stdDeviation="1.2"
              floodColor="#000000"
              floodOpacity="0.28"
            />
          </filter>
        </defs>
        <path
          d="M-16 130 L-16 86 C14 74 38 80 58 58 C82 32 111 45 134 24 C158 1 185 15 236 -18 L236 130 Z"
          fill="rgba(132,204,22,0.10)"
        />
        <path
          d="M-16 130 L-16 105 C24 91 48 103 74 78 C103 51 127 66 154 39 C178 16 198 24 236 6 L236 130 Z"
          fill="rgba(14,165,233,0.08)"
        />
        {contourPaths.map((path, index) => (
          <path
            key={path}
            d={path}
            fill="none"
            stroke={
              index % 3 === 0
                ? "rgba(236,252,203,0.22)"
                : "rgba(236,252,203,0.12)"
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={index % 3 === 0 ? "0.9" : "0.55"}
            filter={index % 3 === 0 ? "url(#terrain-shadow)" : undefined}
          />
        ))}
      </svg>
    </>
  );
}

export function MiniRouteMap({
  polyline,
  display = "wide",
  size = "mini",
}: MiniRouteMapProps) {
  const isLarge = size === "large";
  const isSquare = isLarge && display === "square";
  const [interaction, setInteraction] = useState<MapInteraction>({
    panX: 0,
    panY: 0,
    zoomOffset: 0,
  });
  const dragRef = useRef<{
    lastX: number;
    lastY: number;
  } | null>(null);
  const decodedPoints = useMemo(
    () => (polyline ? decodePolyline(polyline) : []),
    [polyline],
  );
  const route = useMemo(
    () =>
      decodedPoints.length > 0
        ? buildRoute(decodedPoints, isLarge, interaction)
        : null,
    [decodedPoints, interaction, isLarge],
  );
  const routeStrokeWidth = isLarge ? "4.2" : "4.8";
  const routeHaloWidth = isLarge ? "8.5" : "9";
  const isInteractive = Boolean(route && isLarge);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!isInteractive) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      lastX: event.clientX,
      lastY: event.clientY,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !isInteractive) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.lastX;
    const deltaY = event.clientY - dragRef.current.lastY;
    dragRef.current = {
      lastX: event.clientX,
      lastY: event.clientY,
    };

    setInteraction((current) => ({
      ...current,
      panX: current.panX - deltaX,
      panY: current.panY - deltaY,
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!isInteractive) {
      return;
    }

    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;

    setInteraction((current) => ({
      ...current,
      zoomOffset: Math.min(3, Math.max(0, current.zoomOffset + direction)),
    }));
  }

  function zoomIn() {
    setInteraction((current) => ({
      ...current,
      zoomOffset: Math.min(3, current.zoomOffset + 1),
    }));
  }

  function zoomOut() {
    setInteraction((current) => ({
      ...current,
      zoomOffset: Math.max(0, current.zoomOffset - 1),
    }));
  }

  function recenter() {
    setInteraction({
      panX: 0,
      panY: 0,
      zoomOffset: 0,
    });
  }

  return (
    <div
      className={`app-mini-route-map relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11140f] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
        isSquare
          ? "aspect-square rounded-[28px]"
          : isLarge
            ? "h-[360px] rounded-[28px]"
            : "h-32"
      } ${isInteractive ? "cursor-grab active:cursor-grabbing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{
        touchAction: isInteractive ? "none" : undefined,
      }}
    >
      <DecorativeTerrain />

      {route && (
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {route.tiles.map((tile) => (
            <image
              key={tile.key}
              className="app-map-tile"
              href={tile.url}
              height={TILE_SIZE}
              opacity="0.95"
              preserveAspectRatio="none"
              width={TILE_SIZE}
              x={tile.x}
              y={tile.y}
            />
          ))}
        </svg>
      )}

      <div className="app-map-shade absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,14,0.16),rgba(7,10,14,0.36))]" />
      <div className="app-map-vignette absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.46)_100%)]" />

      {route ? (
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Aperçu du parcours"
        >
          <path
            d={route.path}
            fill="none"
            stroke="rgba(5,8,13,0.80)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={routeHaloWidth}
          />
          <path
            d={route.path}
            fill="none"
            stroke="rgba(255,255,255,0.78)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isLarge ? "5.7" : "6.1"}
          />
          <path
            d={route.path}
            fill="none"
            stroke="url(#route-gradient)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={routeStrokeWidth}
          />
          <circle
            cx={route.start.x}
            cy={route.start.y}
            r={isLarge ? "7" : "6"}
            fill="#34d399"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <circle
            cx={route.end.x}
            cy={route.end.y}
            r={isLarge ? "7" : "6"}
            fill="#fb7185"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <defs>
            <linearGradient id="route-gradient" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="55%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>
        </svg>
      ) : (
        <div className="relative flex h-full items-center justify-center px-6 text-center text-xs font-medium text-zinc-300/75">
          Parcours disponible après synchronisation
        </div>
      )}

      {route && isLarge && (
        <>
          <div className="app-map-chip absolute top-4 left-4 rounded-full border border-white/[0.10] bg-black/45 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-xl">
            Carte topo
          </div>
          <div className="app-map-controls absolute top-4 right-4 flex overflow-hidden rounded-2xl border border-white/[0.10] bg-black/55 backdrop-blur-xl">
            <button
              type="button"
              aria-label="Agrandir la carte"
              title="Agrandir la carte"
              onClick={zoomIn}
              onPointerDown={(event) => event.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Réduire la carte"
              title="Réduire la carte"
              onClick={zoomOut}
              onPointerDown={(event) => event.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center border-l border-white/[0.08] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Recentrer"
              title="Recentrer"
              onClick={recenter}
              onPointerDown={(event) => event.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center border-l border-white/[0.08] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>
          <div className="app-map-legend absolute right-4 bottom-4 left-4 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/55 px-4 py-3 text-xs text-zinc-200 backdrop-blur-xl">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Départ
            </span>
            <span className="text-[10px] text-zinc-500">
              © OpenTopoMap / OpenStreetMap
            </span>
            <span className="flex items-center gap-2">
              Arrivée
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            </span>
          </div>
        </>
      )}
    </div>
  );
}
