"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MapContainer } from "@/components/map-container";
import { RunTimerDisplay } from "@/components/run-timer-display";
import { RunControls } from "@/components/run-controls";
import { RunStatusMessage } from "@/components/run-status-message";

export default function RunPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [pace, setPace] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<GeolocationCoordinates | null>(null);

  // Request geolocation permission
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setHasPermission(true),
        () => setHasPermission(false)
      );
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  // Geolocation tracking effect
  useEffect(() => {
    if (isRunning && !isPaused && hasPermission) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const currentLocation = position.coords;
          if (lastLocationRef.current) {
            const lat1 = lastLocationRef.current.latitude;
            const lon1 = lastLocationRef.current.longitude;
            const lat2 = currentLocation.latitude;
            const lon2 = currentLocation.longitude;

            // Haversine formula for distance calculation
            const R = 6371; // Earth's radius in km
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distanceKm = R * c;
            const distanceM = distanceKm * 1000;

            if (distanceM > 5) {
              // Only count if more than 5 meters
              setDistance((prev) => prev + distanceM);
            }
          }
          lastLocationRef.current = currentLocation;
        },
        () => {
          setHasPermission(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isRunning, isPaused, hasPermission]);

  // Calculate pace (minutes per km)
  useEffect(() => {
    if (distance > 0 && elapsedTime > 0) {
      const distanceKm = distance / 1000;
      const timeMinutes = elapsedTime / 60;
      const calculatedPace = timeMinutes / distanceKm;
      setPace(calculatedPace);
    }
  }, [distance, elapsedTime]);

  const handleStart = () => {
    if (!hasPermission) {
      alert("Location permission is required to track your run");
      return;
    }
    setIsRunning(true);
    setIsPaused(false);
    lastLocationRef.current = null;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-accent">Run</h1>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
        {/* Permission warning */}
        {hasPermission === false && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm text-center"
          >
            Location permission denied. Enable it in settings to track your run.
          </motion.div>
        )}

        <MapContainer />

        {/* Timer display */}
        <RunTimerDisplay
          elapsedTime={elapsedTime}
          distance={distance}
          pace={pace}
        />

        {/* Control buttons */}
        <RunControls
          isRunning={isRunning}
          isPaused={isPaused}
          onStart={handleStart}
          onPause={handlePause}
          onStop={handleStop}
        />

        {/* Status message */}
        <RunStatusMessage
          isRunning={isRunning}
          isPaused={isPaused}
          distance={distance}
          hasPermission={hasPermission}
        />
      </div>
    </div>
  );
}
