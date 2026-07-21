import type { Metadata } from "next";

import { LandingPage } from "@/features/landing-v1/landing-page";

export const metadata: Metadata = {
  title: "Landing HOVREN V1",
  description: "Archive interne de la première landing publique HOVREN.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LandingPageV1Archive() {
  return <LandingPage />;
}
