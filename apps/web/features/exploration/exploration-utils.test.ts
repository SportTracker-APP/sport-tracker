import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";

import {
  createExplorationViewModel,
  decodePolyline,
  formatDuration,
  getNotableRoutes,
  getRecentMapAreaRoutes,
  mapActivitiesToRoutes,
  matchesFilter,
  routesToGeoJson,
} from "./exploration-utils";

const ROUTE_POLYLINE = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";

function createActivity(overrides: Partial<Activity> = {}): Activity {
  const id = overrides.id ?? "activity-1";
  return {
    id,
    title: `Trace ${id}`,
    description: null,
    stravaActivityId: null,
    type: "ACTIVITY",
    sport: "TRAIL",
    status: "COMPLETED",
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: null,
    celebrationSeenAt: null,
    distance: 12.4,
    duration: 92,
    movingTime: null,
    elevationGain: 680,
    elevationLoss: null,
    maxAltitude: 1768,
    minAltitude: null,
    calories: null,
    averageSpeed: null,
    maxSpeed: null,
    pace: null,
    averageHeartRate: null,
    maxHeartRate: null,
    temperature: null,
    weather: null,
    city: "Annecy",
    country: "France",
    startLatitude: null,
    startLongitude: null,
    endLatitude: null,
    endLongitude: null,
    routePolyline: ROUTE_POLYLINE,
    coverImageUrl: null,
    photoUrls: null,
    photoCount: null,
    altitudeStream: null,
    distanceStream: null,
    startedAt: "2026-07-06T08:00:00.000Z",
    createdAt: "2026-07-06T10:00:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z",
    ...overrides,
  };
}

