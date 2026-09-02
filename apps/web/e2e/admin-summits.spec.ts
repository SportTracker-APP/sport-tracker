import { expect, test, type Page, type Route } from "@playwright/test";

const adminUser = {
  id: "admin-1",
  firstName: "Camille",
  email: "admin@hovren.test",
  role: "ADMIN",
  avatarUrl: null,
};

const bornes = {
  id: "bornes",
  name: "Bornes",
  slug: "bornes",
  type: "MASSIF",
  isPublished: true,
  hierarchy: ["France", "Alpes", "Bornes"],
};

const aravis = {
  id: "aravis",
  name: "Aravis",
  slug: "aravis",
  type: "MASSIF",
  isPublished: true,
  hierarchy: ["France", "Alpes", "Aravis"],
};

const listSummit = {
  id: "la-tournette",
  name: "La Tournette",
  altitude: 2351,
  latitude: 45.827,
  longitude: 6.287,
  massif: "Bornes",
  catalogStatus: "READY",
  catalogTier: "CORE",
  suggestedTier: "CORE",
  tierReason: "Legacy HOVREN",
  isActive: false,
  primaryMassifId: "bornes",
  primaryMassif: bornes,
  geoAreaCount: 1,
  quality: { isComplete: true, missingCount: 0, missing: [] },
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockAdminCatalogue(page: Page) {
  let detail = {
    ...listSummit,
    aliases: [],
    difficulty: "Expert",
    type: "Sommet",
    imageUrl: null,
    imageCredit: null,
    sourceUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-08-17T08:00:00.000Z",
    geoAreas: [bornes],
    adminAuditLogs: [] as Array<Record<string, unknown>>,
  };
  let lastSearch = "";
  const mutationPayloads: unknown[] = [];

  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "admin-e2e-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, (route) =>
    route.abort(),
  );
  await page.route("**/users/me", (route) => fulfillJson(route, adminUser));
  await page.route("**/auth/refresh", (route) =>
    fulfillJson(route, { accessToken: "admin-e2e-token", user: adminUser }),
  );
  await page.route("**/strava/status", (route) =>
    fulfillJson(route, { connected: false }),
  );
  await page.route("**/activities**", (route) => fulfillJson(route, []));
  await page.route("**/summits**", (route) => fulfillJson(route, []));

  await page.route("**/admin/summits**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname === "/admin/summits/import-runs") {
      await fulfillJson(route, [
        {
          id: "import-74",
          provider: "IGN_BD_TOPO",
          scope: "D074",
          sourceVersion: "2026-06-15",
          sourceName: "IGN BD TOPO® — Détail orographique",
          status: "APPLIED",
          startedAt: "2026-08-17T08:00:00.000Z",
          completedAt: "2026-08-17T08:05:00.000Z",
          sourceCount: 2849,
          candidateCount: 911,
          createdCount: 836,
          matchedCount: 10,
          conflictCount: 65,
          rejectedCount: 1938,
          errorCount: 0,
          publishableCount: 0,
          candidateStatuses: { CONFLICT: 65, REJECTED: 0 },
          suggestedTiers: { CORE: 256, SECONDARY: 280, REFERENCE: 375 },
          resolvedConflictCount: 0,
          unresolvedConflictCount: 65,
          legacyMatchCount: 10,
          homonymCandidateCount: 53,
          withoutMassifCount: 836,
        },
      ]);
      return;
    }

    if (pathname === "/admin/summits/import-runs/import-74") {
      await fulfillJson(route, {
        id: "import-74",
        candidates: [
          {
            id: "candidate-border",
            externalId: "PAIOROGR0000000012525444",
            name: "le Petit Croisse Baulet",
            status: "CONFLICT",
            suggestedTier: "SECONDARY",
            catalogTier: "SECONDARY",
            tierReason: "IGN importance 3",
            classificationSignals: {
              ignImportance: 3,
              osmMatched: true,
              nearestHigherDistanceMeters: 720,
            },
            isLegacyMatch: false,
            homonymGroupSize: 1,
            resolutionAction: null,
            resolutionReason: "Sommet frontalier à 27.7 m",
            errorMessage: null,
            matchedSummit: null,
          },
        ],
        pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
      });
      return;
    }

    if (pathname === "/admin/summits" && request.method() === "GET") {
      lastSearch = url.searchParams.get("search") ?? "";
      await fulfillJson(route, {
        items: [
          {
            ...listSummit,
            name: detail.name,
            isActive: detail.isActive,
            catalogStatus: detail.catalogStatus,
            primaryMassif: detail.primaryMassif,
          },
        ],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      });
      return;
    }

    if (pathname === "/admin/summits/geo-areas/options") {
      await fulfillJson(route, [bornes, aravis]);
      return;
    }

    if (pathname.endsWith("/primary-massif")) {
      const payload = request.postDataJSON() as { geoAreaId: string };
      mutationPayloads.push(payload);
      detail = {
        ...detail,
        primaryMassifId: payload.geoAreaId,
        primaryMassif: payload.geoAreaId === "aravis" ? aravis : bornes,
      };
      await fulfillJson(route, detail);
      return;
    }

    if (pathname.endsWith("/geo-areas") && request.method() === "POST") {
      const payload = request.postDataJSON() as { geoAreaId: string };
      mutationPayloads.push(payload);
      detail = { ...detail, geoAreas: [...detail.geoAreas, aravis] };
      await fulfillJson(route, detail);
      return;
    }

    if (
      pathname === "/admin/summits/la-tournette" &&
      request.method() === "PATCH"
    ) {
      const payload = request.postDataJSON() as Record<string, unknown>;
      mutationPayloads.push(payload);
      detail = { ...detail, ...payload };
      await fulfillJson(route, detail);
      return;
    }

    await fulfillJson(route, detail);
  });

  return {
    getLastSearch: () => lastSearch,
    getMutationPayloads: () => mutationPayloads,
  };
}

test("un admin recherche, ouvre et modifie un sommet sans quitter le catalogue", async ({
  page,
}) => {
  const catalogue = await mockAdminCatalogue(page);

  await page.goto("/admin/sommets", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { level: 1, name: "Sommets" }),
  ).toBeVisible();

  await page.getByRole("searchbox").fill("Tournette");
  await expect.poll(catalogue.getLastSearch).toBe("Tournette");

  await page.getByRole("button", { name: /La Tournette/ }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "La Tournette" }),
  ).toBeVisible();
  await expect(page.getByText("Données essentielles complètes.")).toBeVisible();

  await page.getByLabel("Nom").fill("La Tournette — catalogue");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("enregistrées");

  await page.getByRole("button", { name: "Publier", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("publié");

  await page
    .getByRole("complementary", { name: /Gestion de La Tournette/ })
    .getByRole("combobox", { name: "Massif principal", exact: true })
    .selectOption("aravis");
  await expect(page.getByRole("status")).toContainText("Massif principal");

  await expect
    .poll(() => catalogue.getMutationPayloads().length)
    .toBeGreaterThanOrEqual(3);
});

test("le catalogue admin reste utilisable sur un écran mobile", async ({
  page,
}) => {
  await mockAdminCatalogue(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/sommets", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { level: 1, name: "Sommets" }),
  ).toBeVisible();
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
});

test("un admin ouvre les conflits du dernier import sans les publier", async ({
  page,
}) => {
  await mockAdminCatalogue(page);
  await page.goto("/admin/sommets", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Administrer l’import" }).click();

  await expect(page.getByText("le Petit Croisse Baulet")).toBeVisible();
  await expect(page.getByText("Sommet frontalier à 27.7 m")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publier les 0 prêts" }),
  ).toBeDisabled();
});
