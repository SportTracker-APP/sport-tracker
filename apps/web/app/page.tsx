import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/landing-page";

export const metadata: Metadata = {
  metadataBase: new URL("https://hovren.fr"),
  title: "HOVREN — Ton carnet outdoor",
  description:
    "Suis tes sorties, synchronise tes activités, découvre tes sommets et construis ton carnet d’exploration outdoor avec HOVREN.",
  alternates: {
    canonical: "https://hovren.fr",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "HOVREN — Ton carnet outdoor",
    description:
      "Tes sorties deviennent ton carnet outdoor : traces, sommets, progression et souvenirs d’aventure.",
    url: "https://hovren.fr",
    siteName: "HOVREN",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "https://hovren.fr/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "HOVREN — Ton carnet outdoor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HOVREN — Ton carnet outdoor",
    description:
      "Tes sorties deviennent ton carnet outdoor : traces, sommets, progression et souvenirs d’aventure.",
    images: ["https://hovren.fr/twitter-image.png"],
  },
};

export default function PublicHomePage() {
  return <LandingPage />;
}
