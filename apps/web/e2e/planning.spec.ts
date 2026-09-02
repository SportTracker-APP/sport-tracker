import { expect, test, type Page, type Route } from "@playwright/test";

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();

  nextDate.setDate(nextDate.getDate() + (day === 0 ? -6 : 1 - day));
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addDays(date: Date, days: number, hour = 8) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);
  nextDate.setHours(hour, 0, 0, 0);

  return nextDate;
}

function toDateInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function createActivity({
  id,
  title,
  startedAt,
  status,
  sport = "TRAIL",
  distance = 0,
  duration = 0,
  description = null,
}: {
  id: string;
  title: string;
  startedAt: Date;
  status: "PLANNED" | "COMPLETED" | "MISSED" | "CANCELED";
  sport?: string;
  distance?: number;
  duration?: number;
  description?: string | null;
}) {
  return {
    id,
    title,
    description,
    stravaActivityId: null,
    type: "TRAINING",
    sport,
    status,
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: status === "COMPLETED" ? startedAt.toISOString() : null,
    celebrationSeenAt: null,
    distance,
    duration,
    movingTime: duration * 60,
    elevationGain: status === "COMPLETED" ? 640 : 0,
    elevationLoss: null,
    maxAltitude: null,
    minAltitude: null,
    calories: null,
    averageSpeed: null,
    maxSpeed: null,
    pace: null,
    averageHeartRate: null,
    maxHeartRate: null,
    temperature: null,
    weather: null,
    city: "Annecy",
    country: "France",
    startLatitude: null,
    startLongitude: null,
    endLatitude: null,
    endLongitude: null,
    routePolyline: null,
    coverImageUrl: null,
    photoUrls: [],
    photoCount: 0,
    altitudeStream: null,
    distanceStream: null,
    startedAt: startedAt.toISOString(),
    createdAt: startedAt.toISOString(),
    updatedAt: startedAt.toISOString(),
  };
}

function createWeekActivities() {
  const weekStart = startOfWeek(new Date());
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);

  return [
    createActivity({
      id: "completed-trail",
      title: "Boucle des crêtes au-dessus du lac",
      startedAt: addDays(weekStart, 0),
      status: "COMPLETED",
      distance: 12.4,
      duration: 90,
    }),
    createActivity({
      id: "planned-long-title",
      title:
        "Sortie d’endurance progressive avec un titre volontairement très long",
      startedAt: nextHour,
      status: "PLANNED",
      duration: 75,
      description: "Rester souple et garder une allure régulière.",
    }),
    createActivity({
      id: "planned-past",
      title: "Marche du matin",
      startedAt: new Date(Date.now() - 60 * 60 * 1000),
      status: "PLANNED",
      sport: "WALKING",
      duration: 45,
    }),
    createActivity({
      id: "planned-bike",
      title: "Tour du plateau",
      startedAt: new Date(nextHour.getTime() + 30 * 60 * 1000),
      status: "PLANNED",
      sport: "GRAVEL",
      distance: 32,
      duration: 120,
    }),
    createActivity({
      id: "missed-hike",
      title: "Montée au refuge",
      startedAt: addDays(weekStart, 3),
      status: "MISSED",
      sport: "HIKING",
    }),
    createActivity({
      id: "canceled-run",
      title: "Footing du soir",
      startedAt: addDays(weekStart, 4, 18),
      status: "CANCELED",
      sport: "RUNNING",
    }),
  ];
}

async function fulfillUser(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      id: "planning-user",
      firstName: "Camille",
      email: "camille@example.test",
      role: "USER",
    }),
  });
}

async function mockPlanning(
  page: Page,
  options: {
    activities?: ReturnType<typeof createWeekActivities>;
    delay?: number;
    startInError?: boolean;
  } = {},
) {
  let activities = options.activities ?? createWeekActivities();
  let shouldFail = options.startInError ?? false;

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
    if (new URL(route.request().url()).pathname.endsWith(".webp")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.route("**/activities/**", async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop();

    if (route.request().method() === "DELETE") {
      activities = activities.filter((activity) => activity.id !== id);
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (route.request().method() === "PATCH") {
      const current = activities.find((activity) => activity.id === id);
      const updated = current
        ? { ...current, status: "COMPLETED" as const }
        : null;
      activities = activities.map((activity) =>
        activity.id === id ? updated! : activity,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
      return;
    }

    await route.fallback();
  });
  await page.route("**/activities", async (route) => {
    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    if (shouldFail) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Erreur simulée" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(activities),
    });
  });

  return {
    getActivities: () => activities,
    recover: () => {
      shouldFail = false;
    },
  };
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));

  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
}

test.describe.configure({ mode: "serial" });

