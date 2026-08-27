import { devices, expect, test, type Page, type Route } from "@playwright/test";

const iphone13 = devices["iPhone 13"];

const mockUser = {
  id: "mobile-p0-user",
  firstName: "Camille",
  email: "camille@example.test",
  role: "USER",
  avatarUrl: null,
  needsDiscoveryOnboarding: false,
};

const activity = {
  id: "mobile-p0-activity",
  title: "Traversée du Mont Veyrier",
  description: "Une sortie longue pour éprouver le carnet mobile.",
  stravaActivityId: "strava-mobile-p0",
  type: "ACTIVITY",
  sport: "HIKING",
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
  coverImageUrl: "/summits/mont-veyrier.webp",
  photoUrls: [],
  photoCount: 0,
  altitudeStream: [452, 605, 830, 1080, 1291],
  distanceStream: [0, 2400, 5100, 8200, 12400],
  startedAt: "2026-07-20T08:12:00.000Z",
  createdAt: "2026-07-20T11:30:00.000Z",
  updatedAt: "2026-07-20T11:30:00.000Z",
};

const summit = {
  id: "mont-veyrier",
  name: "Mont Veyrier",
  aliases: [],
  altitude: 1291,
  massif: "Annecy",
  difficulty: "Modérée",
  type: "Sommet",
  coordinates: [6.194, 45.9],
  discovered: true,
  closestDistance: 8,
  activityCount: 1,
  firstActivity: activity,
  latestActivity: activity,
  firstDiscoveredAt: activity.startedAt,
  latestDiscoveredAt: activity.startedAt,
  pendingDiscoveries: [],
  imageUrl: "/summits/mont-veyrier.webp",
  imageCredit: "Photo de test",
  sourceUrl: "https://commons.wikimedia.org/",
};

type ActivityResponse = "loaded" | "empty" | "error" | "loading";

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockAuthenticatedApp(
  page: Page,
  activityResponse: ActivityResponse = "loaded",
) {
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-mobile-p0-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, (route) =>
    route.abort(),
  );
  await page.route("**/users/me", (route) => fulfillJson(route, mockUser));
  await page.route("**/users/me/geo-preferences", (route) =>
    fulfillJson(route, { discovery: [], onboardingCompleted: true }),
  );
  await page.route("**/geo-areas/discovery-options", (route) =>
    fulfillJson(route, []),
  );
  await page.route("**/auth/refresh", (route) =>
    fulfillJson(route, {
      accessToken: "e2e-mobile-p0-token",
      user: mockUser,
    }),
  );
  await page.route("**/strava/status", (route) =>
    fulfillJson(route, { connected: false }),
  );
  await page.route("**/goals**", (route) => fulfillJson(route, []));
  await page.route("**/summits**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    await fulfillJson(route, pathname.endsWith("/badges") ? [] : [summit]);
  });
  await page.route("**/activities**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname.endsWith("/planned-workout-suggestion")) {
      await fulfillJson(route, null);
      return;
    }

    if (pathname === `/activities/${activity.id}`) {
      await fulfillJson(route, activity);
      return;
    }

    if (activityResponse === "loading") {
      await new Promise((resolve) => setTimeout(resolve, 900));
    }

    if (activityResponse === "error") {
      await fulfillJson(route, { message: "Erreur de recette mobile" }, 500);
      return;
    }

    await fulfillJson(route, activityResponse === "empty" ? [] : [activity]);
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        body: document.body.scrollWidth - window.innerWidth,
        document: document.documentElement.scrollWidth - window.innerWidth,
      })),
    )
    .toEqual({ body: 0, document: 0 });
}

async function expectComfortableBottomNavigation(page: Page) {
  const navigation = page.getByRole("navigation", {
    name: "Navigation mobile principale",
  });
  await expect(navigation).toBeVisible();

  const links = navigation.getByRole("link");
  await expect(links).toHaveCount(4);
  const sizes = await links.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );

  for (const size of sizes) {
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  }
}

async function expectMobileFormControls(page: Page) {
  const controls = page.locator('input:not([type="hidden"]), select, textarea');
  const fontSizes = await controls.evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  );

  for (const fontSize of fontSizes) {
    expect(fontSize).toBeGreaterThanOrEqual(16);
  }
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(iphone13.viewport);
});

test.describe("recette iPhone des parcours publics", () => {
  for (const route of ["/login", "/register", "/forgot-password"]) {
    test(`${route} reste utilisable avec le clavier mobile`, async ({
      page,
    }) => {
      await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, (request) =>
        request.abort(),
      );
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectMobileFormControls(page);
    });
  }
});

