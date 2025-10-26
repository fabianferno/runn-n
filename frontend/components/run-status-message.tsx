"use client"

import { motion } from "framer-motion"

interface RunStatusMessageProps {
  isRunning: boolean
  isPaused: boolean
  distance: number
  hasPermission: boolean | null
}

export function RunStatusMessage({ isRunning, isPaused, distance, hasPermission }: RunStatusMessageProps) {
  if (!isRunning && distance === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground text-center max-w-xs"
      >
        {hasPermission === null
          ? "Checking location permission..."
          : hasPermission
            ? "Ready to run! Press Start to begin tracking."
            : "Enable location access to track your run."}
      </motion.p>
    )
  }

  if (isRunning) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-accent text-center animate-pulse"
      >
        {isPaused ? "Run paused" : "Tracking your run..."}
      </motion.p>
    )
  }

  return null
}