describe("exploration utilities", () => {
  it("décode une polyline et produit une seule source GeoJSON", () => {
    const points = decodePolyline(ROUTE_POLYLINE);
    expect(points).toHaveLength(3);

    const routes = mapActivitiesToRoutes([createActivity()]);
    const geoJson = routesToGeoJson(routes);

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0]?.properties.id).toBe("activity-1");
    expect(geoJson.features[0]?.geometry.coordinates.length).toBeGreaterThan(1);
  });

  it("ignore tout ce qui n’est pas une trace réellement terminée", () => {
    const routes = mapActivitiesToRoutes([
      createActivity({ id: "valid" }),
      createActivity({ id: "planned", status: "PLANNED" }),
      createActivity({ id: "missed", status: "MISSED" }),
      createActivity({ id: "canceled", status: "CANCELED" }),
      createActivity({
        id: "future",
        startedAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
      createActivity({ id: "gym", sport: "GYM" }),
      createActivity({ id: "without-route", routePolyline: null }),
    ]);

    expect(routes.map((route) => route.id)).toEqual(["valid"]);
  });

  it("regroupe les pratiques cyclistes et la randonnée dans leurs filtres", () => {
    const routes = mapActivitiesToRoutes([
      createActivity({ id: "gravel", sport: "GRAVEL" }),
      createActivity({ id: "walk", sport: "WALKING" }),
    ]);

    expect(matchesFilter(routes[0]!, "BIKE")).toBe(true);
    expect(matchesFilter(routes[1]!, "HIKING")).toBe(true);
    expect(matchesFilter(routes[0]!, "RUNNING")).toBe(false);
  });

  it("calcule les statistiques sur le filtre actif sans perdre les territoires disponibles", () => {
    const activities = [
      createActivity({
        id: "annecy-1",
        city: "Annecy",
        distance: 10,
        elevationGain: 500,
      }),
      createActivity({
        id: "annecy-2",
        city: "Annecy",
        distance: 15,
        elevationGain: 800,
        startedAt: "2026-07-07T08:00:00.000Z",
      }),
      createActivity({
        id: "thones",
        city: "Thônes",
        distance: 8,
        elevationGain: 400,
        startedAt: "2026-07-08T08:00:00.000Z",
      }),
    ];

    const viewModel = createExplorationViewModel({
      activities,
      filter: "ALL",
      selectedRouteId: null,
      territory: "Annecy",
    });

    expect(viewModel.filteredRoutes).toHaveLength(2);
    expect(viewModel.totalDistance).toBe(25);
    expect(viewModel.totalElevation).toBe(1300);
    expect(viewModel.departureCount).toBe(1);
    expect(viewModel.availableTerritories.map(({ name }) => name)).toEqual([
      "Annecy",
      "Thônes",
    ]);
  });

  it("affiche Mandalaz et toutes les traces éligibles sans plafond", () => {
    const activities = Array.from({ length: 24 }, (_, index) =>
      createActivity({
        id: index === 23 ? "mandalaz" : `route-${index}`,
        title:
          index === 23
            ? "EP27 - Trail Tête de Mandalaz"
            : `Trace route-${index}`,
        startedAt: new Date(Date.UTC(2026, 5, 24 - index)).toISOString(),
      }),
    );
    const selectedRouteId = "mandalaz";
    const viewModel = createExplorationViewModel({
      activities,
      filter: "ALL",
      selectedRouteId,
      territory: null,
    });

    expect(viewModel.visibleMapRoutes).toHaveLength(24);
    expect(viewModel.visibleMapRoutes.map(({ id }) => id)).toContain(
      selectedRouteId,
    );
  });

  it("cadre la zone principale des dix dernières sorties sans privilégier l’ancien foyer", () => {
    const createRoute = (
      id: string,
      lat: number,
      lng: number,
      startedAt: string,
    ): ReturnType<typeof mapActivitiesToRoutes>[number] => ({
      id,
      title: id,
      sport: "TRAIL",
      points: [
        { lat, lng },
        { lat: lat + 0.01, lng: lng + 0.01 },
      ],
      distance: 10,
      duration: 60,
      elevationGain: 500,
      maxAltitude: 1500,
      startedAt,
      city: null,
      country: "France",
      coverImageUrl: null,
    });
    const formerHomeRoutes = Array.from({ length: 12 }, (_, index) =>
      createRoute(
        `ancien-${index}`,
        48.86 + index * 0.001,
        2.35 + index * 0.001,
        new Date(Date.UTC(2025, 2, index + 1)).toISOString(),
      ),
    );
    const isolatedRecentRoutes = [
      createRoute("bordeaux", 44.84, -0.58, "2026-01-01T08:00:00.000Z"),
      createRoute("marseille", 43.3, 5.37, "2026-02-01T08:00:00.000Z"),
      createRoute("lille", 50.63, 3.06, "2026-03-01T08:00:00.000Z"),
      createRoute("brest", 48.39, -4.49, "2026-04-01T08:00:00.000Z"),
      createRoute("toulouse", 43.6, 1.44, "2026-05-01T08:00:00.000Z"),
      createRoute("strasbourg", 48.58, 7.75, "2026-05-15T08:00:00.000Z"),
      createRoute("nice", 43.71, 7.26, "2026-06-01T08:00:00.000Z"),
      createRoute("clermont", 45.78, 3.08, "2026-06-15T08:00:00.000Z"),
    ];
    const routes = [
      ...formerHomeRoutes,
      ...isolatedRecentRoutes,
      createRoute("annecy-1", 45.9, 6.13, "2026-07-06T08:00:00.000Z"),
      createRoute("annecy-2", 45.93, 6.08, "2026-07-07T08:00:00.000Z"),
    ];

    expect(getRecentMapAreaRoutes(routes).map(({ id }) => id)).toEqual([
      "annecy-1",
      "annecy-2",
    ]);
    expect(routes).toHaveLength(22);
  });

  it("ne répète pas une même trace dans les distinctions", () => {
    const routes = mapActivitiesToRoutes([createActivity()]);
    expect(getNotableRoutes(routes)).toHaveLength(1);
  });

  it("formate une durée de manière lisible", () => {
    expect(formatDuration(52)).toBe("52 min");
    expect(formatDuration(92)).toBe("1 h 32");
  });
});
