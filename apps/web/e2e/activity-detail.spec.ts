import { devices, expect, test, type Page } from "@playwright/test";

const iphone13 = devices["iPhone 13"];

test.describe.configure({ mode: "serial" });

const detailedActivity = {
  id: "activity-detail",
  title: "Traversée du Mont Veyrier",
  description:
    "Une montée calme dans les sous-bois, puis la crête s’est ouverte sur le lac. Le vent était encore frais au sommet.",
  stravaActivityId: "strava-activity-detail",
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
  coverImageUrl:
    "http://127.0.0.1:3100/landing/summit-discovery-wildflowers.jpg",
  photoUrls: [
    "http://127.0.0.1:3100/landing/summit-discovery-wildflowers.jpg",
    "http://127.0.0.1:3100/summits/mont-veyrier.webp",
  ],
  photoCount: 2,
  altitudeStream: [452, 510, 605, 720, 830, 965, 1080, 1195, 1291],
  distanceStream: [0, 1_100, 2_400, 3_800, 5_100, 6_700, 8_200, 10_100, 12_400],
  startedAt: "2026-07-20T08:12:00.000Z",
  createdAt: "2026-07-20T11:30:00.000Z",
  updatedAt: "2026-07-20T11:30:00.000Z",
};

const sparseActivity = {
  ...detailedActivity,
  id: "activity-sparse",
  title: "Marche du soir",
  description: null,
  stravaActivityId: null,
  sport: "HIKE",
  distance: 4.2,
  duration: 52,
  movingTime: null,
  elevationGain: null,
  elevationLoss: null,
  maxAltitude: null,
  minAltitude: null,
  calories: null,
  averageSpeed: null,
  maxSpeed: null,
  averageHeartRate: null,
  maxHeartRate: null,
  temperature: null,
  weather: null,
  city: null,
  country: null,
  routePolyline: null,
  coverImageUrl: null,
  photoUrls: [],
  photoCount: 0,
  altitudeStream: null,
  distanceStream: null,
};

const aggregateElevationActivity = {
  ...detailedActivity,
  id: "activity-aggregate-elevation",
  title: "Trail des gorges du Fier",
  distance: 7.1,
  elevationGain: 272,
  elevationLoss: null,
  maxAltitude: 493,
  minAltitude: null,
  altitudeStream: null,
  distanceStream: null,
};

const talamarcheActivity = {
  ...detailedActivity,
  id: "activity-talamarche",
  title: "EP35 - Trail pointe de Talamarche",
  distance: 10.9,
  elevationGain: 1_085,
  elevationLoss: null,
  maxAltitude: 1_847,
  minAltitude: 1_075,
  startLatitude: 45.83,
  startLongitude: 6.24,
  endLatitude: 45.8304,
  endLongitude: 6.2403,
  routePolyline: null,
  altitudeStream: null,
  distanceStream: null,
};

const stravaSportCases = [
  { slug: "running", sport: "RUNNING", label: "Course" },
  { slug: "hiking", sport: "HIKING", label: "Randonnée" },
  { slug: "trail", sport: "TRAIL", label: "Trail" },
  { slug: "mtb", sport: "MTB", label: "VTT" },
  {
    slug: "road-cycling",
    sport: "ROAD_CYCLING",
    label: "Vélo de route",
  },
] as const;

async function mockActivityDetail(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
  });

  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-activity-detail",
        firstName: "Camille",
        email: "camille@example.test",
        role: "USER",
      }),
    });
  });

  await page.route("**/activities/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname.endsWith("/planned-workout-suggestion")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
      return;
    }

    const sportCase = stravaSportCases.find(({ slug }) =>
      pathname.endsWith(`/activity-sport-${slug}`),
    );
    const activity = pathname.endsWith("/activity-sparse")
      ? sparseActivity
      : pathname.endsWith("/activity-talamarche")
        ? talamarcheActivity
      : pathname.endsWith("/activity-aggregate-elevation")
        ? aggregateElevationActivity
        : sportCase
          ? {
              ...detailedActivity,
              id: `activity-sport-${sportCase.slug}`,
              sport: sportCase.sport,
            }
          : detailedActivity;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(activity),
    });
  });
}

test("la fiche d’expédition conserve toutes les données utiles sur desktop", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockActivityDetail(page);
  await page.goto("/activites/activity-detail", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "Traversée du Mont Veyrier" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Lecture rapide").getByText("12,4 km"),
  ).toBeVisible();
  await expect(page.getByText("680 m").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Le profil de cette aventure." }),
  ).toBeVisible();
  await expect(page.getByText("Trace parcourue")).toBeVisible();
  await expect(page.getByText("Importée de Strava")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Photos (2)" })).toBeVisible();

  await page.waitForTimeout(700);
  await page.screenshot({
    path: testInfo.outputPath("activity-detail-desktop.png"),
    fullPage: true,
  });

  await page.locator("main > div").first().evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: testInfo.outputPath("activity-detail-desktop-lower.png"),
  });
});