test("la navigation au doigt relie les quatre pages phares", async ({
  page,
}) => {
  await mockAuthenticatedApp(page, "empty");
  await page.goto("/refuge", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { level: 1, name: "Refuge" }),
  ).toBeVisible();
  await expectComfortableBottomNavigation(page);

  for (const destination of [
    { label: "Sommets", path: "/sommets" },
    { label: "Exploration", path: "/carte" },
    { label: "Sorties", path: "/activites" },
    { label: "Refuge", path: "/refuge" },
  ]) {
    await page
      .getByRole("navigation", { name: "Navigation mobile principale" })
      .getByRole("link", { name: destination.label })
      .click();
    await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
    await expect(
      page
        .getByRole("navigation", { name: "Navigation mobile principale" })
        .getByRole("link", { name: destination.label }),
    ).toHaveAttribute("aria-current", "page");
    await expectNoHorizontalOverflow(page);
  }
});

const authenticatedRoutes = [
  { path: "/refuge", heading: "Refuge" },
  { path: "/carte", heading: "Ton territoire prend forme." },
  { path: "/sommets", heading: "Ton carnet des sommets" },
  { path: "/activites", heading: "Tes sorties racontent ton chemin." },
  {
    path: "/activites/nouvelle?status=COMPLETED",
    heading: "Ajoute une sortie déjà réalisée.",
  },
  {
    path: "/calendrier",
    heading: "Ta semaine, du premier pas au prochain sommet.",
  },
  { path: "/statistiques", heading: "Ton bilan prend du relief." },
  { path: "/parametres", heading: "Paramètres" },
] as const;

for (const route of authenticatedRoutes) {
  test(`${route.path} reste contenue et défilable sur iPhone`, async ({
    page,
  }) => {
    await mockAuthenticatedApp(page);
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectComfortableBottomNavigation(page);

    const scrollArea = page.locator("main > div").first();
    await scrollArea.evaluate((element) => {
      element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
    });
    await expectNoHorizontalOverflow(page);

    if (
      route.path.includes("nouvelle") ||
      route.path === "/parametres" ||
      route.path === "/sommets" ||
      route.path === "/statistiques"
    ) {
      await expectMobileFormControls(page);
    }
  });
}

test("le sommet découvert ouvre une fiche de sortie mobile", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await page.goto("/sommets", { waitUntil: "domcontentloaded" });

  await page.getByLabel(`Actions pour ${summit.name}`).click();
  await page
    .getByRole("button", { name: `Retirer ${summit.name} de mes découvertes` })
    .click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toBeVisible();
  const confirmationBox = await confirmation.boundingBox();
  expect(confirmationBox).not.toBeNull();
  expect(confirmationBox!.x).toBeGreaterThanOrEqual(0);
  expect(confirmationBox!.y).toBeGreaterThanOrEqual(0);
  expect(confirmationBox!.x + confirmationBox!.width).toBeLessThanOrEqual(
    iphone13.viewport.width,
  );
  expect(confirmationBox!.y + confirmationBox!.height).toBeLessThanOrEqual(
    iphone13.viewport.height,
  );
  await confirmation
    .getByRole("button", { name: "Fermer la confirmation" })
    .click();

  await page.getByRole("link", { name: "Voir la trace" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/activites/${activity.id}$`));
  await expect(
    page.getByRole("heading", { level: 1, name: activity.title }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectComfortableBottomNavigation(page);
});

test("les raccourcis statistiques ouvrent la bonne route française", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await page.goto("/statistiques", { waitUntil: "domcontentloaded" });
  const traceLink = page.locator(`a[href="/activites/${activity.id}"]`).first();
  await expect(traceLink).toBeAttached();
});

test("la liste des sorties expose son chargement sur iPhone", async ({
  page,
}) => {
  await mockAuthenticatedApp(page, "loading");
  await page.goto("/activites", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Chargement des sorties")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(
    page.getByRole("heading", { name: activity.title }),
  ).toBeVisible();
});

test("l’exploration expose son erreur sur iPhone", async ({ page }) => {
  await mockAuthenticatedApp(page, "error");
  await page.goto("/carte", { waitUntil: "domcontentloaded" });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "L’atlas n’a pas reçu tes traces." }),
  ).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
});

test("la liste des sorties expose son état vide sur iPhone", async ({
  page,
}) => {
  await mockAuthenticatedApp(page, "empty");
  await page.goto("/activites", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Ta première page reste à écrire." }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("le menu mobile plein écran reste contenu et défilable", async ({
  page,
}) => {
  await mockAuthenticatedApp(page, "empty");
  await page.goto("/refuge", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Ouvrir le menu", exact: true })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x).toBeLessThanOrEqual(1);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeLessThanOrEqual(1);
  expect(box!.height).toBeGreaterThanOrEqual(iphone13.viewport.height - 1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(iphone13.viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(iphone13.viewport.height);
  await expect(
    page.getByRole("button", { name: "Fermer le menu" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
