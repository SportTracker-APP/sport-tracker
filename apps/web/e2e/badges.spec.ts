import { expect, test, type Page, type Route } from "@playwright/test";

const responsiveViewports = [
  { width: 1920, height: 1080 },
  { width: 1512, height: 982 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
];

const mockBadges = [
  {
    id: "distance-100-km",
    name: "100 km",
    description: "Le cap des 100 km cumulés est franchi.",
    hint: "Cumule 100 km sur toutes tes activités.",
    icon: "Route",
    tone: "energy",
    category: "Distance",
    criterion: "Cumuler 100 km sur toutes les activités",
    progress: { current: 100, target: 100, unit: "km" },
    unlocked: true,
    unlockedAt: "2026-07-03T08:00:00.000Z",
  },
  {
    id: "distance-500-km",
    name: "500 km",
    description: "L’explorateur confirmé.",
    hint: "Cumule 500 km sur toutes tes activités.",
    icon: "Route",
    tone: "energy",
    category: "Distance",
    criterion: "Cumuler 500 km sur toutes les activités",
    progress: { current: 147.2, target: 500, unit: "km" },
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: "summits-10",
    name: "10 Sommets",
    description: "Dix sommets différents rejoignent le carnet.",
    hint: "Atteins 10 sommets répertoriés distincts.",
    icon: "Trophy",
    tone: "summit",
    category: "Sommets",
    criterion: "Atteindre 10 sommets répertoriés distincts",
    progress: { current: 8, target: 10, unit: "sommets" },
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: "condition-sunrise",
    name: "Lever de soleil",
    description: "Parti avant l’aube pour attraper les premiers rayons.",
    hint: "Démarre une activité avant le lever du soleil.",
    icon: "Sunrise",
    tone: "sunrise",
    category: "Conditions",
    criterion: "Démarrer une activité avant le lever du soleil",
    progress: null,
    unlocked: true,
    unlockedAt: null,
  },
  {
    id: "single-elevation-1500",
    name: "Chasseur de sommets (1 500 m D+)",
    description: "1 500 m D+ réalisés sur une seule sortie.",
    hint: "Réalise 1 500 m D+ sur une sortie.",
    icon: "Flame",
    tone: "fire",
    category: "Exploits D+",
    criterion: "1 500 m de dénivelé positif sur une sortie",
    progress: { current: 1470, target: 1500, unit: "m D+" },
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: "progress-elevation-10000",
    name: "Maître des sentiers",
    description: "10 000 m D+ cumulés au total.",
    hint: "Cumule 10 000 m D+ au total.",
    icon: "Mountain",
    tone: "energy",
    category: "Progression D+",
    criterion: "10 000 m D+ cumulés au total",
    progress: { current: 0, target: 10000, unit: "m D+" },
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: "monthly-january-vertical",
    name: "Janvier Vertical — une très longue saison à collectionner",
    description: "Commencer l’année en prenant de la hauteur.",
    hint: "Cumule 3 000 m D+ durant un mois de janvier.",
    icon: "TrendingUp",
    tone: "winter",
    category: "Défis mensuels",
    criterion:
      "3 000 m D+ cumulés durant le mois de janvier, quelles que soient les conditions rencontrées",
    progress: { current: 0, target: 1, unit: "sortie" },
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: "monthly-june-alpine",
    name: "Juin Alpin",
    description: "Les montagnes rouvrent leurs portes.",
    hint: "Cumule 8 000 m D+ durant un mois de juin.",
    icon: "Mountain",
    tone: "summit",
    category: "Défis mensuels",
    criterion: "8 000 m D+ cumulés durant juin",
    progress: { current: 8000, target: 8000, unit: "m D+" },
    unlocked: true,
    unlockedAt: "2026-06-29T18:00:00.000Z",
  },
];

async function fulfillUser(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      id: "badges-user",
      firstName: "Camille",
      email: "camille@example.test",
      role: "USER",
    }),
  });
}

async function mockShell(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
  await page.route("**/users/me", fulfillUser);
  await page.route("**/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "e2e-refreshed-token",
        user: {
          id: "badges-user",
          firstName: "Camille",
          email: "camille@example.test",
          role: "USER",
        },
      }),
    });
  });
  await page.route("**/strava/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ connected: false }),
    });
  });
  await page.route("**/activities**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
}

