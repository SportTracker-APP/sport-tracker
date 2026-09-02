import { expect, test } from "@playwright/test";

test("le nouveau carnet présente les trois premières étapes sur mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "welcome-access-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "new-user",
        firstName: "Lou",
        email: "lou@example.test",
        role: "USER",
        needsWelcomeOnboarding: true,
      }),
    });
  });
  let completed = false;
  await page.route("**/users/me/onboarding/welcome", async (route) => {
    completed = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ completed: true }),
    });
  });
  await page.route("**/users/me/geo-preferences", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ discovery: [], onboardingCompleted: true }),
    });
  });
  await page.route("**/summits**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
  await page.route("**/strava/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ connected: false }),
    });
  });

  await page.goto("/bienvenue", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Bienvenue dans HOVREN." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connecte Strava" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Découvre tes sommets" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explore la carte" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    )
    .toBeLessThanOrEqual(1);

  await page
    .getByRole("button", { name: "Entrer directement dans mon refuge" })
    .click();
  await expect.poll(() => completed).toBe(true);
  await expect(page).toHaveURL(/\/refuge$/);
});
