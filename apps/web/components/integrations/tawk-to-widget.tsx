"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import styles from "./tawk-to-widget.module.css";

type TawkApi = {
  autoStart?: boolean;
  customStyle?: {
    visibility: {
      desktop: TawkWidgetPosition;
      mobile: TawkWidgetPosition;
    };
  };
  hideWidget?: () => void;
  maximize?: () => void;
  minimize?: () => void;
  onChatMaximized?: () => void;
  onChatMinimized?: () => void;
  onLoad?: () => void;
  showWidget?: () => void;
  start?: (options?: { showWidget?: boolean }) => void;
};

type TawkWidgetPosition = {
  position: "br";
  xOffset: number;
  yOffset: number;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

const TAWK_SCRIPT_URL =
  "https://embed.tawk.to/6a60c831ff3acf1d4aaccba3/1ju50s0ah";
const TAWK_SCRIPT_ID = "tawk-to-widget";

const LANDING_PATHS = new Set(["/", "/landing-page-v1"]);

function isLandingPath(pathname: string) {
  return LANDING_PATHS.has(pathname);
}

function configureWidgetPosition(): TawkApi {
  const tawkApi = window.Tawk_API ?? {};

  tawkApi.autoStart = false;
  tawkApi.customStyle = {
    visibility: {
      desktop: {
        position: "br",
        xOffset: 20,
        yOffset: 20,
      },
      mobile: {
        position: "br",
        xOffset: 14,
        yOffset: 96,
      },
    },
  };
  window.Tawk_API = tawkApi;

  return tawkApi;
}

function keepNativeWidgetHidden() {
  window.Tawk_API?.minimize?.();
  window.Tawk_API?.hideWidget?.();
}

export function TawkToWidget() {
  const pathname = usePathname();
  const isLanding = isLandingPath(pathname);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (isLanding) {
      keepNativeWidgetHidden();
      return;
    }

    const tawkApi = configureWidgetPosition();
    window.Tawk_LoadStart = window.Tawk_LoadStart ?? new Date();
    tawkApi.onLoad = () => {
      keepNativeWidgetHidden();
    };
    tawkApi.onChatMinimized = () => {
      keepNativeWidgetHidden();
      setIsOpening(false);
    };

    const existingScript = document.getElementById(TAWK_SCRIPT_ID);

    if (existingScript) {
      keepNativeWidgetHidden();
      return;
    }

    const script = document.createElement("script");
    script.id = TAWK_SCRIPT_ID;
    script.src = TAWK_SCRIPT_URL;
    script.async = true;
    script.charset = "UTF-8";
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => {
      keepNativeWidgetHidden();
    });
    document.head.appendChild(script);
  }, [isLanding]);

  const openChat = useCallback(() => {
    if (isOpening) {
      return;
    }

    setIsOpening(true);
    const tawkApi = configureWidgetPosition();

    tawkApi.onChatMaximized = () => {
      setIsOpening(false);
    };
    tawkApi.onChatMinimized = () => {
      keepNativeWidgetHidden();
      setIsOpening(false);
    };

    tawkApi.start?.({ showWidget: true });
    tawkApi.showWidget?.();

    window.setTimeout(() => {
      window.Tawk_API?.showWidget?.();
      window.Tawk_API?.maximize?.();
      setIsOpening(false);
    }, 200);
  }, [isOpening]);

  if (isLanding) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.launcher}
      onClick={openChat}
      aria-label="Ouvrir l’aide HOVREN"
      title="Besoin d’aide ?"
      disabled={isOpening}
    >
      <MessageCircle aria-hidden="true" />
    </button>
  );
}
