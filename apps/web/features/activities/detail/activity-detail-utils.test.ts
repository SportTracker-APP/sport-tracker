import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";

import {
  getActivityPhotos,
  getElevationData,
  getLocationLabel,
  getPace,
} from "./activity-detail-utils";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    title: "Boucle du Mont Veyrier",
    description: null,
    type: "REAL",
    sport: "TRAIL",
    status: "COMPLETED",
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: null,
    celebrationSeenAt: null,
    distance: 12,
    duration: 90,
    movingTime: 5_100,
    elevationGain: 640,
    elevationLoss: 630,
    maxAltitude: 1_291,
    minAltitude: 448,
    calories: 920,
    averageSpeed: 2.35,
    maxSpeed: 4.7,
    pace: null,
    averageHeartRate: 148,
    maxHeartRate: 176,
    temperature: 17,
    weather: null,
    city: "Annecy",
    country: "France",
    startLatitude: 45.9,
    startLongitude: 6.13,
    endLatitude: 45.9,
    endLongitude: 6.13,
    routePolyline: null,
    coverImageUrl: null,
    photoUrls: null,
    photoCount: 0,
    altitudeStream: null,
    distanceStream: null,
    startedAt: "2026-07-20T07:30:00.000Z",
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("activity detail utils", () => {
  it("reconstructs the legacy elevation profile from route and aggregate metrics", () => {
    const result = getElevationData(
      makeActivity({
        routePolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
      }),
    );

    expect(result?.source).toBe("reconstructed");
    expect(result?.points.length).toBeGreaterThanOrEqual(2);
    expect(result).toMatchObject({
      minimum: 448,
      maximum: 1_291,
      ascent: 640,
      descent: 630,
    });
  });

  it("reconstructs a compact profile when only aggregate altitude markers exist", () => {
    const result = getElevationData(
      makeActivity({
        routePolyline: null,
        minAltitude: null,
        maxAltitude: 493,
        elevationGain: 272,
        elevationLoss: null,
        startLatitude: null,
        startLongitude: null,
        endLatitude: null,
        endLongitude: null,
      }),
    );

    expect(result?.source).toBe("reconstructed");
    expect(result?.points).toHaveLength(5);
    expect(result?.maximum).toBe(493);
    expect(result?.ascent).toBe(272);
    expect(result?.descent).toBeNull();
  });

  it("does not invent D- from a reconstructed linear profile", () => {
    const result = getElevationData(
      makeActivity({
        routePolyline: null,
        elevationGain: 540,
        elevationLoss: null,
        minAltitude: 420,
        maxAltitude: 980,
        startLatitude: 45.8,
        startLongitude: 6.1,
        endLatitude: 45.86,
        endLongitude: 6.22,
      }),
    );

    expect(result).toMatchObject({
      source: "reconstructed",
      ascent: 540,
      descent: null,
    });
  });

  it("keeps D- aligned with D+ for the reconstructed EP35 loop", () => {
    const result = getElevationData(
      makeActivity({
        title: "EP35 - Trail pointe de Talamarche",
        routePolyline: null,
        distance: 10.9,
        elevationGain: 1_085,
        elevationLoss: null,
        minAltitude: 1_075,
        maxAltitude: 1_847,
        startLatitude: 45.83,
        startLongitude: 6.24,
        endLatitude: 45.8304,
        endLongitude: 6.2403,
      }),
    );

    expect(result).toMatchObject({
      source: "reconstructed",
      ascent: 1_085,
      descent: 1_085,
    });
  });

  it("keeps the unavailable state when no elevation marker exists", () => {
    expect(
      getElevationData(
        makeActivity({
          routePolyline: null,
          minAltitude: null,
          maxAltitude: null,
          elevationGain: null,
          elevationLoss: null,
        }),
      ),
    ).toBeNull();
  });

  it("uses the real elevation and distance streams", () => {
    const result = getElevationData(
      makeActivity({
        altitudeStream: [450, 500, 620, 580],
        distanceStream: [0, 4_000, 8_000, 12_000],
      }),
    );

    expect(result).toMatchObject({
      minimum: 450,
      maximum: 620,
      ascent: 170,
      descent: 40,
      source: "strava",
    });
    expect(result?.points.at(-1)).toEqual({
      distance: 12,
      elevation: 580,
    });
  });

  it.each(["RUNNING", "HIKING", "TRAIL", "MTB", "ROAD_CYCLING"])(
    "renders the real elevation profile for %s activities",
    (sport) => {
      const result = getElevationData(
        makeActivity({
          sport,
          altitudeStream: [335, 382, 433],
          distanceStream: [0, 9_000, 18_100],
        }),
      );

      expect(result?.points).toHaveLength(3);
      expect(result?.minimum).toBe(335);
      expect(result?.maximum).toBe(433);
      expect(result?.source).toBe("strava");
    },
  );

  it("falls back to a reconstructed profile when a stream is invalid", () => {
    const result = getElevationData(
      makeActivity({
        altitudeStream: [450, Number.NaN, 620],
        distanceStream: [0, 6_000, 12_000],
      }),
    );

    expect(result?.source).toBe("reconstructed");
  });

  it("keeps only valid, unique activity photos", () => {
    const photos = getActivityPhotos(
      makeActivity({
        coverImageUrl: "https://images.example.test/cover.jpg",
        photoUrls: [
          "https://images.example.test/cover.jpg",
          "javascript:alert(1)",
          "https://images.example.test/second.jpg",
        ],
      }),
    );

    expect(photos.map((photo) => photo.src)).toEqual([
      "https://images.example.test/cover.jpg",
      "https://images.example.test/second.jpg",
    ]);
  });

  it("derives location and pace from the activity contract", () => {
    const activity = makeActivity();

    expect(getLocationLabel(activity)).toBe("Annecy, France");
    expect(getPace(activity)).toBe("7'05\" /km");
  });
});
