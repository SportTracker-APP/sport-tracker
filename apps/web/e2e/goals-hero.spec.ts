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

async function fulfillUser(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      id: "goals-user",
      firstName: "Camille",
      email: "camille@example.test",
      role: "USER",
    }),
  });
}

async function mockGoals(page: Page) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
  await page.route("**/users/me", fulfillUser);
  await page.route("**/strava/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ connected: false }),
    });
  });
  await page.route("**/summits**", async (route) => {
    if (
      /\.(?:avif|jpe?g|png|webp)$/.test(new URL(route.request().url()).pathname)
    ) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.route("**/activities", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.route("**/goals", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "primary-goal",
          title: "Cent kilomètres dans les Aravis",
          type: "DISTANCE_KM",
          sport: "TRAIL",
          target: 100,
          period: "MONTHLY",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
          isPrimary: true,
          createdAt: startDate.toISOString(),
          updatedAt: startDate.toISOString(),
        },
      ]),
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

test("le hero Défis reste compact et lisible à tous les breakpoints", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGoals(page);

  for (const viewport of responsiveViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/objectifs", { waitUntil: "domcontentloaded" });

    const heroHeading = page.getByRole("heading", {
      name: "Garde le cap, avance à ton rythme.",
    });
    await expect(heroHeading).toBeVisible();
    await expect(
      heroHeading.locator("xpath=ancestor::section[1]/parent::*"),
    ).toHaveCSS("opacity", "1");
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Cent kilomètres dans les Aravis",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Nouvel objectif" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if (viewport.width === 1440) {
      await page.screenshot({ path: "/tmp/hovren-goals-hero-1440.png" });
    }

    if (viewport.width === 768 || viewport.width === 390) {
      await page.screenshot({
        path: `/tmp/hovren-goals-hero-${viewport.width}.png`,
      });
    }
  }
});
