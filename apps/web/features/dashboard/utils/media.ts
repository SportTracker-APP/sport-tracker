import type { Activity as SportActivity } from "@/lib/activities";

import type { ActivityWithMedia } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeHttpUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function findBestPhotoUrl(value: unknown, depth = 0): string | null {
  if (depth > 5) {
    return null;
  }

  const directUrl = normalizeHttpUrl(value);

  if (directUrl) {
    return directUrl;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedUrl = findBestPhotoUrl(item, depth + 1);

      if (nestedUrl) {
        return nestedUrl;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const preferredKeys = [
    "2048",
    "1536",
    "1024",
    "600",
    "large",
    "original",
    "url",
    "imageUrl",
    "photoUrl",
    "coverImageUrl",
    "primary",
    "urls",
  ];

  for (const key of preferredKeys) {
    if (!(key in value)) {
      continue;
    }

    const nestedUrl = findBestPhotoUrl(value[key], depth + 1);

    if (nestedUrl) {
      return nestedUrl;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nestedUrl = findBestPhotoUrl(nestedValue, depth + 1);

    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return null;
}

export function getActivityPhotoUrl(activity: SportActivity) {
  const activityWithMedia = activity as ActivityWithMedia;
  const directCandidates: unknown[] = [
    activityWithMedia.stravaPhotoUrl,
    activityWithMedia.photoUrl,
    activityWithMedia.imageUrl,
    activityWithMedia.coverImageUrl,
    activityWithMedia.thumbnailUrl,
  ];

  for (const candidate of directCandidates) {
    const directUrl = normalizeHttpUrl(candidate);

    if (directUrl) {
      return directUrl;
    }
  }

  if (Array.isArray(activityWithMedia.photoUrls)) {
    for (const candidate of activityWithMedia.photoUrls) {
      const url = normalizeHttpUrl(candidate);

      if (url) {
        return url;
      }
    }
  }

  return findBestPhotoUrl(activityWithMedia.photos);
}
