import { expect, test, type Page, type Route } from "@playwright/test";

const mockUser = {
  id: "strava-user",
  firstName: "Camille",
  email: "camille@example.test",
  role: "USER",
  avatarUrl: null,
};

const latestActivity = {
  id: "latest-strava-activity",
  title: "Boucle du Mont Veyrier",
  sport: "Randonnée",
  distance: 12600,
  duration: 142,
  elevationGain: 680,
  startedAt: "2026-08-09T07:30:00.000Z",
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockAuthenticatedShell(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
  await page.route("**/users/me", async (route) =>
    fulfillJson(route, mockUser),
  );
  await page.route("**/auth/refresh", async (route) =>
    fulfillJson(route, {
      accessToken: "e2e-refreshed-token",
      user: mockUser,
    }),
  );
  await page.route("**/summits**", async (route) => fulfillJson(route, []));
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));

  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
}

async function expectStravaSettled(page: Page) {
  await expect(
    page
      .getByRole("heading", { level: 1, name: "Strava alimente ton carnet" })
      .locator("xpath=ancestor::main[1]/parent::*"),
  ).toHaveCSS("opacity", "1");
}

test("le compte connecté conserve la synchronisation et la déconnexion", async ({
  page,
}) => {
  await mockAuthenticatedShell(page);
  let syncAttempts = 0;
  let disconnectAttempts = 0;

  await page.route("**/strava/status", async (route) =>
    fulfillJson(route, {
      connected: true,
      athleteId: "482901",
      lastUpdatedAt: "2026-08-10T18:00:00.000Z",
    }),
  );
  await page.route("**/activities**", async (route) =>
    fulfillJson(route, [
      {
        id: "future-session",
        title: "Sortie planifiée",
        sport: "Trail",
        duration: 90,
        startedAt: "2099-08-15T07:00:00.000Z",
      },
      latestActivity,
    ]),
  );
  await page.route("**/strava/sync", async (route) => {
    syncAttempts += 1;
    await fulfillJson(route, {
      imported: 1,
      fetched: 1,
      latestImportedActivityTitle: latestActivity.title,
    });
  });
  await page.route("**/strava/disconnect", async (route) => {
    disconnectAttempts += 1;
    await fulfillJson(route, {});
  });

  await page.goto("/integrations/strava", { waitUntil: "domcontentloaded" });
  await expectStravaSettled(page);

  await expect(
    page.getByRole("heading", { level: 1, name: "Strava alimente ton carnet" }),
  ).toBeVisible();
  await expect(
    page.getByText("Compte Strava connecté", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: latestActivity.title }),
  ).toBeVisible();
  await expect(page.getByText("12,6 km")).toBeVisible();
  await expect(page.getByText("2h22")).toBeVisible();
  await expect(page.getByText("680 m D+")).toBeVisible();

  await page.getByRole("button", { name: "Synchroniser" }).click();
  await expect(page.getByRole("status")).toContainText(
    "1 sortie synchronisée : Boucle du Mont Veyrier.",
  );
  expect(syncAttempts).toBe(1);

  await page.getByRole("button", { name: "Déconnecter" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Compte Strava déconnecté.",
  );
  await expect(page.getByText("Non connecté", { exact: true })).toBeVisible();
  expect(disconnectAttempts).toBe(1);
});

test("la reconnexion requise reste explicite et conserve l’historique", async ({
  page,
}) => {
  await mockAuthenticatedShell(page);
  await page.route("**/strava/status", async (route) =>
    fulfillJson(route, { connected: false, requiresReconnect: true }),
  );
  await page.route("**/activities**", async (route) =>
    fulfillJson(route, [latestActivity]),
  );

  await page.goto("/integrations/strava", { waitUntil: "domcontentloaded" });
  await expectStravaSettled(page);

  await expect(
    page.getByRole("button", { name: "Reconnecter Strava" }),
  ).toBeEnabled();
  await expect(
    page
      .getByRole("heading", { level: 2, name: "Statut de synchronisation" })
      .locator("xpath=ancestor::section[1]")
      .getByText("À reconnecter", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Tes sorties déjà importées sont conservées",
  );
  await expect(
    page.getByRole("heading", { level: 3, name: latestActivity.title }),
  ).toBeVisible();
});

test("la connexion OAuth conserve la redirection existante", async ({
  page,
}) => {
  await mockAuthenticatedShell(page);
  await page.route("**/strava/status", async (route) =>
    fulfillJson(route, { connected: false }),
  );
  await page.route("**/activities**", async (route) => fulfillJson(route, []));
  await page.route("**/strava/connect", async (route) =>
    fulfillJson(route, { authorizationUrl: "/mock-strava-oauth" }),
  );
  await page.route("**/mock-strava-oauth", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<title>OAuth Strava</title><h1>Autorisation Strava</h1>",
    }),
  );

  await page.goto("/integrations/strava", { waitUntil: "domcontentloaded" });
  await expectStravaSettled(page);
  await page.getByRole("button", { name: "Connecter Strava" }).click();

  await expect(page).toHaveURL(/\/mock-strava-oauth$/);
  await expect(
    page.getByRole("heading", { name: "Autorisation Strava" }),
  ).toBeVisible();
});

test("la page reste lisible sur desktop, tablette et mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockAuthenticatedShell(page);
  await page.route("**/strava/status", async (route) =>
    fulfillJson(route, {
      connected: true,
      athleteId: "482901",
      lastUpdatedAt: "2026-08-10T18:00:00.000Z",
    }),
  );
  await page.route("**/activities**", async (route) =>
    fulfillJson(route, [latestActivity]),
  );

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/integrations/strava", { waitUntil: "domcontentloaded" });
    await expectStravaSettled(page);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Strava alimente ton carnet",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Dernière sortie synchronisée",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Statut de synchronisation",
      }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if ([1440, 768, 390].includes(viewport.width)) {
      await page.screenshot({
        path: `/tmp/hovren-strava-${viewport.width}.png`,
        fullPage: true,
      });
    }

    if (viewport.width === 1440) {
      await page
        .getByRole("heading", { name: "Les données utiles, sans ressaisie" })
        .scrollIntoViewIfNeeded();
      await page.screenshot({ path: "/tmp/hovren-strava-lower-1440.png" });
    }
  }
});
