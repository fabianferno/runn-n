"use client";

import React, { useState, useCallback } from "react";
import { MapComponent } from "./map-component";

interface TerritoryMapProps {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function TerritoryMap({
  className = "",
  initialCenter = [-74.5, 40],
  initialZoom = 17,
}: TerritoryMapProps) {
  const [territoryStats, setTerritoryStats] = useState<Record<string, number>>(
    {}
  );

  // Update stats periodically
  const updateStats = useCallback(() => {
    // This would be called from the territory game instance
    // For now, we'll simulate some stats
    setTerritoryStats({
      player1: 15,
      player2: 8,
      player3: 3,
      neutral: 25,
    });
  }, []);

  // Update stats every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [updateStats]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapComponent
        className="w-full h-full"
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        showGridOverlay={true}
        showCoordinates={true}
      />

      {/* Territory Stats Panel */}
      <div className="absolute top-4 right-4 z-10 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-w-xs">
        <h3 className="text-lg font-semibold mb-3">Territory Control</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Red Team</span>
            </div>
            <span className="text-sm font-medium">
              {territoryStats.player1 || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span className="text-sm">Blue Team</span>
            </div>
            <span className="text-sm font-medium">
              {territoryStats.player2 || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-300"></div>
              <span className="text-sm">Green Team</span>
            </div>
            <span className="text-sm font-medium">
              {territoryStats.player3 || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-sm">Neutral</span>
            </div>
            <span className="text-sm font-medium">
              {territoryStats.neutral || 0}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-600">
          <div className="text-xs text-gray-400">
            <p>• Click hexagons to capture territory</p>
            <p>• Hover to see territory info</p>
            <p>• Grid expands as you move around</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm max-w-sm">
        <h4 className="font-semibold mb-2">How to Play</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>
            • <strong>Click</strong> any hexagon to capture it
          </p>
          <p>
            • <strong>Hover</strong> to see territory details
          </p>
          <p>
            • <strong>Move</strong> the map to explore new areas
          </p>
          <p>
            • <strong>Compete</strong> with other players for control
          </p>
        </div>
      </div>
    </div>
  );
}