test("le planning reprend le carnet HOVREN et conserve sa navigation", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockPlanning(page);
  await page.goto("/calendrier", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", {
      name: "Ta semaine, du premier pas au prochain sommet.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Planning hebdomadaire")).toBeVisible();
  const weeklySummary = page.getByLabel("Résumé de la semaine");
  await expect(weeklySummary.getByText("12,4 km")).toBeVisible();
  await expect(weeklySummary.getByText("1 h 30")).toBeVisible();
  await expect(
    page.getByText("Sorties prévues", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-day]")).toHaveCount(7);
  const dayHeights = await page
    .locator("[data-day]")
    .evaluateAll((cards) =>
      cards.map((card) => Math.round(card.getBoundingClientRect().height)),
    );
  expect(new Set(dayHeights).size).toBe(1);

  await page.screenshot({
    path: "/tmp/hovren-planning-desktop-top.png",
    fullPage: true,
  });

  const weekLabel = page.locator('[aria-live="polite"]').first();
  const initialWeek = await weekLabel.textContent();
  const monday = startOfWeek(new Date());
  const previousWeekButton = page.getByRole("button", {
    name: "Afficher la semaine précédente",
  });
  await previousWeekButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-day]").first()).toHaveAttribute(
    "data-day",
    toDateInput(addDays(monday, -7)),
  );
  await page
    .getByRole("button", { name: "Afficher la semaine suivante" })
    .click();
  await expect(page.locator("[data-day]").first()).toHaveAttribute(
    "data-day",
    toDateInput(monday),
  );
  await page
    .getByRole("button", { name: "Afficher la semaine suivante" })
    .click();
  await expect(page.locator("[data-day]").first()).toHaveAttribute(
    "data-day",
    toDateInput(addDays(monday, 7)),
  );
  await expect(
    page.locator("[data-day]").filter({ hasText: "Journée libre" }),
  ).toHaveCount(7);
  await page
    .getByRole("heading", { name: "Sept jours pour trouver ton rythme." })
    .locator("xpath=ancestor::section[1]")
    .screenshot({ path: "/tmp/hovren-planning-empty-week.png" });

  for (let week = 1; week < 20; week += 1) {
    await page
      .getByRole("button", { name: "Afficher la semaine suivante" })
      .click();
  }
  await expect(page.locator("[data-day]").first()).toHaveAttribute(
    "data-day",
    toDateInput(addDays(startOfWeek(new Date()), 20 * 7)),
  );
  await expect(page.locator("[data-day]").last()).toHaveAttribute(
    "data-day",
    toDateInput(addDays(startOfWeek(new Date()), 20 * 7 + 6)),
  );
  await page.getByRole("button", { name: "Aujourd’hui" }).click();
  await expect(weekLabel).toHaveText(initialWeek ?? "");

  const sunday = addDays(monday, 6);
  await expect(
    page.locator(`[data-day="${toDateInput(monday)}"]`).getByRole("link", {
      name: /Planifier une sortie/,
    }),
  ).toHaveAttribute(
    "href",
    new RegExp(`status=PLANNED.*date=${toDateInput(monday)}`),
  );
  await expect(
    page.locator(`[data-day="${toDateInput(sunday)}"]`).getByRole("link", {
      name: /Planifier une sortie/,
    }),
  ).toHaveAttribute(
    "href",
    new RegExp(`status=PLANNED.*date=${toDateInput(sunday)}`),
  );
  await expect(
    page.getByRole("link", { name: "Planifier une sortie", exact: true }),
  ).toHaveAttribute(
    "href",
    new RegExp(`status=PLANNED.*date=${toDateInput(new Date())}`),
  );
  await expectNoHorizontalOverflow(page);

  await page.screenshot({
    path: "/tmp/hovren-planning-desktop-calendar.png",
    fullPage: true,
  });
});

