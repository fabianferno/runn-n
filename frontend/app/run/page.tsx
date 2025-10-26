"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { MapComponent } from "@/components/Map/MapComponent";
import { RunTimerDisplay } from "@/components/run-timer-display";
import { RunControls } from "@/components/run-controls";
import { RunStatusMessage } from "@/components/run-status-message";
import { useUserAuthentication } from "@/hooks/useUserAuthentication";
import ConnectButton from "@/components/connectButton";
import NitroliteStatus from "@/components/nitrolite/NitroliteStatus";

export default function RunPage() {
  const { user, isAuthenticating, walletAddress } = useUserAuthentication();

  // Default values if user is not authenticated
  const userId = user?._id || "guest-user";
  const userColor = user?.color || "#3b82f6";

  // Tracking state - synced with MapComponent via window events
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [hexesCaptured, setHexesCaptured] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pace, setPace] = useState(0);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);

  // Refs to trigger MapComponent actions
  const mapStartButtonRef = useRef<HTMLButtonElement | null>(null);
  const mapStopButtonRef = useRef<HTMLButtonElement | null>(null);

  // Check geolocation permission
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setHasPermission(true),
        () => setHasPermission(false)
      );
    }
  }, []);

  // Listen for MapComponent state updates
  useEffect(() => {
    const handleMapStateUpdate = (event: CustomEvent) => {
      const { isRecording, elapsedTime, distance, hexesCaptured } = event.detail;
      setIsRunning(isRecording);
      setElapsedTime(elapsedTime);
      setDistance(distance);
      setHexesCaptured(hexesCaptured);
    };

    window.addEventListener('map-state-update' as any, handleMapStateUpdate);

    return () => {
      window.removeEventListener('map-state-update' as any, handleMapStateUpdate);
    };
  }, []);

  // Calculate pace
  useEffect(() => {
    if (distance > 0 && elapsedTime > 0) {
      const distanceKm = distance / 1000;
      const timeMinutes = elapsedTime / 60;
      const calculatedPace = timeMinutes / distanceKm;
      setPace(calculatedPace);
    }
  }, [distance, elapsedTime]);

  // Find and click MapComponent buttons
  useEffect(() => {
    // Find the buttons in the MapComponent
    const startButton = document.querySelector('[data-map-action="start"]') as HTMLButtonElement;
    const stopButton = document.querySelector('[data-map-action="stop"]') as HTMLButtonElement;
    
    mapStartButtonRef.current = startButton;
    mapStopButtonRef.current = stopButton;
  }, []);

  const handleStart = () => {
    if (!hasPermission) {
      alert("Location permission is required to track your run");
      return;
    }
    // Trigger MapComponent's start button
    const startButton = document.querySelector('[data-map-action="start"]') as HTMLButtonElement;
    if (startButton) {
      startButton.click();
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    // MapComponent doesn't have pause, so we just toggle the UI state
  };

  const handleStop = () => {
    // Trigger MapComponent's stop button
    const stopButton = document.querySelector('[data-map-action="stop"]') as HTMLButtonElement;
    if (stopButton) {
      stopButton.click();
    }
    setIsPaused(false);
  };

  const handleSimulateToggle = () => {
    const simulateButton = document.querySelector('[data-map-action="simulate"]') as HTMLButtonElement;
    if (simulateButton) {
      simulateButton.click();
      setIsSimulating(!isSimulating);
    }
  };

  const handleDirectionChange = (direction: 'north' | 'south' | 'east' | 'west') => {
    const directionButton = document.querySelector(`[data-map-action="direction-${direction}"]`) as HTMLButtonElement;
    if (directionButton) {
      directionButton.click();
    }
  };

  const handleSubmitDataCoin = () => {
    const dataCoinButton = document.querySelector('[data-map-action="datacoin"]') as HTMLButtonElement;
    if (dataCoinButton) {
      dataCoinButton.click();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-accent">Run & Capture</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your run • Capture territory • Earn rewards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Nitrolite Status */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <NitroliteStatus />
        </motion.div>

        {/* User Info */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="neumorphic-inset p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Running as</p>
                <p className="font-semibold text-foreground">
                  {user._id.slice(0, 8)}...{user._id.slice(-6)}
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-full border-2 border-border"
                style={{ backgroundColor: userColor }}
              />
            </div>
          </motion.div>
        )}

        {/* Authentication Warning */}
        {!user && !isAuthenticating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="neumorphic-inset p-4 border border-yellow-500/20"
          >
            <div className="text-center">
              <p className="text-sm text-yellow-400 mb-2">⚠️ Not Authenticated</p>
              <p className="text-xs text-muted-foreground">
                Connect your wallet to save your progress and earn rewards
              </p>
            </div>
          </motion.div>
        )}

        {/* Timer Display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RunTimerDisplay
            elapsedTime={elapsedTime}
            distance={distance}
            pace={pace}
            hexesCaptured={hexesCaptured}
          />
        </motion.div>

        {/* Map Component - Full featured with controls at bottom */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="neumorphic-inset overflow-hidden"
          style={{ height: "500px" }}
        >
          <MapComponent userId={userId} userColor={userColor} />
        </motion.div>

        {/* Run Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RunControls
            isRunning={isRunning}
            isPaused={isPaused}
            onStart={handleStart}
            onPause={handlePause}
            onStop={handleStop}
          />
        </motion.div>

        {/* Additional Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="neumorphic-inset p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Data Coin Button */}
            <button
              onClick={handleSubmitDataCoin}
              disabled={!isRunning}
              className="neumorphic-button px-4 py-3 font-semibold text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              🪙 Submit Data Coin
            </button>

            {/* Simulate Button */}
            <button
              onClick={handleSimulateToggle}
              className="neumorphic-button px-4 py-3 font-semibold transition-all text-sm"
              style={{
                backgroundColor: isSimulating ? "#f97316" : undefined,
                color: isSimulating ? "white" : undefined,
              }}
            >
              {isSimulating ? "⏹ Stop Simulation" : "🚶 Simulate Walk"}
            </button>
          </div>

          {/* Direction Controls - only show when simulating */}
          {isSimulating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <div className="text-xs text-muted-foreground text-center mb-2">
                Change Direction
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDirectionChange('west')}
                  className="neumorphic-button p-3 text-xl"
                >
                  ⬅️
                </button>
                <button
                  onClick={() => handleDirectionChange('north')}
                  className="neumorphic-button p-3 text-xl"
                >
                  ⬆️
                </button>
                <button
                  onClick={() => handleDirectionChange('east')}
                  className="neumorphic-button p-3 text-xl"
                >
                  ➡️
                </button>
                <div></div>
                <button
                  onClick={() => handleDirectionChange('south')}
                  className="neumorphic-button p-3 text-xl"
                >
                  ⬇️
                </button>
                <div></div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <RunStatusMessage
            isRunning={isRunning}
            isPaused={isPaused}
            distance={distance}
            hasPermission={hasPermission}
          />
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="neumorphic-inset p-4 mb-6"
        >
          <h3 className="font-semibold text-foreground mb-3 text-sm">
            Quick Guide
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">1.</span>
              <span>Press Start to begin capturing territory</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">2.</span>
              <span>Walk or run to capture hexagonal territories in real-time</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">3.</span>
              <span>Create closed loops for bonus interior hexes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent font-bold">4.</span>
              <span>Use controls in map to simulate walking or submit data coins</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

