import { expect, test, type Page, type Route } from "@playwright/test";

const department = {
  id: "haute-savoie",
  name: "Haute-Savoie",
  slug: "haute-savoie",
  type: "DEPARTMENT",
  parentId: "auvergne-rhone-alpes",
  _count: { summitLinks: 846 },
  massifs: [
    {
      id: "aravis",
      name: "Aravis",
      slug: "aravis",
      type: "MASSIF",
      _count: { summitLinks: 42 },
    },
    {
      id: "mont-blanc",
      name: "Mont-Blanc",
      slug: "mont-blanc",
      type: "MASSIF",
      _count: { summitLinks: 118 },
    },
  ],
};

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockTerritoryJourney(page: Page) {
  let completed = false;
  let selectedIds: string[] = [];

  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "territory-e2e-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, (route) =>
    route.abort(),
  );
  await page.route("**/users/me", (route) =>
    fulfillJson(route, {
      id: "user-territories",
      firstName: "Camille",
      email: "camille@example.test",
      role: "USER",
      avatarUrl: null,
      needsDiscoveryOnboarding: !completed,
    }),
  );
  await page.route("**/auth/refresh", (route) =>
    fulfillJson(route, { accessToken: "territory-e2e-token" }),
  );
  await page.route("**/strava/status", (route) =>
    fulfillJson(route, { connected: false }),
  );
  await page.route("**/geo-areas/discovery-options", (route) =>
    fulfillJson(route, [department]),
  );
  await page.route("**/users/me/geo-preferences**", async (route) => {
    if (route.request().method() === "PUT") {
      selectedIds = (route.request().postDataJSON() as { geoAreaIds: string[] })
        .geoAreaIds;
      completed = true;
    }

    await fulfillJson(route, {
      discovery: department.massifs.filter(({ id }) =>
        selectedIds.includes(id),
      ),
      onboardingCompleted: completed,
    });
  });
  await page.route("**/activities**", (route) => fulfillJson(route, []));
  await page.route("**/summits**", (route) => fulfillJson(route, []));

  return { getSelectedIds: () => selectedIds };
}

test("un premier accès choisit plusieurs massifs puis conserve ce choix dans Paramètres", async ({
  page,
}) => {
  const journey = await mockTerritoryJourney(page);
  await page.goto("/onboarding/territoires", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "Où veux-tu explorer ?" }),
  ).toBeVisible();
  await expect(page.getByText("846 sommets")).toBeVisible();
  await page.getByRole("button", { name: "Affiner" }).click();
  await page.getByRole("button", { name: /Aravis/ }).click();
  await page.getByRole("button", { name: /Mont-Blanc/ }).click();
  await page.getByRole("button", { name: "Explorer ces territoires" }).click();

  await expect.poll(journey.getSelectedIds).toEqual(["aravis", "mont-blanc"]);
  await expect(page).toHaveURL(/\/refuge$/);

  await page.goto("/parametres", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Territoires d’aventure" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Aravis/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("le choix Tout HOVREN reste accessible sur iPhone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const journey = await mockTerritoryJourney(page);
  await page.goto("/onboarding/territoires", {
    waitUntil: "domcontentloaded",
  });

  const skip = page.getByRole("button", { name: "Explorer tout HOVREN" });
  await expect(skip).toBeVisible();
  expect((await skip.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await skip.click();

  await expect.poll(journey.getSelectedIds).toEqual([]);
  await expect(page).toHaveURL(/\/refuge$/);
});
