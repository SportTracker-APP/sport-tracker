const EDITORIAL_MOUNTAIN_IMAGES = [
  "/summits/mont-veyrier.webp",
  "/summits/pointe-de-talamarche.webp",
  "/summits/la-tournette.webp",
  "/summits/pointe-percee.webp",
  "/summits/montagne-de-sous-dine.webp",
  "/summits/le-mole.webp",
] as const;

const EDITORIAL_ACTIVITY_IMAGES = [
  "/landing/summit-discovery-wildflowers.jpg",
  "/landing/alpine-forest-card.png",
  "/summits/lanfonnet.webp",
  "/summits/mont-veyrier.webp",
  "/summits/mont-baron.webp",
  "/summits/roc-de-chere.webp",
  "/summits/semnoz.webp",
  "/summits/le-mole.webp",
  "/summits/montagne-de-sous-dine.webp",
] as const;

const EDITORIAL_INDOOR_ACTIVITY_IMAGES = [
  "/landing/alpine-forest-card.png",
  "/landing/summit-discovery-wildflowers.jpg",
  "/summits/roc-de-chere.webp",
  "/summits/semnoz.webp",
  "/summits/mont-baron.webp",
] as const;

const INDOOR_SPORTS = new Set([
  "FITNESS",
  "GYM",
  "STRENGTH_TRAINING",
  "WEIGHT_TRAINING",
  "WORKOUT",
  "YOGA",
]);

const APPROVED_SUMMIT_IMAGE_HOSTS = new Set([
  "commons.wikimedia.org",
  "upload.wikimedia.org",
]);

function getStableIndex(value: string, length: number) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }

  return hash % length;
}

export function getEditorialMountainImage(key: string) {
  return EDITORIAL_MOUNTAIN_IMAGES[
    getStableIndex(key, EDITORIAL_MOUNTAIN_IMAGES.length)
  ];
}

export function getEditorialActivityImage(key: string, sport?: string | null) {
  const normalizedSport = sport?.trim().toUpperCase() ?? "";
  const images = INDOOR_SPORTS.has(normalizedSport)
    ? EDITORIAL_INDOOR_ACTIVITY_IMAGES
    : EDITORIAL_ACTIVITY_IMAGES;

  return images[getStableIndex(`${normalizedSport}:${key}`, images.length)];
}

export function isApprovedSummitImageUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  if (value.startsWith("/landing/") || value.startsWith("/summits/")) {
    return true;
  }

  try {
    const hostname = new URL(value).hostname.toLowerCase();

    return (
      APPROVED_SUMMIT_IMAGE_HOSTS.has(hostname) ||
      hostname.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}
