"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.18,
          ease: "easeOut",
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
