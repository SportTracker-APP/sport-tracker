"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type TawkApi = {
  hideWidget?: () => void;
  showWidget?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

const TAWK_SCRIPT_URL =
  "https://embed.tawk.to/6a60c831ff3acf1d4aaccba3/1ju50s0ah";

const LANDING_PATHS = new Set(["/", "/landing-page-v1"]);

function isLandingPath(pathname: string) {
  return LANDING_PATHS.has(pathname);
}

export function TawkToWidget() {
  const pathname = usePathname();
  const isLanding = isLandingPath(pathname);

  useEffect(() => {
    if (isLanding) {
      window.Tawk_API?.hideWidget?.();
      return;
    }

    window.Tawk_API = window.Tawk_API ?? {};
    window.Tawk_LoadStart = window.Tawk_LoadStart ?? new Date();
    window.Tawk_API.showWidget?.();
  }, [isLanding]);

  if (isLanding) {
    return null;
  }

  return (
    <Script
      id="tawk-to-widget"
      src={TAWK_SCRIPT_URL}
      strategy="afterInteractive"
      charSet="UTF-8"
      crossOrigin="anonymous"
      onLoad={() => {
        if (!isLandingPath(window.location.pathname)) {
          window.Tawk_API?.showWidget?.();
        }
      }}
    />
  );
}
