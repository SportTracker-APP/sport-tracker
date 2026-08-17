"use client";

import { motion, useReducedMotion } from "framer-motion";

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
};

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.18,
        delay: shouldReduceMotion ? 0 : Math.min(delay, 0.08),
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
