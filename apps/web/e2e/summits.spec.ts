import { devices, expect, test, type Page } from "@playwright/test";

type DiscoveryStatus = "CONFIRMED" | "DISMISSED";

const iphone13 = devices["iPhone 13"];

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
});

const activity = {
  id: "activity-veyrier",
  title: "Boucle du Mont Veyrier",
  sport: "TRAIL",
  startedAt: "2026-07-20T08:00:00.000Z",
  distance: 12.4,
  elevationGain: 680,
  maxAltitude: 1298,
  coverImageUrl: "/landing/summit-discovery-wildflowers.jpg",
};

const summitCatalog = [
  {
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
    activityCount: 2,
    firstActivity: activity,
    latestActivity: activity,
    firstDiscoveredAt: "2026-07-02T08:00:00.000Z",
    latestDiscoveredAt: "2026-07-20T08:00:00.000Z",
    pendingDiscoveries: [],
    imageUrl: "/summits/mont-veyrier.webp",
    imageCredit: "Photo : Yann Forget",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Lac_veyrier2.jpg",
  },
  {
    id: "pointe-talamarche",
    name: "Pointe de Talamarche",
    aliases: [],
    altitude: 1852,
    massif: "Bornes",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.271, 45.84],
    discovered: false,
    closestDistance: 42,
    activityCount: 0,
    firstActivity: null,
    latestActivity: null,
    firstDiscoveredAt: null,
    latestDiscoveredAt: null,
    pendingDiscoveries: [
      {
        id: "pending-talamarche",
        confidence: 0.86,
        closestDistance: 42,
        activity: {
          ...activity,
          id: "activity-talamarche",
          title: "Trail de Talamarche",
          maxAltitude: 1840,
        },
      },
    ],
    imageUrl: null,
    imageCredit: null,
    sourceUrl: null,
  },
  {
    id: "montagne-sous-dine",
    name: "Montagne de Sous-Dine",
    aliases: [],
    altitude: 2004,
    massif: "Bornes",
    difficulty: "Difficile",
    type: "Crête",
    coordinates: [6.323, 46.02],
    discovered: false,
    closestDistance: 620,
    activityCount: 0,
    firstActivity: null,
    latestActivity: null,
    firstDiscoveredAt: null,
    latestDiscoveredAt: null,
    pendingDiscoveries: [],
    imageUrl: "/summits/montagne-de-sous-dine.webp",
    imageCredit: "Photo : Guilhem Vellut",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Montagne_de_Sous-Dine_@_Filli%C3%A8re_(51019671756).jpg",
  },
  {
    id: "la-tournette",
    name: "La Tournette",
    aliases: [],
    altitude: 2351,
    massif: "Bornes",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.286, 45.827],
    discovered: false,
    closestDistance: null,
    activityCount: 0,
    firstActivity: null,
    latestActivity: null,
    firstDiscoveredAt: null,
    latestDiscoveredAt: null,
    pendingDiscoveries: [],
    imageUrl: "/summits/la-tournette.webp",
    imageCredit: "Photo : Guilhem Vellut",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:La_Tournette_@_Lake_Annecy_@_Saint-Jorioz_(50488455392).jpg",
  },
];

async function mockSummitsPage(page: Page) {
  let pendingStatus: DiscoveryStatus | null = null;

  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
  });

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-summits",
        firstName: "Camille",
        email: "camille@example.test",
        role: "USER",
        needsDiscoveryOnboarding: false,
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
          id: "user-summits",
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
      request.method() === "PATCH" &&
      pathname === "/summits/discoveries/pending-talamarche"
    ) {
      const payload = request.postDataJSON() as { status: DiscoveryStatus };
      pendingStatus = payload.status;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: payload.status }),
      });
      return;
    }

    if (pathname === "/summits/badges") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
      return;
    }

    const responseCatalog = summitCatalog.map((summit) =>
      summit.id === "pointe-talamarche" && pendingStatus
        ? {
            ...summit,
            discovered: pendingStatus === "CONFIRMED",
            activityCount: pendingStatus === "CONFIRMED" ? 1 : 0,
            firstActivity:
              pendingStatus === "CONFIRMED"
                ? summit.pendingDiscoveries[0]?.activity
                : null,
            latestActivity:
              pendingStatus === "CONFIRMED"
                ? summit.pendingDiscoveries[0]?.activity
                : null,
            firstDiscoveredAt:
              pendingStatus === "CONFIRMED" ? "2026-07-21T08:00:00.000Z" : null,
            latestDiscoveredAt:
              pendingStatus === "CONFIRMED" ? "2026-07-21T08:00:00.000Z" : null,
            pendingDiscoveries: [],
          }
        : summit,
    );

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseCatalog),
    });
  });

  return {
    getPendingStatus: () => pendingStatus,
  };
}

