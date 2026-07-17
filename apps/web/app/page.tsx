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
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
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
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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
    url: siteUrl,
    description: siteDescription,
    inLanguage: "fr-FR",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HOVREN",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: siteDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
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
