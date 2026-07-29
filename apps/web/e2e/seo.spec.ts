import { expect, test } from "@playwright/test";

test.describe("SEO public HOVREN", () => {
  test("la landing est indexable, canonique et semantique", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(
      "HOVREN — Carnet outdoor pour sorties, sommets et progression",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /carnet d’exploration outdoor/i,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /index, follow/i,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://hovren.fr",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://hovren.fr/opengraph-image.png",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(
      /Tes sorties deviennent\s*ton carnet outdoor\./,
    );
  });

  test("les routes privees et d'authentification restent hors index", async ({
    request,
  }) => {
    for (const path of ["/login", "/refuge", "/sommets", "/admin"]) {
      const response = await request.get(path);
      const html = await response.text();
      const robotsContent = html.match(
        /<meta[^>]+name="robots"[^>]+content="([^"]+)"/i,
      )?.[1];

      expect(response.headers()["x-robots-tag"]).toContain("noindex");
      expect(robotsContent).toContain("noindex");
      expect(robotsContent).toContain("nofollow");
    }
  });

  test("robots et sitemap exposent uniquement le perimetre public", async ({
    request,
  }) => {
    const robotsResponse = await request.get("/robots.txt");
    const robotsBody = await robotsResponse.text();
    const sitemapResponse = await request.get("/sitemap.xml");
    const sitemapBody = await sitemapResponse.text();

    expect(robotsResponse.ok()).toBe(true);
    expect(robotsBody).toContain("Host: https://hovren.fr");
    expect(robotsBody).toContain("Sitemap: https://hovren.fr/sitemap.xml");

    expect(sitemapResponse.ok()).toBe(true);
    expect(sitemapBody).toContain("<loc>https://hovren.fr</loc>");
    expect(sitemapBody).toContain("<loc>https://hovren.fr/conditions</loc>");
    expect(sitemapBody).toContain(
      "<loc>https://hovren.fr/confidentialite</loc>",
    );
    expect(sitemapBody).not.toContain("/refuge");
    expect(sitemapBody).not.toContain("/login");
    expect(sitemapBody).not.toContain("<lastmod>");
  });
});
