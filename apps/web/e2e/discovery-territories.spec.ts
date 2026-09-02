import { expect, test, type Page } from "@playwright/test";

async function mockAuthenticatedRefuge(page: Page) {
  const user = {
    id: "user-territories",
    firstName: "Camille",
    email: "camille@example.test",
    role: "USER",
  };

  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "territory-e2e-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, (route) =>
    route.abort(),
  );
  await page.route("**/users/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(user),
    }),
  );
  await page.route("**/users/me/geo-preferences", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ discovery: [], onboardingCompleted: true }),
    }),
  );
  await page.route("**/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accessToken: "territory-e2e-token", user }),
    }),
  );
  await page.route("**/strava/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ connected: false }),
    }),
  );
  await page.route("**/activities**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/summits**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/goals**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

test("l’ancien onboarding territorial rejoint le Refuge", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockAuthenticatedRefuge(page);
  await page.goto("/onboarding/territoires", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/refuge$/);
  await expect(
    page.getByRole("heading", { name: "Où veux-tu explorer ?" }),
  ).toHaveCount(0);
});

test("la redirection reste propre et sans débordement sur iPhone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAuthenticatedRefuge(page);
  await page.goto("/onboarding/territoires", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/refuge$/);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        body: document.body.scrollWidth - window.innerWidth,
        document: document.documentElement.scrollWidth - window.innerWidth,
      })),
    )
    .toEqual({ body: 0, document: 0 });
});