test("le carnet filtre, recherche et conserve sa vue dans l’URL", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSummitsPage(page);
  await page.goto("/sommets");

  await expect(
    page.getByRole("heading", { name: "Ton carnet des sommets" }),
  ).toBeVisible();
  await expect(
    page.getByText("1 sommet découvert sur 4 dans l’atlas"),
  ).toBeAttached();
  await expect(
    page.getByText("Mont Veyrier", { exact: true }).first(),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('img[alt="Vue de Mont Veyrier"]')
        .first()
        .evaluate(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.waitForTimeout(650);
  await page.screenshot({
    path: testInfo.outputPath("sommets-desktop.png"),
    fullPage: false,
  });

  await page.getByRole("button", { name: /À découvrir/ }).click();
  const catalog = page.getByLabel("Catalogue des sommets");
  await expect(
    catalog.getByRole("heading", { name: "Montagne de Sous-Dine" }),
  ).toBeVisible();
  await expect(
    catalog.getByRole("heading", { name: "Mont Veyrier" }),
  ).not.toBeVisible();

  await page.getByPlaceholder("Rechercher un sommet").fill("tournette");
  await expect(
    catalog.getByRole("heading", { name: "La Tournette" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Vue de La Tournette" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/recherche=tournette/);

  await page.getByRole("button", { name: "Afficher la liste" }).click();
  await expect(page).toHaveURL(/vue=liste/);
  await expect(page.getByText("La Tournette", { exact: true })).toBeVisible();
});

test("une détection proche peut être confirmée sans quitter le carnet", async ({
  page,
}) => {
  const mock = await mockSummitsPage(page);
  await page.goto("/sommets?statut=a-confirmer");

  await expect(
    page.getByRole("heading", { name: "Pointe de Talamarche" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Ta trace est passée à 42 m du sommet/i),
  ).toBeVisible();
  const pendingCard = page
    .getByRole("heading", { name: "Pointe de Talamarche" })
    .locator("xpath=ancestor::article");
  await expect(
    pendingCard.getByRole("img", {
      name: "Illustration de relief pour Pointe de Talamarche",
    }),
  ).toBeVisible();
  await expect(
    pendingCard
      .getByRole("img", {
        name: "Illustration de relief pour Pointe de Talamarche",
      })
      .locator("svg")
      .first(),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Oui, l’ajouter au carnet", exact: true })
    .click();

  await expect.poll(mock.getPendingStatus).toBe("CONFIRMED");
  await expect(page.getByText("Sommet ajouté à ton carnet.")).toBeVisible();
});

test("la collection évite les photos répétées et conserve des actions utiles", async ({
  page,
}) => {
  await mockSummitsPage(page);
  await page.goto("/sommets");
  await page.getByRole("button", { name: /^Tous 4$/ }).click();

  const catalog = page.getByLabel("Catalogue des sommets");
  await expect(catalog).not.toContainText("Modérée");
  await expect(catalog).not.toContainText("Difficile");
  await expect(catalog).not.toContainText("Expert");
  await expect(
    catalog.locator('img[alt^="Photo de la sortie liée à"]'),
  ).toHaveCount(0);
  await expect(
    catalog.getByRole("img", {
      name: "Illustration de relief pour Pointe de Talamarche",
    }),
  ).toBeVisible();
  await expect(
    catalog
      .getByRole("heading", { name: "Mont Veyrier" })
      .locator("xpath=ancestor::article")
      .getByRole("link", { name: "Voir la trace" }),
  ).toHaveAttribute("href", "/activites/activity-veyrier");
  await expect(
    catalog
      .getByRole("heading", { name: "Montagne de Sous-Dine" })
      .locator("xpath=ancestor::article")
      .getByRole("link", { name: "Voir le sommet" }),
  ).toHaveAttribute("href", /sommet=montagne-sous-dine/);

  await page.getByLabel("Trier les sommets").selectOption("ALTITUDE_DESC");
  await expect(page).toHaveURL(/tri=ALTITUDE_DESC/);
  await expect(catalog.locator("article h3").first()).toHaveText(
    "La Tournette",
  );
});

test("les filtres avancés restent lisibles, supprimables et synchronisés dans l’URL", async ({
  page,
}) => {
  await mockSummitsPage(page);
  await page.goto("/sommets");

  await page.getByRole("button", { name: /^Tous 4$/ }).click();
  await page.getByRole("button", { name: /^Filtres/ }).click();
  const advancedFilters = page.getByLabel("Filtres avancés");

  await advancedFilters.getByLabel("Massif").selectOption("Bornes");
  await advancedFilters.getByLabel("Altitude").selectOption("MID");

  await expect(page).toHaveURL(/massif=Bornes/);
  await expect(page).toHaveURL(/altitude=MID/);
  await expect(page.getByText("2 sommets affichés")).toBeVisible();
  await expect(page.getByRole("button", { name: /Filtres 2/ })).toBeVisible();

  await page.getByRole("button", { name: "Tout effacer" }).click();
  await expect(page).not.toHaveURL(/massif=/);
  await expect(page).not.toHaveURL(/altitude=/);
});

test("les états de chargement et d’erreur restent explicites", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
  });
  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-summits",
        firstName: "Camille",
        email: "camille@example.test",
        role: "USER",
      }),
    });
  });
  await page.route("**/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "e2e-access-token",
        user: {
          id: "user-summits",
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
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Service indisponible" }),
    });
  });

  await page.goto("/sommets");
  await expect(page.getByLabel("Chargement des sommets")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Le carnet n’a pas pu être ouvert.",
    }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
});

