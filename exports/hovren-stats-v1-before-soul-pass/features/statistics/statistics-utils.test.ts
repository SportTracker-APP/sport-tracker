import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";

import {
  getActiveDayCount,
  getCalendarDays,
  getPeriodComparison,
  getSportDistribution,
  getTrendPercent,
  sumActivities,
} from "./statistics-utils";

function createActivity(
  startedAt: string,
  overrides: Partial<Activity> = {},
): Activity {
  return {
    id: startedAt,
    title: "Sortie test",
    description: null,
    type: "ACTIVITY",
    sport: "TRAIL",
    status: "COMPLETED",
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: null,
    celebrationSeenAt: null,
    distance: 10,
    duration: 60,
    movingTime: 60,
    elevationGain: 500,
    elevationLoss: null,
    maxAltitude: 1_500,
    calories: 600,
    averageSpeed: null,
    maxSpeed: null,
    pace: null,
    averageHeartRate: null,
    maxHeartRate: null,
    temperature: null,
    weather: null,
    city: null,
    country: null,
    startLatitude: null,
    startLongitude: null,
    endLatitude: null,
    endLongitude: null,
    routePolyline: null,
    coverImageUrl: null,
    startedAt,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides,
  };
}

describe("statistics-utils", () => {
  const now = new Date(2026, 6, 29, 12);
  const activities = [
    createActivity(new Date(2026, 6, 29, 8).toISOString()),
    createActivity(new Date(2026, 6, 27, 8).toISOString(), {
      sport: "RUNNING",
      distance: 5,
      elevationGain: 100,
    }),
    createActivity(new Date(2026, 6, 20, 8).toISOString(), {
      distance: 8,
    }),
  ];

  it("additionne uniquement les valeurs disponibles", () => {
    expect(sumActivities(activities)).toEqual({
      count: 3,
      distance: 23,
      duration: 180,
      elevation: 1_100,
      calories: 1_800,
    });
  });

  it("compare une période avec la période immédiatement précédente", () => {
    const comparison = getPeriodComparison(activities, "7d", now);

    expect(comparison.current.count).toBe(2);
    expect(comparison.current.distance).toBe(15);
    expect(comparison.previous.count).toBe(1);
    expect(comparison.previous.distance).toBe(8);
  });

  it("produit une distribution et un calendrier à partir des vraies activités", () => {
    const distribution = getSportDistribution(activities);
    const calendar = getCalendarDays(activities, now, 7);

    expect(distribution[0]).toMatchObject({
      sport: "TRAIL",
      count: 2,
      percent: 67,
    });
    expect(calendar).toHaveLength(7);
    expect(calendar.filter((day) => day.count > 0)).toHaveLength(2);
    expect(getActiveDayCount(activities)).toBe(3);
  });

  it("calcule une évolution lisible avec ou sans historique", () => {
    expect(getTrendPercent(15, 10)).toBe(50);
    expect(getTrendPercent(5, 0)).toBe(100);
    expect(getTrendPercent(0, 0)).toBe(0);
  });
});
