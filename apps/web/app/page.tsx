import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/landing-page";

const siteUrl = "https://hovren.fr";
const siteTitle =
  "HOVREN — Carnet outdoor pour sorties, sommets et progression";
const siteDescription =
  "Suis tes sorties, synchronise tes activités, découvre tes sommets et construis ton carnet d’exploration outdoor avec HOVREN.";
const socialDescription =
  "Tes sorties deviennent ton carnet outdoor : traces, sommets, progression et souvenirs d’aventure.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "HOVREN",
  title: siteTitle,
  description: siteDescription,
  keywords: [
    "HOVREN",
    "carnet outdoor",
    "application outdoor",
    "suivi sorties",
    "sommets",
    "randonnée",
    "trail",
    "Strava",
    "progression outdoor",
    "carnet de sommets",
  ],
  authors: [{ name: "HOVREN", url: siteUrl }],
  creator: "HOVREN",
  publisher: "HOVREN",
  category: "Outdoor application",
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteTitle,
    description: socialDescription,
    url: siteUrl,
    siteName: "HOVREN",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: `${siteUrl}/opengraph-image.png`,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hovrenapp",
    creator: "@hovrenapp",
    title: siteTitle,
    description: socialDescription,
    images: [`${siteUrl}/twitter-image.png`],
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HOVREN",
    alternateName: "HOVREN.fr",
    url: siteUrl,
    description: siteDescription,
    inLanguage: "fr-FR",
    publisher: {
      "@type": "Organization",
      name: "HOVREN",
      url: siteUrl,
      email: "contact@hovren.fr",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HOVREN",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: siteDescription,
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
    name: "HOVREN",
    url: siteUrl,
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
          __html: JSON.stringify(structuredData),
        }}
      />
      <LandingPage />
    </>
  );
}
