import { expect, test, type Page } from "@playwright/test";

type MockActivityOptions = {
  daysAgo: number;
  distance: number;
  duration: number;
  elevationGain: number;
  maxAltitude: number;
  sport: string;
  title: string;
};

function createMockActivity(
  index: number,
  {
    daysAgo,
    distance,
    duration,
    elevationGain,
    maxAltitude,
    sport,
    title,
  }: MockActivityOptions,
) {
  const startedAt = new Date();
  startedAt.setHours(8 + (index % 6), index * 3, 0, 0);
  startedAt.setDate(startedAt.getDate() - daysAgo);

  return {
    id: `statistics-activity-${index}`,
    title,
    description: null,
    stravaActivityId: `statistics-strava-${index}`,
    type: "ACTIVITY",
    sport,
    status: "COMPLETED",
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: startedAt.toISOString(),
    celebrationSeenAt: null,
    distance,
    duration,
    movingTime: duration * 60,
    elevationGain,
    elevationLoss: Math.max(0, elevationGain - 12),
    maxAltitude,
    minAltitude: Math.max(300, maxAltitude - elevationGain),
    calories: Math.round(distance * 58),
    averageSpeed: distance / (duration / 60),
    maxSpeed: null,
    pace: null,
    averageHeartRate: null,
    maxHeartRate: null,
    temperature: null,
    weather: null,
    city: "Annecy",
    country: "France",
    startLatitude: 45.899,
    startLongitude: 6.129,
    endLatitude: 45.9,
    endLongitude: 6.13,
    routePolyline: null,
    coverImageUrl: null,
    photoUrls: [],
    photoCount: 0,
    altitudeStream: null,
    distanceStream: null,
    startedAt: startedAt.toISOString(),
    createdAt: startedAt.toISOString(),
    updatedAt: startedAt.toISOString(),
  };
}

const mockActivities = [
  createMockActivity(1, {
    daysAgo: 1,
    distance: 14.2,
    duration: 108,
    elevationGain: 780,
    maxAltitude: 1_852,
    sport: "TRAIL",
    title: "Crêtes au-dessus du lac",
  }),
  createMockActivity(2, {
    daysAgo: 3,
    distance: 8.4,
    duration: 56,
    elevationGain: 310,
    maxAltitude: 1_291,
    sport: "RUNNING",
    title: "Boucle du Veyrier",
  }),
  createMockActivity(3, {
    daysAgo: 6,
    distance: 27.8,
    duration: 132,
    elevationGain: 640,
    maxAltitude: 1_480,
    sport: "MTB",
    title: "Traversée des Bornes",
  }),
  createMockActivity(4, {
    daysAgo: 10,
    distance: 11.1,
    duration: 154,
    elevationGain: 920,
    maxAltitude: 2_004,
    sport: "HIKING",
    title: "Montagne de Sous-Dine",
  }),
  createMockActivity(5, {
    daysAgo: 14,
    distance: 6.8,
    duration: 44,
    elevationGain: 180,
    maxAltitude: 980,
    sport: "RUNNING",
    title: "Sentier du soir",
  }),
  createMockActivity(6, {
    daysAgo: 20,
    distance: 19.6,
    duration: 97,
    elevationGain: 505,
    maxAltitude: 1_560,
    sport: "GRAVEL",
    title: "Pistes du plateau",
  }),
  createMockActivity(7, {
    daysAgo: 27,
    distance: 9.3,
    duration: 86,
    elevationGain: 570,
    maxAltitude: 1_768,
    sport: "TRAIL",
    title: "Lanfonnet",
  }),
  createMockActivity(8, {
    daysAgo: 35,
    distance: 12.7,
    duration: 93,
    elevationGain: 460,
    maxAltitude: 1_420,
    sport: "TRAIL",
    title: "Chapitre précédent",
  }),
  createMockActivity(9, {
    daysAgo: 48,
    distance: 31.4,
    duration: 144,
    elevationGain: 830,
    maxAltitude: 1_630,
    sport: "MTB",
    title: "Tour du massif",
  }),
  createMockActivity(10, {
    daysAgo: 72,
    distance: 5.5,
    duration: 47,
    elevationGain: 210,
    maxAltitude: 1_120,
    sport: "RUNNING",
    title: "Sortie matinale",
  }),
  createMockActivity(11, {
    daysAgo: 130,
    distance: 15.8,
    duration: 172,
    elevationGain: 1_085,
    maxAltitude: 2_351,
    sport: "HIKING",
    title: "La Tournette",
  }),
  createMockActivity(12, {
    daysAgo: 230,
    distance: 42.1,
    duration: 238,
    elevationGain: 1_440,
    maxAltitude: 2_750,
    sport: "TRAIL",
    title: "Grande traversée",
  }),
];

async function mockStatistics(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
    window.localStorage.removeItem("hovren.activityChart.period");
  });

  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "statistics-user",
        firstName: "Camille",
        email: "camille@example.test",
        role: "USER",
      }),
    });
  });

  await page.route("**/activities", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockActivities),
    });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));

  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
}

test.describe.configure({ mode: "serial" });

test("le bilan reste fonctionnel et éditorial sur desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockStatistics(page);
  await page.goto("/statistiques", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Ton bilan prend du relief." }),
  ).toBeVisible();
  await expect(page.getByText("Bilan d’exploration").first()).toBeVisible();
  await expect(page.getByText("Mix outdoor")).toBeVisible();
  await expect(page.getByText("Rythme d’exploration")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "/tmp/hovren-statistics-desktop.png",
  });

  const periodSelect = page.getByLabel("Période du graphique d’activité");
  await expect(periodSelect).toHaveValue("30d");
  await periodSelect.selectOption("1y");
  await expect(periodSelect).toHaveValue("1y");
  await expect(page.getByText("12 derniers mois").first()).toBeVisible();

  await page.getByRole("button", { name: "Dénivelé" }).click();
  await expect(
    page.getByRole("button", { name: "Dénivelé" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/^Dénivelé :/)).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

test("le bilan reste lisible sur tablette", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await mockStatistics(page);
  await page.goto("/statistiques", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Ton bilan prend du relief." }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "/tmp/hovren-statistics-tablet.png",
  });
});

test("le bilan reste compact et sans débordement sur mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockStatistics(page);
  await page.goto("/statistiques", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Ton bilan prend du relief." }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Période du graphique d’activité"),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "/tmp/hovren-statistics-mobile.png",
  });
});

for (const viewport of [
  { width: 430, height: 932 },
  { width: 1280, height: 800 },
  { width: 1728, height: 1117 },
]) {
  test(`le bilan ne déborde pas en ${viewport.width} x ${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await mockStatistics(page);
    await page.goto("/statistiques", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "Ton bilan prend du relief." }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
