"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
};

function getIsNatureTheme() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.classList.contains("sport-theme-nature");
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  const [isNatureTheme, setIsNatureTheme] = useState(getIsNatureTheme);

  useEffect(() => {
    function updateThemeState() {
      setIsNatureTheme(getIsNatureTheme());
    }

    updateThemeState();

    const observer = new MutationObserver(updateThemeState);

    observer.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: isNatureTheme ? 4 : 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: isNatureTheme ? 0.18 : 0.5,
        delay: isNatureTheme ? Math.min(delay, 0.08) : delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