async function mockBadgeCatalogue(page: Page, badges = mockBadges) {
  await mockShell(page);
  await page.route("**/summits**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pathname.endsWith("/summits/badges") ? badges : []),
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

async function expectCollectionSettled(page: Page) {
  const heading = page.getByRole("heading", { level: 1, name: "Badges" });
  await expect(
    heading.locator("xpath=ancestor::header[1]/parent::*"),
  ).toHaveCSS("opacity", "1");
  await expect(
    page.locator("article").first().locator("xpath=parent::*"),
  ).toHaveCSS("opacity", "1");
}

test("la collection conserve ses données, ses filtres et son hover", async ({
  page,
}) => {
  await mockBadgeCatalogue(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/badges", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { level: 1, name: "Badges" }),
  ).toBeVisible();
  await expect(page.getByText("3 / 8", { exact: true })).toBeVisible();
  await expect(
    page.getByText("38% du catalogue", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("article")).toHaveCount(8);
  await expectCollectionSettled(page);
  await expect(page.getByText("Débloqué le 3 juillet 2026")).toBeVisible();
  await expect(
    page.getByText("1 470 / 1 500 m D+", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("0 / 1 sortie", { exact: true })).toBeVisible();

  const unlockedCard = page.locator('article[data-status="unlocked"]').first();
  const startedCard = page.locator('article[data-status="started"]').first();
  const lockedCard = page.locator('article[data-status="locked"]').first();
  await expect(unlockedCard).toHaveCSS(
    "border-color",
    "rgba(47, 93, 70, 0.34)",
  );
  await expect(startedCard.getByRole("progressbar")).toHaveCSS("height", "7px");
  await expect(lockedCard).toHaveCSS("background-color", "rgb(241, 238, 230)");
  await expect(lockedCard.locator('span[aria-hidden="true"]')).toHaveCSS(
    "filter",
    "grayscale(0.65) saturate(0.25)",
  );
  await lockedCard.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/hovren-badges-states-1440.png" });

  const categories = [
    ["Distance", 2],
    ["Sommets", 1],
    ["Conditions", 1],
    ["Exploits D+", 1],
    ["Progression D+", 1],
    ["Défis mensuels", 2],
  ] as const;

  for (const [category, count] of categories) {
    await page.getByRole("button", { name: category, exact: true }).click();
    await expect(page.locator("article")).toHaveCount(count);
    await expect(page.locator("article").first()).toContainText(category);
  }

  await page.getByRole("button", { name: "Tous", exact: true }).first().click();
  await page.getByRole("button", { name: "Débloqués", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(3);
  await page.getByRole("button", { name: "Distance", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 2, name: "100 km" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Progression D+", exact: true })
    .click();
  await expect(
    page.getByText("Aucun badge dans cette sélection."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Afficher toute la collection" })
    .click();
  await expect(page.locator("article")).toHaveCount(8);

  const hoveredCard = page.locator("article").first();
  const neighbourCard = page.locator("article").nth(1);
  await hoveredCard.scrollIntoViewIfNeeded();
  const neighbourBefore = await neighbourCard.boundingBox();
  await hoveredCard.hover();
  const neighbourAfter = await neighbourCard.boundingBox();
  expect(neighbourAfter?.x).toBe(neighbourBefore?.x);
  expect(neighbourAfter?.y).toBe(neighbourBefore?.y);
  await expect(hoveredCard).toHaveCSS("transform", /matrix/);
});

test("la page reste lisible et sans débordement à tous les breakpoints", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockBadgeCatalogue(page);

  for (const viewport of responsiveViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/badges", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Badges" }),
    ).toBeVisible();
    await expect(page.locator("article")).toHaveCount(8);
    await expectCollectionSettled(page);
    await expect(
      page.getByRole("button", { name: "Défis mensuels" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "À accomplir" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if (
      viewport.width === 1440 ||
      viewport.width === 768 ||
      viewport.width === 390
    ) {
      await page.screenshot({
        path: `/tmp/hovren-badges-${viewport.width}.png`,
        fullPage: viewport.width === 390,
      });
    }
  }
});

test("les états de chargement, d’erreur et de catalogue vide restent utiles", async ({
  page,
}) => {
  await mockShell(page);
  let requestCount = 0;
  let serveEmptyCatalogue = false;

  await page.route("**/summits**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (!pathname.endsWith("/summits/badges")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
      return;
    }

    requestCount += 1;
    if (!serveEmptyCatalogue) {
      if (requestCount === 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: "{}",
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/badges", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toContainText(
    "Chargement de la collection de badges",
  );
  await expect(
    page.getByRole("heading", { name: "La collection reste à l’abri." }),
  ).toBeVisible({ timeout: 15_000 });
  serveEmptyCatalogue = true;
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(
    page.getByRole("heading", { name: "La collection est encore vide." }),
  ).toBeVisible();
});
