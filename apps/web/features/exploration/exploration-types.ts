import type { Activity } from "@/lib/activities";

export type ExplorationPoint = {
  lat: number;
  lng: number;
};

export type ExplorationRoute = {
  id: string;
  title: string;
  sport: string;
  points: ExplorationPoint[];
  distance: number;
  duration: number;
  elevationGain: number;
  maxAltitude: number | null;
  startedAt: string;
  city: string | null;
  country: string | null;
  coverImageUrl: string | null;
};

export type ExplorationFilter = "ALL" | "RUNNING" | "TRAIL" | "HIKING" | "BIKE";

export type ExplorationTerritory = {
  name: string;
  routeCount: number;
  distance: number;
  elevationGain: number;
  lastVisitedAt: string;
};

export type NotableRoute = {
  route: ExplorationRoute;
  distinction: string;
};

export type ExplorationViewModel = {
  allRoutes: ExplorationRoute[];
  allDistance: number;
  filteredRoutes: ExplorationRoute[];
  visibleMapRoutes: ExplorationRoute[];
  selectedRoute: ExplorationRoute | null;
  totalDistance: number;
  totalElevation: number;
  departureCount: number;
  availableTerritories: ExplorationTerritory[];
  notableRoutes: NotableRoute[];
};

export type ExplorationSourceActivity = Activity;

export type GeoJsonFeatureCollection = {
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

export type SummitGeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      altitude: number;
      bookIndex: string;
      label: string;
      name: string;
      tier: "CORE" | "SECONDARY";
      status: "DISCOVERED" | "LATEST" | "UNDISCOVERED";
    };
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
  }>;
};

export type RouteMarkerGeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      kind: "ANNOTATION" | "FINISH" | "START";
      label: string;
    };
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
  }>;
};

export type MapboxSourceLike = {
  setData?: (
    data:
      | GeoJsonFeatureCollection
      | RouteMarkerGeoJsonFeatureCollection
      | SummitGeoJsonFeatureCollection,
  ) => void;
};

export type MapboxMapLike = {
  addControl: (control: unknown, position?: string) => void;
  addLayer: (layer: Record<string, unknown>, beforeId?: string) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  easeTo: (options: Record<string, unknown>) => void;
  fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
  getCanvas: () => HTMLCanvasElement;
  getCenter: () => { lat: number; lng: number };
  getLayer: (id: string) => unknown;
  getSource: (id: string) => MapboxSourceLike | undefined;
  getStyle: () => { layers?: Array<{ id: string; type?: string }> };
  getZoom: () => number;
  off: (
    event: string,
    layerOrListener: string | ((event?: unknown) => void),
    listener?: (event?: unknown) => void,
  ) => void;
  on: (
    event: string,
    layerOrListener: string | ((event?: unknown) => void),
    listener?: (event?: unknown) => void,
  ) => void;
  remove: () => void;
  resize: () => void;
  resetNorthPitch: (options?: Record<string, unknown>) => void;
  setFilter: (layerId: string, filter: unknown[]) => void;
  setFog?: (fog: Record<string, unknown>) => void;
  setPaintProperty: (layerId: string, name: string, value: unknown) => void;
  setLayoutProperty: (layerId: string, name: string, value: unknown) => void;
  setTerrain?: (terrain: Record<string, unknown>) => void;
  zoomIn: (options?: Record<string, unknown>) => void;
  zoomOut: (options?: Record<string, unknown>) => void;
};

export type MapboxLike = {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMapLike;
  LngLatBounds: new (
    southwest?: [number, number],
    northeast?: [number, number],
  ) => {
    extend: (point: [number, number]) => void;
  };
};
