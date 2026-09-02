import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";

import {
  getActiveDayCount,
  getCalendarDays,
  getCalendarMonthDays,
  getCompletedActivities,
  getPeriodComparison,
  getPeriodHighlightActivity,
  getSportDistribution,
  getTrendPercent,
  getWeekdayActivityCounts,
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

  it("ne comptabilise que les sorties réellement terminées et déjà commencées", () => {
    const filtered = getCompletedActivities([
      ...activities,
      createActivity(new Date(Date.now() + 86_400_000).toISOString()),
      createActivity(new Date(2026, 6, 28, 8).toISOString(), {
        status: "PLANNED",
      }),
      createActivity(new Date(2026, 6, 28, 9).toISOString(), {
        status: "MISSED",
      }),
      createActivity(new Date(2026, 6, 28, 10).toISOString(), {
        status: "CANCELED",
      }),
    ]);

    expect(filtered).toEqual(activities);
  });

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

  it("produit un mois complet du lundi au dimanche", () => {
    const calendar = getCalendarMonthDays(activities, now);

    expect(calendar).toHaveLength(35);
    expect(calendar[0]?.date.getDay()).toBe(1);
    expect(calendar.at(-1)?.date.getDay()).toBe(0);
    expect(
      calendar.filter(
        (day) => day.date.getMonth() === now.getMonth() && day.count > 0,
      ),
    ).toHaveLength(3);
  });

  it("calcule une évolution lisible avec ou sans historique", () => {
    expect(getTrendPercent(15, 10)).toBe(50);
    expect(getTrendPercent(5, 0)).toBe(100);
    expect(getTrendPercent(0, 0)).toBe(0);
  });

  it("choisit un souvenir marquant et répartit le rythme dans la semaine", () => {
    const highlight = getPeriodHighlightActivity(activities);
    const weekdays = getWeekdayActivityCounts(activities);

    expect(highlight?.elevationGain).toBe(500);
    expect(weekdays.reduce((total, count) => total + count, 0)).toBe(3);
  });
});
