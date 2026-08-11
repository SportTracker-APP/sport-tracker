import { expect, test, type Page, type Route } from "@playwright/test";

const mockUser = {
  id: "settings-user",
  firstName: "Camille",
  email: "camille@example.test",
  role: "USER",
  avatarUrl: null,
};

const responsiveViewports = [
  { width: 1920, height: 1080 },
  { width: 1512, height: 982 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
];

async function fulfillUser(route: Route, user = mockUser) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(user),
  });
}

async function mockSettingsShell(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?tawk\.to\//, async (route) =>
    route.abort(),
  );
  await page.route("**/users/me", async (route) => fulfillUser(route));
  await page.route("**/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "e2e-refreshed-token",
        user: mockUser,
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
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));

  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
}

async function expectSettingsSettled(page: Page) {
  const heading = page.getByRole("heading", { level: 1, name: "Paramètres" });
  await expect(
    heading.locator("xpath=ancestor::header[1]/parent::*"),
  ).toHaveCSS("opacity", "1");
  await expect(
    page
      .getByRole("heading", { level: 2, name: "Profil" })
      .locator("xpath=ancestor::section[1]/parent::*"),
  ).toHaveCSS("opacity", "1");
}

test("le profil et le mot de passe conservent leurs actions et validations", async ({
  page,
}) => {
  await mockSettingsShell(page);
  let profilePayload: unknown = null;
  let passwordPayload: unknown = null;

  await page.route("**/users/profile", async (route) => {
    profilePayload = route.request().postDataJSON();
    await fulfillUser(route, { ...mockUser, firstName: "Camille des Aravis" });
  });
  await page.route("**/users/password", async (route) => {
    passwordPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Mot de passe mis à jour" }),
    });
  });

  await page.goto("/parametres", { waitUntil: "domcontentloaded" });
  await expectSettingsSettled(page);

  const firstName = page.getByLabel("Prénom");
  await expect(firstName).toHaveValue("Camille");
  await expect(page.getByLabel("Email")).toBeDisabled();
  await firstName.fill("Camille des Aravis");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect
    .poll(() => profilePayload)
    .toEqual({ firstName: "Camille des Aravis" });

  await page.getByLabel("Mot de passe actuel").fill("mot-de-passe-actuel");
  await page.getByLabel("Nouveau mot de passe").fill("nouveau-secret");
  await page.getByLabel("Confirmation").fill("autre-secret");
  await page.getByRole("button", { name: "Modifier le mot de passe" }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: "Les mots de passe ne correspondent pas.",
    }),
  ).toHaveText("Les mots de passe ne correspondent pas.");
  expect(passwordPayload).toBeNull();

  await page.getByLabel("Confirmation").fill("nouveau-secret");
  await page.getByRole("button", { name: "Modifier le mot de passe" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Mot de passe mis à jour avec succès.",
  );
  expect(passwordPayload).toEqual({
    currentPassword: "mot-de-passe-actuel",
    newPassword: "nouveau-secret",
  });
});

test("l’avatar se synchronise après un seul upload et explique les formats Mac", async ({
  page,
}) => {
  await mockSettingsShell(page);
  let uploadAttempts = 0;
  let profilePatchAttempts = 0;

  await page.route("**/users/profile", async (route) => {
    profilePatchAttempts += 1;
    await fulfillUser(route);
  });
  await page.route("**/upload/avatar", async (route) => {
    uploadAttempts += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        avatarUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4j8AAAAASUVORK5CYII=",
      }),
    });
  });

  await page.goto("/parametres", { waitUntil: "domcontentloaded" });
  await expectSettingsSettled(page);

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4j8AAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await expect(page.getByRole("status")).toHaveText(
    "Photo de profil mise à jour.",
  );
  expect(uploadAttempts).toBe(1);
  expect(profilePatchAttempts).toBe(0);

  await fileInput.setInputFiles({
    name: "portrait.heic",
    mimeType: "image/heic",
    buffer: Buffer.from("mock-heic-file"),
  });
  await expect(
    page.getByRole("alert").filter({
      hasText: "Le format HEIC/HEIF n’est pas encore pris en charge",
    }),
  ).toContainText("Le format HEIC/HEIF n’est pas encore pris en charge");
  expect(uploadAttempts).toBe(1);
});

test("une erreur d’upload est visible et ne conserve pas un faux aperçu", async ({
  page,
}) => {
  await mockSettingsShell(page);
  await page.route("**/upload/avatar", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Stockage temporairement indisponible" }),
    });
  });

  await page.goto("/parametres", { waitUntil: "domcontentloaded" });
  await expectSettingsSettled(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4j8AAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await expect(
    page.getByRole("alert").filter({
      hasText: "Stockage temporairement indisponible",
    }),
  ).toHaveText("Stockage temporairement indisponible");
  await expect(
    page
      .getByRole("button", { name: "Modifier la photo de profil" })
      .locator("xpath=../div[1]"),
  ).toContainText("C");
});

test("le menu profil devient un accès personnel sans choix de thème", async ({
  page,
}) => {
  await mockSettingsShell(page);

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/parametres", { waitUntil: "domcontentloaded" });
    await expectSettingsSettled(page);

    const accountTrigger = page.getByRole("button", {
      name: "Ouvrir le menu du compte",
    });
    await accountTrigger.click();

    const accountMenu = page.getByRole("menu", { name: "Menu du compte" });
    await expect(accountMenu).toBeVisible();
    await expect(accountMenu).toHaveCSS("opacity", "1");
    await expect(
      accountMenu.getByText("Camille", { exact: true }),
    ).toBeVisible();
    await expect(accountMenu.getByText("camille@example.test")).toBeVisible();
    await expect(accountMenu.getByText("Mon espace")).toBeVisible();
    await expect(
      accountMenu.getByRole("menuitem", { name: "Mon Refuge" }),
    ).toHaveAttribute("href", "/refuge");
    await expect(
      accountMenu.getByRole("menuitem", { name: "Mes sommets" }),
    ).toHaveAttribute("href", "/sommets");
    await expect(accountMenu.getByText("Apparence")).toHaveCount(0);
    await expect(accountMenu.getByText("Nature", { exact: true })).toHaveCount(
      0,
    );
    await expect(accountMenu.getByText("Violet", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      accountMenu.getByText("Altitude", { exact: true }),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await page.screenshot({
      path: `/tmp/hovren-profile-menu-${viewport.width}.png`,
    });

    await page.keyboard.press("Escape");
    await expect(accountMenu).toBeHidden();
    await expect(accountTrigger).toBeFocused();
  }
});

test("la page reste claire et sans débordement à tous les breakpoints", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockSettingsShell(page);

  for (const viewport of responsiveViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/parametres", { waitUntil: "domcontentloaded" });
    await expectSettingsSettled(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Paramètres" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Profil" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Sécurité" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sauvegarder" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Modifier le mot de passe" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if (
      viewport.width === 1440 ||
      viewport.width === 768 ||
      viewport.width === 390
    ) {
      await page.screenshot({
        path: `/tmp/hovren-settings-${viewport.width}.png`,
      });
    }
  }
});
