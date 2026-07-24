import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";

import {
  createExplorationViewModel,
  decodePolyline,
  formatDuration,
  getNotableRoutes,
  mapActivitiesToRoutes,
  matchesFilter,
  routesToGeoJson,
} from "./exploration-utils";

const ROUTE_POLYLINE = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";

function createActivity(
  overrides: Partial<Activity> = {},
): Activity {
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

  it("ignore les séances planifiées, les sports intérieurs et les sorties sans trace", () => {
    const routes = mapActivitiesToRoutes([
      createActivity({ id: "valid" }),
      createActivity({ id: "planned", status: "PLANNED" }),
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

  it("conserve la trace sélectionnée dans la fenêtre cartographique récente", () => {
    const activities = Array.from({ length: 22 }, (_, index) =>
      createActivity({
        id: `route-${index}`,
        startedAt: new Date(Date.UTC(2026, 6, 23 - index)).toISOString(),
      }),
    );
    const selectedRouteId = "route-21";
    const viewModel = createExplorationViewModel({
      activities,
      filter: "ALL",
      selectedRouteId,
      territory: null,
    });

    expect(viewModel.visibleMapRoutes).toHaveLength(18);
    expect(viewModel.visibleMapRoutes[0]?.id).toBe(selectedRouteId);
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
