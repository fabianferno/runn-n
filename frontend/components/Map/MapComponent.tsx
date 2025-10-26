"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TerritoryGame } from "@/lib/territory-game";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePathTracking } from "@/hooks/usePathTracking";
import { ApiService } from "@/services/api.service";
import { useNitroliteMessages, useNitroliteAppSession } from "@/hooks/useNitrolite";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
// Add at the top of MapComponent after imports

interface MapComponentProps {
  userId: string;
  userColor: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  userId,
  userColor,
}) => {
  // Removed API URL logging to keep console clean for Nitrolite messages
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const gameRef = useRef<TerritoryGame | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [realtimeHexes, setRealtimeHexes] = useState<Set<string>>(new Set());
  
  // Nitrolite version tracking
  const messageVersionRef = useRef<number>(1);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulationDirectionRef = useRef<number>(0); // Direction in radians (0 = east, Math.PI/2 = north)

  // Hooks
  const { currentLocation: realLocation, startTracking, stopTracking } = useGeolocation();
  
  // Use simulated location if simulating, otherwise use real location
  const currentLocation = isSimulating && simulatedLocation ? simulatedLocation : realLocation;
  const {
    path,
    matchedPath,
    distance,
    isRecording,
    startRecording,
    addPoint,
    stopRecording,
    clearPath,
  } = usePathTracking();
  
  // Nitrolite hooks
  const { sendMessage, isSendingMessage } = useNitroliteMessages();
  const { isAppSessionCreated, resetAppStateVersion } = useNitroliteAppSession();

  // State
  const [elapsedTime, setElapsedTime] = useState(0);
  const [capturedHexes, setCapturedHexes] = useState(0);
  const [totalUserHexes, setTotalUserHexes] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [lastDataCoinLocation, setLastDataCoinLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Emit state updates for external UI components
  useEffect(() => {
    const event = new CustomEvent('map-state-update', {
      detail: {
        isRecording,
        elapsedTime,
        distance,
        hexesCaptured: realtimeHexes.size,
      }
    });
    window.dispatchEvent(event);
  }, [isRecording, elapsedTime, distance, realtimeHexes.size]);

  // Walking Simulation
  useEffect(() => {
    if (isSimulating) {
      // Start from Chennai center if no location yet
      if (!simulatedLocation) {
        // Pick a random initial direction (north, south, east, or west)
        const directions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // E, N, W, S
        simulationDirectionRef.current = directions[Math.floor(Math.random() * directions.length)];
        
        setSimulatedLocation({
          latitude: 13.0827,
          longitude: 80.2707,
          accuracy: 10,
          timestamp: Date.now(),
        });
        
        console.log(`🚶 Starting simulation walking ${getDirectionName(simulationDirectionRef.current)}`);
      }

      // Update location every second to simulate walking
      // Walking speed: ~1.4 m/s = ~0.0000126 degrees per second (at this latitude)
      simulationIntervalRef.current = setInterval(() => {
        setSimulatedLocation((prev) => {
          if (!prev) return prev;

          // Walk in a straight line in the current direction
          const distance = 0.00015; // ~1.5 meters per step
          const direction = simulationDirectionRef.current;
          
          // Calculate new position
          // For latitude (north-south): positive = north, negative = south
          // For longitude (east-west): positive = east, negative = west
          const latChange = Math.sin(direction) * distance;
          const lngChange = Math.cos(direction) * distance;
          
          return {
            latitude: prev.latitude + latChange,
            longitude: prev.longitude + lngChange,
            accuracy: 10,
            timestamp: Date.now(),
          };
        });
      }, 1000); // Update every second
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isSimulating, simulatedLocation]);

  // Helper function to get direction name
  const getDirectionName = (radians: number) => {
    const degree = (radians * 180) / Math.PI;
    if (degree < 45 || degree >= 315) return "East ➡️";
    if (degree >= 45 && degree < 135) return "North ⬆️";
    if (degree >= 135 && degree < 225) return "West ⬅️";
    return "South ⬇️";
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [80.2707, 13.0827], // Chennai
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", async () => {
      // Initialize territory game
      gameRef.current = new TerritoryGame(map, 11, 12);

      // Wait a bit for TerritoryGame to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add path line source
      map.addSource("path-line", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: "path-line-layer",
        type: "line",
        source: "path-line",
        paint: {
          "line-color": userColor,
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });

      // Load existing territories from MongoDB
      await loadTerritories();

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

      // Add geolocate control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
        showUserLocation: true,
      });

      map.addControl(geolocateControl, "bottom-right");
    });

    // Reload territories when map moves
    map.on("moveend", async () => {
      await loadTerritories();
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
      }
      map.remove();
    };
  }, [userId, userColor]);

  const loadTerritories = async () => {
    if (!mapRef.current || !gameRef.current) {
      return;
    }

    try {
      const bounds = mapRef.current.getBounds();

      if (!bounds) {
        return;
      }

      const viewportData = await ApiService.getTerritoriesInViewport(
        {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        },
        11
      );

      if (
        viewportData.regions &&
        Object.keys(viewportData.regions).length > 0
      ) {
        let totalLoaded = 0;

        Object.entries(viewportData.regions).forEach(([regionId, hexes]) => {
          Object.entries(
            hexes as Record<string, { user: string; color: string }>
          ).forEach(([hexId, territory]) => {
            gameRef.current?.setTerritory(
              hexId,
              territory.user,
              territory.color
            );
            totalLoaded++;
          });
        });

        // Only log summary
        // console.log(`Loaded ${totalLoaded} hexes from MongoDB`);
      }
    } catch (error) {
      console.error("❌ Error loading territories:", error);
    }
  };
  // Update user marker
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([
        currentLocation.longitude,
        currentLocation.latitude,
      ]);
    } else {
      const el = document.createElement("div");
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = userColor;
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";

      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(mapRef.current);
    }

    // Center map on user
    if (isRecording) {
      mapRef.current.easeTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        duration: 1000,
      });
    }
  }, [currentLocation, userColor, isRecording]);

  // Add point to path when recording
  useEffect(() => {
    if (isRecording && currentLocation) {
      addPoint(currentLocation);

      // Capture hex in real-time
      captureRealtimeHex(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, isRecording, addPoint]);

  const captureRealtimeHex = async (lat: number, lng: number) => {
    if (!gameRef.current) return;

    try {
      const h3 = await import("h3-js");
      const hexId = h3.latLngToCell(lat, lng, 11);

      // Check if we already captured this hex in this session
      if (realtimeHexes.has(hexId)) {
        return;
      }

      // Add to local set
      setRealtimeHexes((prev) => new Set(prev).add(hexId));

      // Update map immediately (local visual update)
      gameRef.current.setTerritory(hexId, userId, userColor);

      // ✅ Send via Nitrolite (no API call!)
      if (isAppSessionCreated) {
        const currentVersion = messageVersionRef.current;
        messageVersionRef.current += 1; // Increment IMMEDIATELY for next message
        
        const message = {
          type: 'hex_capture',
          userId,
          hexId,
          lat,
          lng,
          color: userColor,
          timestamp: Date.now(),
          version: currentVersion
        };

        console.log('🟡 NITROLITE SEND [v' + currentVersion + ']:', message);
        await sendMessage(JSON.stringify(message));
        console.log('🟡 NITROLITE HEX SENT [v' + currentVersion + ']:', hexId, '→ Next version ready:', messageVersionRef.current);
      } else {
        console.log('🔴 NITROLITE NOT READY - Session:', isAppSessionCreated);
      }
    } catch (error) {
      console.error("Error capturing real-time hex:", error);
    }
  };
  // Update path line on map
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getSource("path-line")) return;

    const coordinates =
      matchedPath.length > 0 ? matchedPath : path.map((p) => p.coordinates);

    (mapRef.current.getSource("path-line") as mapboxgl.GeoJSONSource).setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    });
  }, [path, matchedPath]);

  // Fetch user stats from leaderboard
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTotalUserHexes(data.data.stats.totalHexes);
          setUserRank(data.data.rank);
          console.log('📊 User stats updated:', {
            totalHexes: data.data.stats.totalHexes,
            rank: data.data.rank,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  // Fetch user stats on mount
  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  // Start tracking
  const handleStartTracking = () => {
    startTracking();
    startRecording();
    setRealtimeHexes(new Set()); // Clear previous session hexes
    messageVersionRef.current = 1; // Reset message version for new session
    resetAppStateVersion(); // Reset app state version for new session
    console.log('🟢 New session started - Both versions reset to 1');
  };
  // Stop tracking and send via Nitrolite
  const handleStopTracking = async () => {
    const result = await stopRecording();
    stopTracking();
    
    const sessionHexCount = realtimeHexes.size;
    const sessionDistance = distance;
    const sessionDuration = elapsedTime;

    // Show stats even if path is short
    if (result.matchedPath.length < 2) {
      // Send session end message
      if (isAppSessionCreated) {
        const sessionEndMessage = {
          type: 'session_end',
          userId,
          userColor,
          sessionStats: {
            hexesCaptured: sessionHexCount,
            distance: sessionDistance,
            duration: sessionDuration,
            timestamp: Date.now()
          }
        };
        
        await sendMessage(JSON.stringify(sessionEndMessage));
        console.log('✅ Session end message sent');
        
        // Wait a bit for DB to update, then fetch new stats
        setTimeout(() => {
          fetchUserStats();
        }, 1000);
      }
      
      console.log(
        `Session complete!\n` +
        `Hexes captured: ${sessionHexCount}\n` +
        `Distance: ${(distance / 1000).toFixed(2)} km`
      );
      clearPath();
      setRealtimeHexes(new Set());
      return;
    }

    // ✅ Send complete path via Nitrolite
    if (isAppSessionCreated) {
      try {
        const pathCoordinates: [number, number][] = result.matchedPath.map(
          (coord) => [coord[1], coord[0]]
        );

        // Send path data via Nitrolite
        const currentVersion = messageVersionRef.current;
        messageVersionRef.current += 1; // Increment IMMEDIATELY for next message
        
        const pathMessage = {
          type: 'path_complete',
          userId,
          path: pathCoordinates,
          distance,
          color: userColor,
          timestamp: Date.now(),
          version: currentVersion
        };

        console.log('🟡 NITROLITE PATH SEND [v' + currentVersion + ']:', { type: 'path_complete', userId, pathPoints: pathCoordinates.length, distance });
        await sendMessage(JSON.stringify(pathMessage));
        console.log("🟡 NITROLITE PATH SENT [v" + currentVersion + "] SUCCESSFULLY → Next version ready:", messageVersionRef.current);
        
        // Send session end message
        const sessionEndMessage = {
          type: 'session_end',
          userId,
          userColor,
          sessionStats: {
            hexesCaptured: sessionHexCount,
            distance: sessionDistance,
            duration: sessionDuration,
            timestamp: Date.now()
          }
        };
        
        await sendMessage(JSON.stringify(sessionEndMessage));
        console.log('✅ Session end message sent');
        
        // Wait a bit for DB to update, then fetch new stats
        setTimeout(() => {
          fetchUserStats();
        }, 1000);

        // Still check for loop bonus locally
        const response = await ApiService.capturePath({
          user: userId,
          color: userColor,
          path: pathCoordinates,
        });

        if (response.pathType === "closed_loop" && response.interiorHexes > 0) {
          // Fill the interior hexes on map
          response.hexPath.forEach((hexId) => {
            gameRef.current?.setTerritory(hexId, userId, userColor);
          });

          console.log(
            `🎉 LOOP BONUS!\n` +
              `Hexes: ${realtimeHexes.size}\n` +
              `Loop fill: ${response.interiorHexes}\n` +
              `Total: ${response.hexesCaptured}\n` +
              `Distance: ${(distance / 1000).toFixed(2)} km`
          );

          setCapturedHexes((prev) => prev + response.interiorHexes);
        } else {
          console.log(
            `Session complete!\n` +
              `Hexes: ${realtimeHexes.size}\n` +
              `Distance: ${(distance / 1000).toFixed(2)} km`
          );
        }

        clearPath();
        setRealtimeHexes(new Set());
      } catch (error) {
        console.error("Error:", error);
        console.log(
          `Session complete!\n` +
          `Hexes captured: ${realtimeHexes.size}\n` +
          `Distance: ${(distance / 1000).toFixed(2)} km`
        );
        clearPath();
        setRealtimeHexes(new Set());
      }
    }
  };

  // Submit data coin
  const handleSubmitDataCoin = () => {
    if (!currentLocation) {
      console.log("No location data available");
      return;
    }

    console.log("📍 Data Coin Submitted:", {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: new Date().toISOString(),
    });

    setLastDataCoinLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    });

    console.log(
      `Data Coin Submitted!\n` +
      `Lat: ${currentLocation.latitude.toFixed(6)}\n` +
      `Lng: ${currentLocation.longitude.toFixed(6)}`
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Map Container - FULL */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Nitrolite Status Indicator */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            padding: "8px 12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
            fontWeight: "500",
            background: isAppSessionCreated ? "#10b981" : "#f59e0b",
            color: isAppSessionCreated ? "white" : "#000",
          }}
        >
          {isAppSessionCreated ? "🟢 Live" : "⚠️ Offline"}
        </div>
        
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Hidden Control Buttons for External Triggering */}
      <div style={{ display: "none" }}>
        <button
          data-map-action={isRecording ? "stop" : "start"}
          onClick={isRecording ? handleStopTracking : handleStartTracking}
        />
        <button
          data-map-action="datacoin"
          onClick={handleSubmitDataCoin}
        />
        <button
          data-map-action="simulate"
          onClick={() => {
            if (!isSimulating) {
              setSimulatedLocation(null);
            }
            setIsSimulating(!isSimulating);
          }}
        />
        <button
          data-map-action="direction-west"
          onClick={() => {
            simulationDirectionRef.current = Math.PI;
            console.log("🚶 Changed direction: West ⬅️");
          }}
        />
        <button
          data-map-action="direction-north"
          onClick={() => {
            simulationDirectionRef.current = Math.PI / 2;
            console.log("🚶 Changed direction: North ⬆️");
          }}
        />
        <button
          data-map-action="direction-east"
          onClick={() => {
            simulationDirectionRef.current = 0;
            console.log("🚶 Changed direction: East ➡️");
          }}
        />
        <button
          data-map-action="direction-south"
          onClick={() => {
            simulationDirectionRef.current = (3 * Math.PI) / 2;
            console.log("🚶 Changed direction: South ⬇️");
          }}
        />
      </div>
    </div>
  );
};