test("la composition reste maîtrisée sur un grand écran", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1728, height: 1117 });
  await mockSummitsPage(page);
  await page.goto("/sommets");
  await page.getByRole("button", { name: /^Tous 4$/ }).click();
  await page.getByLabel("Catalogue des sommets").scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  await page.screenshot({
    path: testInfo.outputPath("sommets-desktop-large.png"),
    fullPage: false,
  });
});

test.describe("rendu iPhone 13", () => {
  test.use({
    userAgent: iphone13.userAgent,
    viewport: iphone13.viewport,
    deviceScaleFactor: iphone13.deviceScaleFactor,
    isMobile: iphone13.isMobile,
    hasTouch: iphone13.hasTouch,
  });

  test("la composition mobile reste contenue dans le viewport", async ({
    page,
  }, testInfo) => {
    await mockSummitsPage(page);
    await page.goto("/sommets");

    await expect(
      page.getByRole("heading", { name: "Ton carnet des sommets" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", {
        name: "Découvrir les 2 sommets restants",
      }),
    ).toBeInViewport();
    await expect
      .poll(() =>
        page
          .locator('img[alt="Vue de Mont Veyrier"]')
          .first()
          .evaluate(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await page.waitForTimeout(650);
    await page.screenshot({
      path: testInfo.outputPath("sommets-mobile-hero.png"),
      fullPage: false,
    });
    await page
      .getByRole("heading", { name: "Mont Veyrier" })
      .first()
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("sommets-mobile-discovery.png"),
      fullPage: false,
    });
    await page
      .getByRole("heading", { name: "Tous tes sommets" })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("sommets-mobile-catalog.png"),
      fullPage: false,
    });
    await page
      .getByLabel("Catalogue des sommets")
      .getByRole("heading", { name: "Mont Veyrier" })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("sommets-mobile-card.png"),
      fullPage: false,
    });
  });

  test("le statut du fallback reste net sur mobile", async ({ page }) => {
    await mockSummitsPage(page);
    await page.goto("/sommets?statut=a-confirmer");

    const pendingCard = page
      .getByRole("heading", { name: "Pointe de Talamarche" })
      .locator("xpath=ancestor::article");
    const fallback = pendingCard.getByRole("img", {
      name: "Illustration de relief pour Pointe de Talamarche",
    });

    await expect(pendingCard.getByText("Passage proche")).toBeVisible();
    await expect(fallback.locator("svg").first()).toBeHidden();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
  });
});

for (const viewport of [
  { name: "mobile-large", width: 430, height: 932 },
  { name: "tablette", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "desktop-large", width: 1728, height: 1117 },
]) {
  test(`la page reste stable en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await mockSummitsPage(page);
    await page.goto("/sommets");

    await expect(
      page.getByRole("heading", { name: "Ton carnet des sommets" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
  });
}
