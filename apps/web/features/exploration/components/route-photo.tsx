import Image from "next/image";

import styles from "../exploration.module.css";

const ALLOWED_IMAGE_HOSTS = new Set([
  "hkzkzprcofhanjendhct.supabase.co",
  "images.pexels.com",
  "commons.wikimedia.org",
  "upload.wikimedia.org",
  "dgtzuqphqg23d.cloudfront.net",
]);

function isAllowedImage(url: string | null): url is string {
  if (!url) return false;
  if (url.startsWith("/landing/") || url.startsWith("/summits/")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function RoutePhoto({
  src,
  alt,
  priority = false,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
}) {
  const resolvedSrc = isAllowedImage(src)
    ? src
    : "/landing/alpine-forest-card.png";

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      sizes="(max-width: 900px) 100vw, 380px"
      priority={priority}
      className={styles.routePhotoImage}
    />
  );
}
