import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  createPublicMetadata,
  OPEN_GRAPH_IMAGE_URL,
  PRIVATE_ROBOTS,
  SITE_URL,
  TWITTER_IMAGE_URL,
} from "@/lib/seo";

const require = createRequire(import.meta.url);

type HeaderDefinition = {
  source: string;
  headers: Array<{
    key: string;
    value: string;
  }>;
};

type NextConfigWithHeaders = {
  headers: () => Promise<HeaderDefinition[]>;
};

const nextConfig = require("../next.config.js") as NextConfigWithHeaders;

describe("SEO public HOVREN", () => {
  it("construit des metadata publiques avec canonical et apercus sociaux absolus", () => {
    const metadata = createPublicMetadata({
      path: "/conditions",
      title: "Conditions d’utilisation de HOVREN",
      description: "Description publique",
    });

    expect(metadata.alternates).toEqual({
      canonical: `${SITE_URL}/conditions`,
    });
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
    expect(metadata.openGraph).toMatchObject({
      url: `${SITE_URL}/conditions`,
      images: [
        expect.objectContaining({
          url: OPEN_GRAPH_IMAGE_URL,
          width: 1200,
          height: 630,
        }),
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [TWITTER_IMAGE_URL],
    });
  });

  it("garde les routes non publiques privees par defaut", () => {
    expect(PRIVATE_ROBOTS).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
    });
  });

  it("ne publie que les trois pages publiques dans le sitemap", () => {
    const entries = sitemap();

    expect(entries.map((entry) => entry.url)).toEqual([
      SITE_URL,
      `${SITE_URL}/conditions`,
      `${SITE_URL}/confidentialite`,
    ]);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(
      true,
    );
  });

  it("declare le domaine canonique et le sitemap dans robots.txt", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      host: SITE_URL,
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });

  it("ajoute une protection HTTP aux routes privees et d'authentification", async () => {
    const headerDefinitions = await nextConfig.headers();
    const protectedSources = headerDefinitions
      .filter((definition) =>
        definition.headers.some(
          (header) =>
            header.key === "X-Robots-Tag" && header.value.includes("noindex"),
        ),
      )
      .map((definition) => definition.source);

    expect(protectedSources).toEqual(
      expect.arrayContaining([
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/refuge",
        "/sommets",
        "/activites",
        "/activites/:path*",
        "/admin",
        "/integrations/:path*",
        "/landing-page-v1",
        "/theme-lab",
      ]),
    );
  });
});
