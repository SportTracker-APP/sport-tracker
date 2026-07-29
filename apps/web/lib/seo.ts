import type { Metadata } from "next";

export const SITE_URL = "https://hovren.fr";
export const SITE_NAME = "HOVREN";
export const SITE_LOCALE = "fr_FR";
export const DEFAULT_TITLE = "HOVREN — Ton carnet outdoor";
export const SEO_DESCRIPTION =
  "HOVREN est ton carnet d’exploration outdoor : synchronise tes sorties, conserve tes traces GPS, découvre tes sommets et suis ta progression en randonnée ou trail.";
export const SOCIAL_DESCRIPTION =
  "Tes sorties deviennent ton carnet outdoor : traces, sommets, progression et souvenirs d’aventure.";
export const OPEN_GRAPH_IMAGE_URL = `${SITE_URL}/opengraph-image.png`;
export const TWITTER_IMAGE_URL = `${SITE_URL}/twitter-image.png`;

export const PUBLIC_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    "max-image-preview": "none",
    "max-snippet": 0,
    "max-video-preview": 0,
  },
};

type PublicMetadataOptions = {
  path: "/" | "/conditions" | "/confidentialite";
  title: string;
  description: string;
  socialTitle?: string;
  socialDescription?: string;
};

function absoluteUrl(path: PublicMetadataOptions["path"]) {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export function createPublicMetadata({
  path,
  title,
  description,
  socialTitle = title,
  socialDescription = description,
}: PublicMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: url,
    },
    robots: PUBLIC_ROBOTS,
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: "website",
      images: [
        {
          url: OPEN_GRAPH_IMAGE_URL,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: `${SITE_NAME} — Ton carnet outdoor`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@hovrenapp",
      creator: "@hovrenapp",
      title: socialTitle,
      description: socialDescription,
      images: [TWITTER_IMAGE_URL],
    },
  };
}
