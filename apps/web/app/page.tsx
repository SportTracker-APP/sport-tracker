import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/landing-page";

export const metadata: Metadata = {
  title: "HOVREN — Ton carnet outdoor",
  description:
    "Suis tes sorties, découvre tes sommets et construis ton carnet d’exploration outdoor avec HOVREN.",
  openGraph: {
    title: "HOVREN — Ton carnet outdoor",
    description:
      "Suis tes sorties, découvre tes sommets et construis ton carnet d’exploration outdoor avec HOVREN.",
    url: "https://hovren.fr",
    siteName: "HOVREN",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HOVREN — Ton carnet outdoor",
    description:
      "Suis tes sorties, découvre tes sommets et construis ton carnet d’exploration outdoor avec HOVREN.",
  },
};

export default function PublicHomePage() {
  return <LandingPage />;
}
