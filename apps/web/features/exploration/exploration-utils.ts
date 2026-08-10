import type {
  ExplorationFilter,
  ExplorationPoint,
  ExplorationRoute,
  ExplorationSourceActivity,
  ExplorationTerritory,
  ExplorationViewModel,
  GeoJsonFeatureCollection,
  NotableRoute,
} from "./exploration-types";
import { getEditorialActivityImage } from "@/lib/mountain-visuals";

export const MAP_ROUTE_LIMIT = 18;

export const OUTDOOR_SPORTS = new Set([
  "RUNNING",
  "TRAIL",
  "HIKING",
  "WALKING",
  "MTB",
  "ROAD_CYCLING",
  "GRAVEL",
]);

export function decodePolyline(polyline: string): ExplorationPoint[] {
  const points: ExplorationPoint[] = [];
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
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

export function mapActivitiesToRoutes(
  activities: ExplorationSourceActivity[],
): ExplorationRoute[] {
  return activities
    .filter(
      (activity) =>
        activity.status !== "PLANNED" &&
        Boolean(activity.routePolyline) &&
        OUTDOOR_SPORTS.has(activity.sport),
    )
    .map((activity) => ({
      id: activity.id,
      title: activity.title || "Sortie sans titre",
      sport: activity.sport,
      points: decodePolyline(activity.routePolyline || ""),
      distance: activity.distance || 0,
      duration: activity.duration,
      elevationGain: activity.elevationGain || 0,
      maxAltitude: activity.maxAltitude,
      startedAt: activity.startedAt,
      city: activity.city,
      country: activity.country,
      coverImageUrl:
        activity.coverImageUrl ??
        activity.photoUrls?.[0] ??
        getEditorialActivityImage(activity.id, activity.sport),
    }))
    .filter((route) => route.points.length > 1)
    .sort(
      (firstRoute, secondRoute) =>
        new Date(secondRoute.startedAt).getTime() -
        new Date(firstRoute.startedAt).getTime(),
    );
}

export function matchesFilter(
  route: ExplorationRoute,
  filter: ExplorationFilter,
) {
  if (filter === "ALL") return true;
  if (filter === "BIKE") {
    return ["MTB", "ROAD_CYCLING", "GRAVEL"].includes(route.sport);
  }
  if (filter === "HIKING") {
    return ["HIKING", "WALKING"].includes(route.sport);
  }
  return route.sport === filter;
}

export function getSportLabel(sport: string) {
  const labels: Record<string, string> = {
    GRAVEL: "Gravel",
    HIKING: "Randonnée",
    MTB: "VTT",
    ROAD_CYCLING: "Cyclisme",
    RUNNING: "Course",
    TRAIL: "Trail",
    WALKING: "Marche",
  };
  return labels[sport] ?? "Sortie";
}

export function getSportColor(sport: string) {
  if (sport === "RUNNING") return "#c85b2f";
  if (sport === "TRAIL" || sport === "HIKING") return "#315f49";
  if (sport === "WALKING") return "#708276";
  if (["MTB", "ROAD_CYCLING", "GRAVEL"].includes(sport)) return "#a7773b";
  return "#526b5d";
}

export function simplifyRoutePoints(points: ExplorationPoint[]) {
  if (points.length <= 600) return points;
  const step = Math.ceil(points.length / 600);
  const simplified = points.filter((_, index) => index % step === 0);
  const lastPoint = points.at(-1);
  if (lastPoint && simplified.at(-1) !== lastPoint) simplified.push(lastPoint);
  return simplified;
}

export function routesToGeoJson(
  routes: ExplorationRoute[],
): GeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => ({
      type: "Feature",
      properties: {
        id: route.id,
        sport: getSportLabel(route.sport),
        stroke: getSportColor(route.sport),
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

function getDepartureClusterCount(routes: ExplorationRoute[]) {
  return new Set(
    routes
      .map((route) => route.points[0])
      .filter(Boolean)
      .map((point) => `${point.lat.toFixed(2)},${point.lng.toFixed(2)}`),
  ).size;
}

export function getTerritories(
  routes: ExplorationRoute[],
): ExplorationTerritory[] {
  const territories = new Map<string, ExplorationTerritory>();

  routes.forEach((route) => {
    if (!route.city) return;
    const current = territories.get(route.city);
    if (!current) {
      territories.set(route.city, {
        name: route.city,
        routeCount: 1,
        distance: route.distance,
        elevationGain: route.elevationGain,
        lastVisitedAt: route.startedAt,
      });
      return;
    }
    current.routeCount += 1;
    current.distance += route.distance;
    current.elevationGain += route.elevationGain;
    if (
      new Date(route.startedAt).getTime() >
      new Date(current.lastVisitedAt).getTime()
    ) {
      current.lastVisitedAt = route.startedAt;
    }
  });

  return [...territories.values()]
    .sort((first, second) => second.routeCount - first.routeCount)
    .slice(0, 6);
}

export function getNotableRoutes(
  routes: ExplorationRoute[],
): NotableRoute[] {
  if (routes.length === 0) return [];
  const candidates = [
    {
      distinction: "Plus grand dénivelé",
      route: routes.reduce((best, route) =>
        route.elevationGain > best.elevationGain ? route : best,
      ),
    },
    {
      distinction: "Plus longue trace",
      route: routes.reduce((best, route) =>
        route.distance > best.distance ? route : best,
      ),
    },
    {
      distinction: "Dernière aventure",
      route: routes[0],
    },
    {
      distinction: "Point le plus haut",
      route: routes.reduce((best, route) =>
        (route.maxAltitude || 0) > (best.maxAltitude || 0) ? route : best,
      ),
    },
  ];
  const seen = new Set<string>();
  return candidates.filter(({ route }) => {
    if (seen.has(route.id)) return false;
    seen.add(route.id);
    return true;
  });
}

export function createExplorationViewModel({
  activities,
  filter,
  selectedRouteId,
  territory,
}: {
  activities: ExplorationSourceActivity[];
  filter: ExplorationFilter;
  selectedRouteId: string | null;
  territory: string | null;
}): ExplorationViewModel {
  const allRoutes = mapActivitiesToRoutes(activities);
  const sportRoutes = allRoutes.filter((route) => matchesFilter(route, filter));
  const availableTerritories = getTerritories(sportRoutes);
  const filteredRoutes = sportRoutes.filter(
    (route) => !territory || route.city === territory,
  );
  const selectedRoute =
    filteredRoutes.find((route) => route.id === selectedRouteId) ?? null;
  const recentRoutes = filteredRoutes.slice(0, MAP_ROUTE_LIMIT);
  const visibleMapRoutes =
    selectedRoute && !recentRoutes.some((route) => route.id === selectedRoute.id)
      ? [
          selectedRoute,
          ...filteredRoutes
            .filter((route) => route.id !== selectedRoute.id)
            .slice(0, MAP_ROUTE_LIMIT - 1),
        ]
      : recentRoutes;

  return {
    allRoutes,
    allDistance: allRoutes.reduce(
      (total, route) => total + route.distance,
      0,
    ),
    filteredRoutes,
    visibleMapRoutes,
    selectedRoute,
    totalDistance: filteredRoutes.reduce(
      (total, route) => total + route.distance,
      0,
    ),
    totalElevation: filteredRoutes.reduce(
      (total, route) => total + route.elevationGain,
      0,
    ),
    departureCount: getDepartureClusterCount(filteredRoutes),
    availableTerritories,
    notableRoutes: getNotableRoutes(filteredRoutes),
  };
}

export function formatDistance(distance: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(distance);
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

export function formatDate(date: string, compact = false) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: compact ? "short" : "long",
    year: compact ? undefined : "numeric",
  }).format(new Date(date));
}
