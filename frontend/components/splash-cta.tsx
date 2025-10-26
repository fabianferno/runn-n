"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function SplashCTA() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-xs"
    >
      <Link href="/run">
        <button className="w-full neumorphic-button bg-accent text-foreground font-bold text-lg py-4 hover:shadow-xl transition-all">
          Start Running
        </button>
      </Link>
    </motion.div>
  );
}