test("la fiche reste honnête et lisible sans photo, tracé ou altitude", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockActivityDetail(page);
  await page.goto("/activites/activity-sparse", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "Marche du soir" }),
  ).toBeVisible();
  await expect(page.getByText("Aucun tracé GPS disponible")).toBeVisible();
  await expect(page.getByText("Profil d’altitude indisponible")).toBeVisible();
  await expect(page.getByText("Aucun souvenir écrit pour cette sortie.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Carte" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Photos/ })).toHaveCount(0);

  await page.screenshot({
    path: testInfo.outputPath("activity-detail-sparse.png"),
    fullPage: true,
  });
});

test("un D+ agrégé restaure le profil reconstitué de l’ancienne fiche", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockActivityDetail(page);
  await page.goto("/activites/activity-aggregate-elevation", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "Trail des gorges du Fier" }),
  ).toBeVisible();

  const scroller = page.locator("main > div").first();
  await scroller.evaluate((element) => {
    element.scrollTo({ top: 720, behavior: "instant" });
  });

  await expect(
    page.getByText("Profil reconstitué", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".recharts-responsive-container")).toBeVisible();
  await expect(page.getByText("Profil d’altitude indisponible")).toHaveCount(0);
  await expect(page.getByText("+272 m")).toBeVisible();
  await expect(page.getByText("493 m").first()).toBeVisible();
  await expect(page.getByText("Données d’altitude Strava")).toHaveCount(0);
  await expect(page.getByLabel("Synthèse du dénivelé")).toContainText(/—D-/);
});

test("EP35 affiche un D- cohérent avec sa boucle reconstituée", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockActivityDetail(page);
  await page.goto("/activites/activity-talamarche", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", {
      name: "EP35 - Trail pointe de Talamarche",
    }),
  ).toBeVisible();

  const scroller = page.locator("main > div").first();
  await scroller.evaluate((element) => {
    element.scrollTo({ top: 720, behavior: "instant" });
  });

  await expect(
    page.getByText("Profil reconstitué", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".recharts-responsive-container")).toBeVisible();

  const elevationSummary = page.getByLabel("Synthèse du dénivelé");
  await expect(elevationSummary).toContainText(/\+1.?085 m/);
  await expect(elevationSummary).toContainText(/-1.?085 m/);
  await expect(elevationSummary).not.toContainText(/-2.?283 m/);
});

for (const sportCase of stravaSportCases) {
  test(`le profil réel reste affiché pour une activité ${sportCase.label}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockActivityDetail(page);
    await page.goto(`/activites/activity-sport-${sportCase.slug}`, {
      waitUntil: "domcontentloaded",
    });

    const scroller = page.locator("main > div").first();
    await scroller.evaluate((element) => {
      element.scrollTo({ top: 720, behavior: "instant" });
    });

    await expect(page.getByText("Données d’altitude Strava")).toBeVisible();
    await expect(page.locator(".recharts-responsive-container")).toBeVisible();
    await expect(page.getByText("Profil d’altitude indisponible")).toHaveCount(
      0,
    );

    if (sportCase.sport === "MTB") {
      await expect(page.getByText("Vitesse moyenne").first()).toBeVisible();
      await expect(page.getByText("Allure moyenne")).toHaveCount(0);
    }
  });
}

test("la fiche d’activité se recompose proprement sur iPhone 13", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(iphone13.viewport);
  await mockActivityDetail(page);
  await page.goto("/activites/activity-detail", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "Traversée du Mont Veyrier" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Lecture rapide").getByText("12,4 km"),
  ).toBeVisible();

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(iphone13.viewport.width);

  await page.waitForTimeout(700);
  await page.screenshot({
    path: testInfo.outputPath("activity-detail-iphone-13.png"),
    fullPage: true,
  });

  await page.locator("main > div").first().evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: testInfo.outputPath("activity-detail-iphone-13-lower.png"),
  });
});

test("Carte, Photos, partage et menu restent utilisables", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockActivityDetail(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.goto("/activites/activity-detail", {
    waitUntil: "domcontentloaded",
  });

  await page.getByRole("tab", { name: "Photos (2)" }).click();
  await expect(page.getByRole("tab", { name: "Photos (2)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "Afficher la photo 2" }).click();
  await page.getByRole("tab", { name: "Carte" }).click();
  await expect(page.getByRole("tab", { name: "Carte" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("button", { name: "Partager" }).click();
  await expect(page.getByRole("button", { name: "Lien copié" })).toBeVisible();

  await page
    .getByRole("button", { name: "Ouvrir les actions de la sortie" })
    .click();
  await expect(page.getByRole("link", { name: "Voir mes statistiques" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Toutes mes sorties" }).first()).toBeVisible();
});

for (const viewport of [
  { name: "desktop-large", width: 1728, height: 1117 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile-large", width: 430, height: 932 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`la composition reste stable en ${viewport.name}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await mockActivityDetail(page);
    await page.goto("/activites/activity-detail", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: "Traversée du Mont Veyrier" }),
    ).toBeVisible();
    const pageWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(pageWidth).toBeLessThanOrEqual(viewport.width);

    await page.screenshot({
      path: testInfo.outputPath(`activity-detail-${viewport.name}.png`),
    });
  });
}
