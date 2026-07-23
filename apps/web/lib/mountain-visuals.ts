const EDITORIAL_MOUNTAIN_IMAGES = [
  "/summits/mont-veyrier.webp",
  "/summits/pointe-de-talamarche.webp",
  "/summits/la-tournette.webp",
  "/summits/pointe-percee.webp",
  "/summits/montagne-de-sous-dine.webp",
  "/summits/le-mole.webp",
] as const;

const APPROVED_SUMMIT_IMAGE_HOSTS = new Set([
  "commons.wikimedia.org",
  "upload.wikimedia.org",
  "images.pexels.com",
]);

function getStableIndex(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }

  return hash % EDITORIAL_MOUNTAIN_IMAGES.length;
}

export function getEditorialMountainImage(key: string) {
  return EDITORIAL_MOUNTAIN_IMAGES[getStableIndex(key)];
}

export function isApprovedSummitImageUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  if (value.startsWith("/landing/") || value.startsWith("/summits/")) {
    return true;
  }

  try {
    return APPROVED_SUMMIT_IMAGE_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}
