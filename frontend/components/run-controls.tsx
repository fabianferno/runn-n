"use client";

import { motion } from "framer-motion";
import { Play, Pause, Square } from "lucide-react";

interface RunControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function RunControls({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onStop,
}: RunControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex gap-4 w-full"
    >
      {!isRunning ? (
        <button
          onClick={onStart}
          className="flex-1  neumorphic-button bg-accent text-primary-foreground font-bold py-4 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
        >
          <Play className="w-5 h-5" />
          Start
        </button>
      ) : (
        <>
          <button
            onClick={onPause}
            className="flex-1 neumorphic-button bg-primary text-primary-foreground font-bold py-4 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            {isPaused ? (
              <Play className="w-5 h-5" />
            ) : (
              <Pause className="w-5 h-5" />
            )}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={onStop}
            className="flex-1 neumorphic-button bg-destructive text-destructive-foreground font-bold py-4 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            <Square className="w-5 h-5" />
            Stop
          </button>
        </>
      )}
    </motion.div>
  );
}
