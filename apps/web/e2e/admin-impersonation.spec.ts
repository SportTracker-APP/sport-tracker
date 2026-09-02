import { expect, test } from "@playwright/test";

const admin = {
  id: "admin-1",
  firstName: "Thibaut",
  email: "admin@example.test",
  role: "ADMIN",
};

const impersonation = {
  sessionId: "session-1",
  adminId: admin.id,
  adminEmail: admin.email,
  adminFirstName: admin.firstName,
  expiresAt: "2099-07-23T12:00:00.000Z",
};

const client = {
  id: "user-1",
  firstName: "Camille",
  email: "camille@example.test",
  role: "USER",
  avatarUrl: null,
  impersonation,
};

test("un admin accède au compte client puis quitte clairement le mode admin", async ({
  page,
}) => {
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
  await page.addInitScript(() => {
    if (!window.localStorage.getItem("accessToken")) {
      window.localStorage.setItem("accessToken", "admin-access-token");
    }
  });
  await page.route("**/users/me", async (route) => {
    const authorization = route.request().headers().authorization;
    const currentUser = authorization?.includes("client-access-token")
      ? client
      : admin;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(currentUser),
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
      body: JSON.stringify({ accessToken: "admin-access-token", user: admin }),
    });
  });
  await page.route("**/strava/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ connected: false }),
    });
  });
  await page.route("**/activities**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.route("**/summits**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.route("**/goals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.route("**/admin/metrics", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalUsers: 2,
        stravaConnections: 1,
        syncedActivities: 12,
        newUsersLast7Days: 1,
        lastSynchronizationAt: null,
        lastSynchronizationActivityTitle: null,
        lastSynchronizationUser: null,
      }),
    });
  });
  await page.route("**/admin/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          ...admin,
          lastName: null,
          isBlocked: false,
          createdAt: "2026-07-01T08:00:00.000Z",
          hasStrava: false,
          stravaUpdatedAt: null,
          activitiesCount: 0,
        },
        {
          ...client,
          impersonation: undefined,
          lastName: "Martin",
          isBlocked: false,
          createdAt: "2026-07-02T08:00:00.000Z",
          hasStrava: true,
          stravaUpdatedAt: "2026-07-20T08:00:00.000Z",
          activitiesCount: 12,
        },
      ]),
    });
  });
  await page.route("**/admin/users/user-1/impersonate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "client-access-token",
        user: client,
      }),
    });
  });
  await page.route("**/admin/impersonation/stop", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "restored-admin-token",
        user: admin,
      }),
    });
  });

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.goto("/admin");
  await page.getByRole("button", { name: "Gestion utilisateurs" }).click();
  const accessButton = page.getByRole("button", {
    name: "Accéder au compte",
  });
  await expect(accessButton).toBeVisible();
  await accessButton.click();

  await expect(page).toHaveURL(/\/refuge$/);
  await expect(page.getByText("Mode admin", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Vous consultez le compte de", { exact: false }),
  ).toContainText("Camille");
  await expect
    .poll(() =>
      page.evaluate(() => ({
        persistent: window.localStorage.getItem("accessToken"),
        delegated: window.sessionStorage.getItem(
          "hovren:admin-impersonation-token",
        ),
      })),
    )
    .toEqual({
      persistent: "admin-access-token",
      delegated: "client-access-token",
    });

  await page
    .getByRole("button", {
      name: "Quitter le mode admin et revenir à l’administration",
    })
    .click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        persistent: window.localStorage.getItem("accessToken"),
        delegated: window.sessionStorage.getItem(
          "hovren:admin-impersonation-token",
        ),
      })),
    )
    .toEqual({
      persistent: "restored-admin-token",
      delegated: null,
    });
});
