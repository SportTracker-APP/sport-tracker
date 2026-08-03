import { describe, expect, it } from "vitest";

import { getActivityChartSummary } from "./activity-chart-period";

type TestActivity = {
  distance: number;
  duration: number;
  elevationGain: number;
  startedAt: string;
};

function createActivity(
  startedAt: Date,
  distance: number,
  duration = 60,
  elevationGain = 100,
): TestActivity {
  return {
    distance,
    duration,
    elevationGain,
    startedAt: startedAt.toISOString(),
  };
}

describe("getActivityChartSummary", () => {
  const now = new Date(2026, 6, 8, 12);
  const activities = [
    createActivity(new Date(2026, 6, 8, 8), 12),
    createActivity(new Date(2026, 6, 2, 8), 8, 45, 250),
    createActivity(new Date(2026, 5, 30, 8), 20),
    createActivity(new Date(2026, 3, 8, 8), 30),
    createActivity(new Date(2025, 6, 8, 8), 40),
  ];

  it("calcule les sept derniers jours et exclut les sorties plus anciennes", () => {
    const summary = getActivityChartSummary(activities, "7d", now);

    expect(summary.chartData).toHaveLength(7);
    expect(summary.periodActivities).toHaveLength(2);
    expect(summary.totalDistance).toBe(20);
    expect(summary.totalDuration).toBe(105);
    expect(summary.totalElevation).toBe(350);
    expect(summary.bestActivity?.distance).toBe(12);
  });

  it("regroupe trois mois par semaine", () => {
    const summary = getActivityChartSummary(activities, "3m", now);

    expect(summary.chartData).toHaveLength(13);
    expect(summary.configuration.granularityLabel).toBe("semaine par semaine");
    expect(summary.totalDistance).toBe(40);
  });

  it("regroupe les douze derniers mois par mois", () => {
    const summary = getActivityChartSummary(activities, "1y", now);

    expect(summary.chartData).toHaveLength(12);
    expect(summary.configuration.title).toBe(
      "Activité sur les 12 derniers mois",
    );
    expect(summary.totalDistance).toBe(70);
  });
});
