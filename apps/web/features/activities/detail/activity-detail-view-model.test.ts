import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";

import {
  buildActivityFieldRows,
  buildActivityMetrics,
} from "./activity-detail-view-model";

const activity: Activity = {
  id: "activity",
  title: "Sortie",
  description: null,
  stravaActivityId: "strava-activity",
  type: "ACTIVITY",
  sport: "TRAIL",
  status: "COMPLETED",
  plannedWorkoutId: null,
  completedActivityId: null,
  completedAt: null,
  celebrationSeenAt: null,
  distance: 12.4,
  duration: 118,
  movingTime: 6420,
  elevationGain: 680,
  elevationLoss: 676,
  maxAltitude: 1291,
  minAltitude: 452,
  calories: 1120,
  averageSpeed: 1.93,
  maxSpeed: 4.8,
  pace: null,
  averageHeartRate: 148,
  maxHeartRate: 174,
  temperature: 17,
  weather: "Éclaircies",
  city: "Annecy",
  country: "France",
  startLatitude: 45.899,
  startLongitude: 6.129,
  endLatitude: 45.899,
  endLongitude: 6.129,
  routePolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  coverImageUrl: null,
  photoUrls: [],
  photoCount: 0,
  altitudeStream: null,
  distanceStream: null,
  startedAt: "2026-07-20T08:12:00.000Z",
  createdAt: "2026-07-20T11:30:00.000Z",
  updatedAt: "2026-07-20T11:30:00.000Z",
};

describe("activity detail view model", () => {
  it("sélectionne les métriques principales sans valeur artificielle", () => {
    expect(buildActivityMetrics(activity).map(({ label }) => label)).toEqual([
      "Distance",
      "Temps",
      "Dénivelé positif",
      "Allure moyenne",
    ]);
  });

  it("affiche une vitesse pour le VTT plutôt qu’une allure de course", () => {
    const metrics = buildActivityMetrics({
      ...activity,
      sport: "MTB",
      averageSpeed: 5.1,
    });

    expect(metrics.map(({ label }) => label)).toContain("Vitesse moyenne");
    expect(metrics.map(({ label }) => label)).not.toContain("Allure moyenne");
    expect(metrics.find(({ label }) => label === "Vitesse moyenne")?.value).toBe(
      "18,4 km/h",
    );
  });

  it("conserve les données secondaires réellement disponibles", () => {
    const rows = buildActivityFieldRows(activity);

    expect(rows).toContainEqual({ label: "Source", value: "Strava" });
    expect(rows).toContainEqual({ label: "Énergie", value: "1 120 kcal" });
    expect(rows).toContainEqual({
      label: "Fréquence maximale",
      value: "174 bpm",
    });
    expect(rows).toContainEqual({
      label: "Conditions",
      value: "Éclaircies",
    });
  });

  it("n’affiche pas les données absentes", () => {
    const rows = buildActivityFieldRows({
      ...activity,
      stravaActivityId: null,
      calories: null,
      maxHeartRate: null,
      weather: null,
    });

    expect(rows.map(({ label }) => label)).not.toContain("Source");
    expect(rows.map(({ label }) => label)).not.toContain("Énergie");
    expect(rows.map(({ label }) => label)).not.toContain("Fréquence maximale");
    expect(rows.map(({ label }) => label)).not.toContain("Conditions");
  });
});