test("la vue mois permet de parcourir les projets lointains", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockPlanning(page);
  await page.goto("/calendrier", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Mois", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Tout le mois en un coup d’œil." }),
  ).toBeVisible();
  await expect(page.getByText("Planning mensuel")).toBeVisible();
  await expect(page.locator("[data-month-day]")).toHaveCount(42);
  await expect(
    page.getByRole("button", { name: "Mois", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("link", {
      name: "Sortie d’endurance progressive avec un titre volontairement très long",
    }),
  ).toBeVisible();

  const monthLabel = page.locator('[aria-live="polite"]').first();
  const initialMonth = await monthLabel.textContent();
  await page
    .getByRole("button", { name: "Afficher le mois suivant" })
    .click();
  await expect(monthLabel).not.toHaveText(initialMonth ?? "");
  await page.getByRole("button", { name: "Aujourd’hui" }).click();
  await expect(monthLabel).toHaveText(initialMonth ?? "");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Agenda du mois")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("les actions d’une sortie respectent la date prévue", async ({ page }) => {
  const mock = await mockPlanning(page);
  await page.goto("/calendrier", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("link", { name: "Boucle des crêtes au-dessus du lac" }),
  ).toHaveAttribute("href", "/activites/completed-trail");

  await page
    .getByRole("button", {
      name: /Supprimer la sortie prévue Sortie d’endurance progressive/,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Supprimer cette sortie prévue ?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Supprimer du planning" }).click();

  await expect
    .poll(() =>
      mock.getActivities().some((item) => item.id === "planned-long-title"),
    )
    .toBe(false);
  await expect(page.getByText("Sortie d’endurance progressive")).toHaveCount(0);

  const futureStates = page.locator('[data-trace-state="future"]');
  await expect(futureStates).toHaveCount(1);
  await expect(futureStates).toHaveText("À venir");

  const waitingStates = page.locator('[data-trace-state="waiting"]');
  await expect(waitingStates).toHaveCount(1);
  await expect(waitingStates).toHaveText("En attente d’une trace");
  await expect(page.getByRole("button", { name: /Sortie faite/ })).toHaveCount(
    0,
  );
  expect(
    mock.getActivities().find((item) => item.id === "planned-past")?.status,
  ).toBe("PLANNED");
});

test("la semaine totalement vide reste complète à tous les breakpoints", async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 900 });
  await mockPlanning(page, { activities: [] });
  await page.goto("/calendrier", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "À imaginer" })).toBeVisible();
  await expect(page.getByText("Aucune sortie programmée.")).toBeVisible();
  const weeklySummary = page.getByLabel("Résumé de la semaine");
  await expect(weeklySummary.getByText("0 km")).toBeVisible();
  await expect(weeklySummary.getByText("0 min")).toBeVisible();
  await expect(weeklySummary.getByText("0", { exact: true })).toBeVisible();
  await expect(weeklySummary.getByText("0/7", { exact: true })).toBeVisible();
  await expect(
    page.locator("[data-day]").filter({ hasText: "Journée libre" }),
  ).toHaveCount(7);

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1512, height: 982 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await expectNoHorizontalOverflow(page);
  }
});

test("le chargement et le retry utilisent des états intégrés", async ({
  page,
}) => {
  const mock = await mockPlanning(page, { delay: 450, startInError: true });
  await page.goto("/calendrier", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Chargement du planning…")).toBeVisible();
  await expect(
    page.getByText("Le planning n’a pas pu rejoindre ton carnet."),
  ).toBeVisible({ timeout: 15_000 });
  mock.recover();
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(
    page.getByRole("heading", { name: "Sept jours pour trouver ton rythme." }),
  ).toBeVisible();
});

test("le mobile affiche une liste verticale de sept fiches sans débordement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPlanning(page);
  await page.goto("/calendrier", { waitUntil: "domcontentloaded" });

  const dayCards = page.locator("[data-day]");
  await expect(dayCards).toHaveCount(7);
  await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
  const positions = await dayCards.evaluateAll((cards) =>
    cards.map((card) => {
      const bounds = card.getBoundingClientRect();
      return { x: Math.round(bounds.x), y: Math.round(bounds.y) };
    }),
  );
  expect(new Set(positions.map((position) => position.x)).size).toBe(1);
  expect(positions[6].y).toBeGreaterThan(positions[0].y);
  const cardSizes = await dayCards.evaluateAll((cards) =>
    cards.map((card) => {
      const bounds = card.getBoundingClientRect();
      return { height: bounds.height, width: bounds.width };
    }),
  );
  expect(new Set(cardSizes.map(({ width }) => Math.round(width))).size).toBe(1);
  expect(
    Math.min(...cardSizes.map(({ height }) => height)),
  ).toBeGreaterThanOrEqual(300);

  const touchTargets = page.locator(
    '[data-day] button, [data-day] a[aria-label^="Planifier une sortie"]',
  );
  const touchTargetSizes = await touchTargets.evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return Math.min(bounds.width, bounds.height);
    }),
  );
  expect(Math.min(...touchTargetSizes)).toBeGreaterThanOrEqual(44);
  await expectNoHorizontalOverflow(page);

  await page.screenshot({
    path: "/tmp/hovren-planning-mobile-top.png",
    fullPage: true,
  });

  await page.getByLabel("Navigation du planning").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/tmp/hovren-planning-mobile-navigation.png",
    fullPage: true,
  });

  await dayCards.first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/tmp/hovren-planning-mobile-calendar.png",
    fullPage: true,
  });
});
