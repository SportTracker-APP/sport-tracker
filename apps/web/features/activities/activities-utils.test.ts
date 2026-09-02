import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";

import {
  createActivityViewModel,
  createRouteSketch,
  createYearlySummary,
  filterActivities,
  getCompletedActivities,
  groupActivitiesByMonth,
} from "./activities-utils";

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    title: "Boucle du Semnoz",
    description: null,
    type: "TRAINING",
    sport: "TRAIL",
    status: "COMPLETED",
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: null,
    celebrationSeenAt: null,
    distance: 12.4,
    duration: 95,
    movingTime: 90,
    elevationGain: 680,
    elevationLoss: 680,
    maxAltitude: 1699,
    calories: 910,
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
    routePolyline: "abc",
    coverImageUrl: null,
    startedAt: "2026-07-03T08:00:00.000Z",
    createdAt: "2026-07-03T10:00:00.000Z",
    updatedAt: "2026-07-03T10:00:00.000Z",
    ...overrides,
  };
}

describe("activities utils", () => {
  it("only keeps past recorded activities and sorts them", () => {
    const result = getCompletedActivities([
      activity({ id: "older", startedAt: "2026-06-01T08:00:00.000Z" }),
      activity({ id: "planned", status: "PLANNED" }),
      activity({ id: "missed", status: "MISSED" }),
      activity({ id: "canceled", status: "CANCELED" }),
      activity({ id: "future", startedAt: "2099-07-01T08:00:00.000Z" }),
      activity({
        id: "planning-placeholder",
        stravaActivityId: null,
        routePolyline: null,
        distance: 0,
        duration: 0,
        elevationGain: 0,
      }),
      activity({ id: "duplicate", completedActivityId: "older" }),
      activity({ id: "newer", startedAt: "2026-07-01T08:00:00.000Z" }),
    ]);

    expect(result.map((item) => item.id)).toEqual(["newer", "older"]);
  });

  it("filters the existing sport families", () => {
    const activities = [
      activity({ id: "trail", sport: "TRAIL" }),
      activity({ id: "road", sport: "ROAD_CYCLING" }),
      activity({ id: "gravel", sport: "GRAVEL" }),
    ];

    expect(filterActivities(activities, "Cyclisme")).toHaveLength(2);
    expect(filterActivities(activities, "Trail")).toHaveLength(1);
  });

  it("only exposes measured optional metrics", () => {
    const viewModel = createActivityViewModel(
      activity({
        distance: null,
        elevationGain: null,
        calories: null,
        duration: 45,
      }),
    );

    expect(viewModel.metrics).toEqual([{ key: "duration", label: "45 min" }]);
  });

  it("groups visible activities chronologically by month", () => {
    const groups = groupActivitiesByMonth([
      createActivityViewModel(activity()),
      createActivityViewModel(
        activity({ id: "june", startedAt: "2026-06-12T08:00:00.000Z" }),
      ),
    ]);

    expect(groups.map((group) => group.key)).toEqual(["2026-07", "2026-06"]);
  });

  it("creates the yearly journal summary from real values", () => {
    const summary = createYearlySummary(
      [
        activity(),
        activity({
          id: "run",
          sport: "RUNNING",
          distance: 8,
          duration: 45,
          elevationGain: 120,
          calories: 500,
        }),
      ],
      2026,
    );

    expect(summary.activityCount).toBe(2);
    expect(summary.distanceLabel).toBe("20,4 km");
    expect(summary.elevationLabel).toBe("800 m");
    expect(summary.favoriteSportLabel).toBe("Trail");
  });

  it("projects a GPS polyline into a stable paper sketch", () => {
    const sketch = createRouteSketch("_p~iF~ps|U_ulLnnqC_mqNvxq`@");

    expect(sketch).toHaveLength(3);
    expect(sketch.every((point) => point.x >= 9 && point.x <= 91)).toBe(true);
    expect(sketch.every((point) => point.y >= 9 && point.y <= 91)).toBe(true);
    expect(createRouteSketch("abc")).toEqual([]);
  });
});
