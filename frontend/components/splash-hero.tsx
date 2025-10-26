"use client";

import { motion } from "framer-motion";

export function SplashHero() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="text-center"
    >
      <div className="text-6xl font-bold text-accent mb-4">TouchGrass</div>

      <div className="text-lg text-muted-foreground mb-8">
        Run. Track. Compete.
      </div>
    </motion.div>
  );
}
