"use client";

import { motion } from "framer-motion";

interface RunTimerDisplayProps {
  elapsedTime: number;
  distance: number;
  pace: number;
}

export function RunTimerDisplay({
  elapsedTime,
  distance,
  pace,
}: RunTimerDisplayProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatPace = (minutesPerKm: number) => {
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}/km`;
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="neumorphic w-full p-8 text-center"
    >
      <div className="text-muted-foreground text-sm mb-2">Elapsed Time</div>
      <div className="text-5xl font-bold text-accent font-mono mb-6">
        {formatTime(elapsedTime)}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="neumorphic-inset p-4">
          <div className="text-muted-foreground text-xs mb-1">Distance</div>
          <div className="text-2xl font-bold text-accent">
            {formatDistance(distance)}
          </div>
        </div>
        <div className="neumorphic-inset p-4">
          <div className="text-muted-foreground text-xs mb-1">Hex Captured</div>
          <div className="text-lg font-bold text-accent">
            {distance > 0 ? "1" : "0"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
