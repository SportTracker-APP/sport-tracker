import { describe, expect, it } from "vitest";

import type { Activity } from "@/lib/activities";
import type { Goal } from "@/lib/goals";
import type { SummitBadge } from "@/lib/summit-api";
import type { SummitView } from "@/lib/summit-discovery";

import { createRefugeViewModel } from "./refuge-mappers";

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    title: "Trail du Veyrier",
    description: null,
    type: "RUN",
    sport: "TRAIL",
    status: "COMPLETED",
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: null,
    celebrationSeenAt: null,
    distance: 12.4,
    duration: 4_200,
    movingTime: 4_000,
    elevationGain: 680,
    elevationLoss: 675,
    maxAltitude: 1_291,
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
    routePolyline: null,
    coverImageUrl: "/landing/alpine-forest-card.png",
    startedAt: "2026-07-03T08:00:00.000Z",
    createdAt: "2026-07-03T08:00:00.000Z",
    updatedAt: "2026-07-03T08:00:00.000Z",
    ...overrides,
  };
}

const goal: Goal = {
  id: "goal-1",
  title: "Cap sur les 30 km",
  type: "DISTANCE_KM",
  sport: null,
  target: 30,
  period: "CUSTOM",
  startDate: "2026-07-01T00:00:00.000Z",
  endDate: "2099-07-31T23:59:59.999Z",
  isActive: true,
  isPrimary: true,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const summit: SummitView = {
  id: "summit-1",
  name: "Mont Veyrier",
  altitude: 1_291,
  massif: "Annecy",
  difficulty: "Modérée",
  type: "Sommet",
  coordinates: [45.899, 6.129],
  imageUrl: "/landing/alpine-forest-card.png",
  discovered: true,
  closestDistance: 12,
  activityCount: 1,
  firstActivity: null,
  latestActivity: null,
  firstDiscoveredAt: "2026-07-03T08:00:00.000Z",
  latestDiscoveredAt: "2026-07-03T08:00:00.000Z",
  pendingDiscoveries: [],
};

const badge: SummitBadge = {
  id: "badge-1",
  name: "10 Sommets",
  description: "Une collection prend forme.",
  hint: "Atteins dix sommets.",
  icon: "trophy",
  tone: "summit",
  category: "Sommets",
  criterion: "Atteindre 10 sommets distincts",
  progress: { current: 1, target: 10, unit: "sommets" },
  unlocked: false,
  unlockedAt: null,
};

describe("createRefugeViewModel", () => {
  it("produit un état vide fiable pour un nouveau carnet", () => {
    const result = createRefugeViewModel({
      activities: [],
      summits: [],
      badges: [],
      goals: [],
    });

    expect(result.activityCount).toBe(0);
    expect(result.summitCount).toBe(0);
    expect(result.latestSummit).toBeNull();
    expect(result.recentActivities).toEqual([]);
  });

  it("mappe les vraies sorties, découvertes et progressions", () => {
    const result = createRefugeViewModel({
      activities: [createActivity()],
      summits: [summit],
      badges: [badge],
      goals: [goal],
    });

    expect(result.activityCount).toBe(1);
    expect(result.summitCount).toBe(1);
    expect(result.carnetProgress).toBe(100);
    expect(result.latestSummit?.name).toBe("Mont Veyrier");
    expect(result.recentActivities[0]?.distance).toBe("12,4 km");
    expect(result.nextBadge?.remainingLabel).toContain("9 sommets");
    expect(result.challenge.currentLabel).toBe("12,4 km");
  });

  it("ignore les séances planifiées dans les statistiques", () => {
    const result = createRefugeViewModel({
      activities: [createActivity({ status: "PLANNED" })],
      summits: [],
      badges: [],
      goals: [goal],
    });

    expect(result.activityCount).toBe(0);
    expect(result.recentActivities).toHaveLength(0);
    expect(result.challenge.progress).toBe(0);
  });
});
