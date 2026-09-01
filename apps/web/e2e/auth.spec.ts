import { expect, test } from "@playwright/test";

const genericConfirmation =
  "Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.";

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
});

test("la connexion valide les champs obligatoires", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Ouvrir mon carnet" }).click();

  await expect(page.getByText("Email invalide")).toBeVisible();
  await expect(page.getByText("Minimum 6 caractères")).toBeVisible();
});

test("un utilisateur peut demander un lien depuis la card de connexion", async ({
  page,
}) => {
  await page.route("**/auth/forgot-password", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: genericConfirmation }),
    });
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Mot de passe oublié ?" }).click();

  await expect(
    page.getByRole("heading", { name: "Retrouve ton accès" }),
  ).toBeVisible();

  await page.getByPlaceholder("ton@email.com").fill("randonneur@example.test");
  await page.getByRole("button", { name: "Recevoir le lien" }).click();

  await expect(page.getByText(genericConfirmation)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retour à la connexion" }),
  ).toBeVisible();
});

test("la validation email utilise le carnet HOVREN actuel", async ({
  page,
}) => {
  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });
  await page.route("**/auth/verify-email**", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Invalid verification token" }),
    });
  });

  await page.goto("/verify-email?token=expired-token");

  await expect(
    page.getByRole("heading", { name: "Lien invalide" }),
  ).toBeVisible();
  await expect(page.getByText("Validation interrompue")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Retour à la connexion" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Retrouve ton carnet de sommets" }),
  ).toBeVisible();
});

test("un sommet découvert peut être retiré après confirmation sur mobile", async ({
  page,
}) => {
  const summit = {
    id: "lanfonnet",
    name: "Lanfonnet",
    aliases: [],
    altitude: 1768,
    massif: "Bornes",
    difficulty: "Modérée",
    type: "Sommet",
    coordinates: [6.247, 45.85],
    discovered: true,
    closestDistance: 12,
    activityCount: 1,
    firstActivity: {
      id: "activity-1",
      title: "Trail du Lanfonnet",
      sport: "TRAIL",
      startedAt: "2026-07-04T08:00:00.000Z",
      distance: 14.2,
      elevationGain: 980,
      coverImageUrl: null,
    },
    latestActivity: {
      id: "activity-1",
      title: "Trail du Lanfonnet",
      sport: "TRAIL",
      startedAt: "2026-07-04T08:00:00.000Z",
      distance: 14.2,
      elevationGain: 980,
      coverImageUrl: null,
    },
    pendingDiscoveries: [],
  };
  let hasBeenRemoved = false;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
    window.localStorage.setItem(
      "hovren.summitCelebrations.v1",
      JSON.stringify({
        initialized: true,
        seenEventKeys: ["summit-discovery:lanfonnet:activity-1"],
      }),
    );
    window.localStorage.setItem(
      "hovren.summitCelebrations.dashboardEvent.v1",
      JSON.stringify({
        key: "summit-discovery:lanfonnet:activity-1",
        type: "SUMMIT_DISCOVERY",
        summitId: "lanfonnet",
        summitName: "Lanfonnet",
        massif: "Bornes",
        createdAt: "2026-07-04T08:00:00.000Z",
        dismissed: false,
      }),
    );
  });
  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        firstName: "Camille",
        email: "camille@example.test",
        role: "USER",
      }),
    });
  });
  await page.route("**/users/me/geo-preferences", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ discovery: [], onboardingCompleted: true }),
    });
  });
  await page.route("**/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "e2e-access-token",
        user: {
          id: "user-1",
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
  await page.route("**/summits**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (
      request.method() === "DELETE" &&
      pathname === "/summits/lanfonnet/discovery"
    ) {
      hasBeenRemoved = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ dismissedDiscoveries: 1 }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        pathname === "/summits/badges" ? [] : hasBeenRemoved ? [] : [summit],
      ),
    });
  });

  await page.goto("/sommets");
  const summitActions = page.locator(
    'summary[aria-label="Actions pour Lanfonnet"]',
  );
  await summitActions.click();
  await expect(summitActions.locator("..")).toHaveAttribute("open", "");
  await page
    .getByRole("button", { name: "Retirer Lanfonnet de mes découvertes" })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Retirer Lanfonnet de tes découvertes ?",
    }),
  ).toBeVisible();
  await expect(page.getByRole("alertdialog")).toBeInViewport();
  await expect(
    page.getByText(
      "Une prochaine sortie passant à proximité pourra toutefois le faire apparaître à nouveau.",
      { exact: false },
    ),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Retirer de mes découvertes" })
    .click();

  await expect.poll(() => hasBeenRemoved).toBe(true);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const rawValue = window.localStorage.getItem(
          "hovren.summitCelebrations.dashboardEvent.v1",
        );

        return rawValue
          ? (JSON.parse(rawValue) as { dismissed?: boolean }).dismissed
          : undefined;
      }),
    )
    .toBe(true);
  await expect(
    page.getByRole("heading", {
      name: "Retirer Lanfonnet de tes découvertes ?",
    }),
  ).not.toBeVisible();
});
