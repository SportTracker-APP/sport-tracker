import Image from "next/image";

import styles from "../exploration.module.css";

const ALLOWED_IMAGE_HOSTS = new Set([
  "hkzkzprcofhanjendhct.supabase.co",
  "images.pexels.com",
  "commons.wikimedia.org",
  "upload.wikimedia.org",
  "dgtzuqphqg23d.cloudfront.net",
]);

function isAllowedImage(url: string | null) {
  if (!url) return false;
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
  if (!isAllowedImage(src)) {
    return (
      <div className={styles.routePhotoFallback} role="img" aria-label={alt}>
        <svg viewBox="0 0 500 230" aria-hidden="true">
          <path d="m-20 220 116-86 55 43 83-113 76 99 65-66 145 123H-20Z" />
          <path d="M54 219c55-34 97-45 147-32 56 15 96 2 141-22 43-23 89-22 139 6" />
          <path d="M178 125c22-20 34-38 56-61m0 0 22 29" />
        </svg>
        <span>Extrait du carnet HOVREN</span>
      </div>
    );
  }

  return (
    <Image
      src={src || ""}
      alt={alt}
      fill
      sizes="(max-width: 900px) 100vw, 380px"
      priority={priority}
      className={styles.routePhotoImage}
    />
  );
}
