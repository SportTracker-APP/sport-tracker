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
    expect(result.welcomeMessage).toBe(
      "Ton carnet est prêt à accueillir ses premières traces.",
    );
    expect(result.summitCount).toBe(0);
    expect(result.latestSummit).toBeNull();
    expect(result.primaryAction).toMatchObject({
      kind: "sync",
      contextLabel: "Carnet à compléter",
      href: "/integrations/strava",
      label: "Synchroniser mes dernières sorties",
    });
    expect(result.storyEvents).toEqual([]);
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
    expect(result.nextBadge?.progressLabel).toBe("1 / 10 sommets");
    expect(result.nextBadge?.progress).toBe(10);
    expect(result.strongestMassif).toEqual({
      name: "Annecy",
      countLabel: "1 / 1 sommet",
      progress: 100,
    });
    expect(result.nextZone).toBeNull();
    expect(result.storyEvents.map((event) => event.kind)).toEqual([
      "activity",
      "summit",
      "progress",
    ]);
    expect(result.storyEvents[0]).toMatchObject({
      title: "Trail du Veyrier",
      href: "/activites/activity-1",
    });
    expect(result.storyEvents.at(-1)?.title).toBe("100 % du carnet");
    expect(result.challenge.currentLabel).toBe("12,4 km");
  });

  it("n'utilise jamais les médias Strava dans la mise en scène du Refuge", () => {
    const stravaImage =
      "https://example.supabase.co/storage/v1/object/public/strava/photo.jpg";
    const result = createRefugeViewModel({
      activities: [createActivity({ coverImageUrl: stravaImage })],
      summits: [
        {
          ...summit,
          imageUrl: stravaImage,
          latestActivity: {
            id: "activity-1",
            title: "Trail du Veyrier",
            sport: "TRAIL",
            startedAt: "2026-07-03T08:00:00.000Z",
            distance: 12.4,
            elevationGain: 680,
            coverImageUrl: stravaImage,
          },
        },
      ],
      badges: [badge],
      goals: [goal],
    });

    expect(result.latestSummit?.imageUrl).not.toBe(stravaImage);
    expect(result.recentActivities[0]?.imageUrl).not.toBe(stravaImage);
  });

  it("ajoute le dernier badge débloqué au fil du carnet", () => {
    const result = createRefugeViewModel({
      activities: [createActivity()],
      summits: [summit],
      badges: [
        {
          ...badge,
          id: "badge-unlocked",
          name: "Premier Sommet",
          unlocked: true,
          unlockedAt: "2026-07-04T09:00:00.000Z",
        },
      ],
      goals: [goal],
    });

    expect(result.storyEvents.map((event) => event.kind)).toEqual([
      "activity",
      "summit",
      "badge",
      "progress",
    ]);
    expect(result.storyEvents[2]).toMatchObject({
      title: "Premier Sommet",
      date: "4 juil 2026",
      href: "/badges",
    });
    expect(result.latestMilestone).toEqual({
      name: "Premier Sommet",
      date: "4 juil 2026",
    });
  });

  it("identifie le massif de tête et la prochaine zone à compléter", () => {
    const result = createRefugeViewModel({
      activities: [createActivity()],
      summits: [
        { ...summit, id: "bornes-1", massif: "Bornes" },
        { ...summit, id: "bornes-2", massif: "Bornes" },
        {
          ...summit,
          id: "bornes-3",
          massif: "Bornes",
          discovered: false,
          latestDiscoveredAt: null,
        },
        { ...summit, id: "annecy-1", massif: "Annecy" },
        {
          ...summit,
          id: "annecy-2",
          massif: "Annecy",
          discovered: false,
          latestDiscoveredAt: null,
        },
      ],
      badges: [
        {
          ...badge,
          progress: { current: 8, target: 10, unit: "sommets" },
        },
      ],
      goals: [goal],
    });

    expect(result.nextBadge).toMatchObject({
      progressLabel: "8 / 10 sommets",
      progress: 80,
    });
    expect(result.strongestMassif).toEqual({
      name: "Bornes",
      countLabel: "2 / 3 sommets",
      progress: 67,
    });
    expect(result.nextZone).toEqual({
      name: "Bornes",
      countLabel: "2 / 3 sommets",
      progress: 67,
    });
  });

  it("ignore les séances planifiées dans les statistiques", () => {
    const futureDate = new Date(Date.now() + 86_400_000).toISOString();
    const result = createRefugeViewModel({
      activities: [
        createActivity({ status: "PLANNED", startedAt: futureDate }),
      ],
      summits: [],
      badges: [],
      goals: [goal],
    });

    expect(result.activityCount).toBe(0);
    expect(result.recentActivities).toHaveLength(0);
    expect(result.challenge.progress).toBe(0);
    expect(result.primaryAction).toMatchObject({
      kind: "plan",
      contextLabel: "Prochaine sortie",
      href: "/calendrier",
      label: "Préparer ma prochaine sortie",
    });
    expect(result.welcomeMessage).toBe(
      "Ta prochaine aventure est déjà au programme.",
    );
  });

  it("met une découverte récente au premier plan", () => {
    const recentDiscovery = new Date(Date.now() - 86_400_000).toISOString();
    const result = createRefugeViewModel({
      activities: [createActivity()],
      summits: [
        {
          ...summit,
          latestDiscoveredAt: recentDiscovery,
        },
      ],
      badges: [badge],
      goals: [goal],
    });

    expect(result.primaryAction).toEqual({
      kind: "discovery",
      contextLabel: "Nouvelle découverte",
      href: "/sommets",
      label: "Voir ma nouvelle découverte",
      description: "Mont Veyrier vient de rejoindre ton carnet.",
    });
    expect(result.welcomeMessage).toBe(
      "Une nouvelle découverte vient d’enrichir ton histoire.",
    );
  });

  it("propose de poursuivre une zone déjà commencée", () => {
    const result = createRefugeViewModel({
      activities: [createActivity()],
      summits: [
        {
          ...summit,
          id: "bornes-1",
          massif: "Bornes",
          latestDiscoveredAt: "2025-01-01T08:00:00.000Z",
        },
        {
          ...summit,
          id: "bornes-2",
          massif: "Bornes",
          discovered: false,
          latestDiscoveredAt: null,
        },
      ],
      badges: [badge],
      goals: [goal],
    });

    expect(result.primaryAction).toEqual({
      kind: "explore",
      contextLabel: "Massif à poursuivre",
      href: "/sommets",
      label: "Continuer le massif Bornes",
      description: "1 sommet sur 2 déjà révélé.",
    });
    expect(result.welcomeMessage).toBe(
      "Ton carnet prend forme, massif après massif.",
    );
  });
});
