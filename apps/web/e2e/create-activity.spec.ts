import { expect, test, type Page, type Route } from "@playwright/test";

const mockUser = {
  id: "activity-form-user",
  firstName: "Camille",
  email: "camille@example.test",
  role: "USER",
  avatarUrl: null,
};

const responsiveViewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

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
  await page.route("**/strava/status", async (route) =>
    fulfillJson(route, { connected: false }),
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

test("une activité réalisée conserve tous ses champs et son payload", async ({
  page,
}) => {
  await mockAuthenticatedShell(page);
  let payload: Record<string, unknown> | null = null;
  let submitCount = 0;

  await page.route("**/activities", async (route) => {
    if (route.request().method() === "POST") {
      submitCount += 1;
      payload = route.request().postDataJSON();
      await new Promise((resolve) => setTimeout(resolve, 120));
      await fulfillJson(route, { id: "created-activity" }, 201);
      return;
    }

    await fulfillJson(route, []);
  });

  await page.goto("/activites/nouvelle?status=COMPLETED", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { level: 1, name: /Ajoute une sortie déjà/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Activité réalisée/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Titre")).toHaveAttribute(
    "placeholder",
    "Sortie déjà réalisée",
  );
  await expect(page.getByLabel("Titre")).toHaveValue("");

  await page.getByRole("radio", { name: /Randonnée/ }).click();
  await page.getByLabel("Titre").fill("Traversée des Aravis");
  await page.getByLabel("Date et heure").fill("2026-08-10T07:30");
  await page.getByLabel("Distance").fill("18.4");
  await page.getByLabel("Durée en heures").fill("3");
  await page.getByLabel("Durée en minutes").fill("25");
  await page.getByLabel("Dénivelé positif").fill("920");
  await page.getByLabel("Calories").fill("1460");
  await page
    .getByLabel("Notes et sensations")
    .fill("Terrain sec, lumière douce et très bonnes sensations.");

  await page.getByRole("button", { name: "Enregistrer la sortie" }).dblclick();
  await expect(page.getByText("Trace enregistrée")).toBeVisible();

  expect(submitCount).toBe(1);
  expect(payload).toMatchObject({
    sport: "HIKING",
    status: "COMPLETED",
    title: "Traversée des Aravis",
    distance: 18.4,
    duration: 205,
    elevationGain: 920,
    calories: 1460,
    type: "TRAINING",
    description: "Terrain sec, lumière douce et très bonnes sensations.",
  });
});

test("une sortie planifiée conserve le préremplissage et masque les résultats", async ({
  page,
}) => {
  await mockAuthenticatedShell(page);
  let payload: Record<string, unknown> | null = null;

  await page.route("**/activities", async (route) => {
    if (route.request().method() === "POST") {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { id: "planned-activity" }, 201);
      return;
    }

    await fulfillJson(route, []);
  });

  await page.goto(
    "/activites/nouvelle?status=PLANNED&date=2026-08-20&returnTo=%2Fcalendrier",
    { waitUntil: "domcontentloaded" },
  );

  await expect(
    page.getByRole("button", { name: /Sortie à planifier/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Titre")).toHaveAttribute(
    "placeholder",
    "Sortie à venir",
  );
  await expect(page.getByLabel("Titre")).toHaveValue("");
  await expect(page.getByLabel("Date et heure")).toHaveValue(
    "2026-08-20T12:00",
  );
  await expect(page.getByLabel("Distance")).toHaveCount(0);
  await expect(
    page.getByText("Les résultats viendront après la sortie"),
  ).toBeVisible();

  await page.getByLabel("Titre").fill("Lever du jour au col");
  await page.getByRole("radio", { name: /Trail/ }).click();
  await page.getByRole("button", { name: "Ajouter au calendrier" }).click();
  await expect(
    page.getByText("Sortie planifiée", { exact: true }),
  ).toBeVisible();

  expect(payload).toMatchObject({
    sport: "TRAIL",
    status: "PLANNED",
    title: "Lever du jour au col",
    distance: 0,
    duration: 0,
    elevationGain: 0,
    calories: 0,
    type: "TRAINING",
  });
});

test("toutes les disciplines restent sélectionnables et la musculation adapte le formulaire", async ({
  page,
}) => {
  await mockAuthenticatedShell(page);
  await page.route("**/activities", async (route) => fulfillJson(route, []));
  await page.goto("/activites/nouvelle?status=COMPLETED", {
    waitUntil: "domcontentloaded",
  });

  for (const sport of ["Trail", "Course", "Randonnée", "VTT", "Musculation"]) {
    const choice = page.getByRole("radio", { name: new RegExp(sport) });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-checked", "true");
  }

  await expect(page.getByLabel("Distance")).toHaveCount(0);
  await expect(
    page.getByText("La musculation se raconte au carnet"),
  ).toBeVisible();
});

test("le formulaire reste lisible et sans débordement aux principaux breakpoints", async ({
  page,
}) => {
  await mockAuthenticatedShell(page);
  await page.route("**/activities", async (route) => fulfillJson(route, []));

  for (const viewport of responsiveViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/activites/nouvelle?status=COMPLETED", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { level: 1, name: /Ajoute une sortie déjà/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enregistrer la sortie" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if (viewport.width === 1440 || viewport.width === 390) {
      await page.screenshot({
        path: `/tmp/hovren-create-activity-${viewport.width}.png`,
        fullPage: true,
      });

      if (viewport.width === 1440) {
        await page.locator("form").screenshot({
          path: "/tmp/hovren-create-activity-form.png",
        });
      }
    }
  }
});
