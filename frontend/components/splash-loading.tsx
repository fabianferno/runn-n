"use client";

import { motion } from "framer-motion";

export function SplashLoading() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-8 px-6">
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="text-5xl font-bold text-accent mb-2">TouchGrass</div>
        <div className="text-sm text-muted-foreground tracking-widest">
          GET OUTSIDE
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        className="flex gap-2"
      >
        <div className="w-2 h-2 rounded-full bg-accent" />
        <div className="w-2 h-2 rounded-full bg-accent" />
        <div className="w-2 h-2 rounded-full bg-accent" />
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        className="text-xs text-muted-foreground"
      >
        Preparing your run...
      </motion.div>
    </div>
  );
}
