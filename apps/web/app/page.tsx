import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/landing-page";
import {
  createPublicMetadata,
  SEO_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_DESCRIPTION,
} from "@/lib/seo";

const siteTitle = "HOVREN — Le carnet des sommets";

export const metadata: Metadata = {
  ...createPublicMetadata({
    path: "/",
    title: siteTitle,
    description: SEO_DESCRIPTION,
    socialTitle: siteTitle,
    socialDescription: SOCIAL_DESCRIPTION,
  }),
  applicationName: SITE_NAME,
  keywords: [
    "HOVREN",
    "carnet outdoor",
    "application outdoor",
    "carnet d'aventures outdoor",
    "suivi de sorties outdoor",
    "carnet de randonnée",
    "suivi de sommets",
    "traces GPS randonnée",
    "application trail et randonnée",
    "Strava",
    "progression outdoor",
    "carnet de sommets",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Application outdoor",
};

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    name: SITE_NAME,
    alternateName: ["HOVREN.fr", "hovren.fr"],
    url: SITE_URL,
    description: SEO_DESCRIPTION,
    inLanguage: "fr-FR",
    publisher: {
      "@id": organizationId,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SEO_DESCRIPTION,
    inLanguage: "fr-FR",
    publisher: {
      "@id": organizationId,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    featureList: [
      "Synchronisation Strava",
      "Carnet de sommets",
      "Suivi des sorties outdoor",
      "Badges et progression",
      "Massifs explorés",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon.png`,
      width: 512,
      height: 512,
    },
    email: "contact@hovren.fr",
    sameAs: ["https://x.com/hovrenapp"],
  },
] as const;

export default function PublicHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}
