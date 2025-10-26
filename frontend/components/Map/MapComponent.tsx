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
      
      alert(
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

          alert(
            `🎉 LOOP BONUS!\n` +
              `Hexes: ${realtimeHexes.size}\n` +
              `Loop fill: ${response.interiorHexes}\n` +
              `Total: ${response.hexesCaptured}\n` +
              `Distance: ${(distance / 1000).toFixed(2)} km`
          );

          setCapturedHexes((prev) => prev + response.interiorHexes);
        } else {
          alert(
            `Session complete!\n` +
              `Hexes: ${realtimeHexes.size}\n` +
              `Distance: ${(distance / 1000).toFixed(2)} km`
          );
        }

        clearPath();
        setRealtimeHexes(new Set());
      } catch (error) {
        console.error("Error:", error);
        alert(
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
      alert("No location data available");
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

    alert(
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
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Map Container */}
      <div className="px-4 py-6 animate-scale-in">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"></div>
        <div
          style={{
            width: "100%",
            height: "600px",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            position: "relative",
          }}
        >
          {/* Nitrolite Status Indicator */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              zIndex: 1000,
              padding: "10px 16px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              fontSize: "14px",
              fontWeight: "500",
              background: isAppSessionCreated ? "#10b981" : "#f59e0b",
              color: isAppSessionCreated ? "white" : "#000",
            }}
          >
            {isAppSessionCreated ? "🟢 Nitrolite Active" : "⚠️ Create App Session"}
          </div>
          
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
      {/* Controls Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Left Column - Controls */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            Controls
          </h3>

          {/* Start/Stop Button */}
          <button
            onClick={isRecording ? handleStopTracking : handleStartTracking}
            style={{
              width: "100%",
              padding: "16px",
              marginBottom: "12px",
              fontSize: "18px",
              fontWeight: "bold",
              backgroundColor: isRecording ? "#ef4444" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isRecording ? "⏹ Stop Tracking" : "▶ Start Tracking"}
          </button>

          {/* Submit Data Coin Button */}
          <button
            onClick={handleSubmitDataCoin}
            disabled={!isRecording}
            style={{
              width: "100%",
              padding: "16px",
              marginBottom: "12px",
              fontSize: "18px",
              fontWeight: "bold",
              backgroundColor: isRecording ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isRecording ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (isRecording) {
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            🪙 Submit Data Coin
          </button>

          {/* Simulate Walking Button */}
          <button
            onClick={() => {
              if (!isSimulating) {
                setSimulatedLocation(null); // Reset location to pick new direction
              }
              setIsSimulating(!isSimulating);
            }}
            style={{
              width: "100%",
              padding: "16px",
              marginBottom: "12px",
              fontSize: "18px",
              fontWeight: "bold",
              backgroundColor: isSimulating ? "#f97316" : "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isSimulating ? "⏹ Stop Simulation" : "🚶 Simulate Walking"}
          </button>

          {/* Direction Controls - only show when simulating */}
          {isSimulating && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ 
                fontSize: "12px", 
                color: "#6b7280", 
                marginBottom: "8px",
                textAlign: "center"
              }}>
                Change Direction
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px"
              }}>
                <button
                  onClick={() => {
                    simulationDirectionRef.current = Math.PI; // West
                    console.log("🚶 Changed direction: West ⬅️");
                  }}
                  style={{
                    padding: "12px",
                    backgroundColor: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ⬅️
                </button>
                <button
                  onClick={() => {
                    simulationDirectionRef.current = Math.PI / 2; // North
                    console.log("🚶 Changed direction: North ⬆️");
                  }}
                  style={{
                    padding: "12px",
                    backgroundColor: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ⬆️
                </button>
                <button
                  onClick={() => {
                    simulationDirectionRef.current = 0; // East
                    console.log("🚶 Changed direction: East ➡️");
                  }}
                  style={{
                    padding: "12px",
                    backgroundColor: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ➡️
                </button>
                <div></div>
                <button
                  onClick={() => {
                    simulationDirectionRef.current = (3 * Math.PI) / 2; // South
                    console.log("🚶 Changed direction: South ⬇️");
                  }}
                  style={{
                    padding: "12px",
                    backgroundColor: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ⬇️
                </button>
                <div></div>
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              try {
                const response = await fetch(`https://remo.crevn.xyz/health`);
                const data = await response.json();
                alert("Backend is accessible! " + JSON.stringify(data));
              } catch (error: any) {
                alert("Cannot reach backend: " + error.message);
              }
            }}
            style={{
              padding: "10px",
              background: "orange",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px",
              width: "100%",
            }}
          >
            🔧 Test Backend Connection
          </button>
          {/* Live Stats */}
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Status
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: isRecording ? "#ef4444" : "#6b7280",
                }}
              >
                {isRecording ? "🔴 Recording" : "⚪ Idle"}
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Time Elapsed
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                }}
              >
                {formatTime(elapsedTime)}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Distance Covered
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#10b981",
                }}
              >
                {formatDistance(distance)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            Statistics
          </h3>

          {/* Current Location */}
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              📍 Current Location
            </div>
            {currentLocation ? (
              <div style={{ fontSize: "14px", fontFamily: "monospace" }}>
                <div>
                  <strong>Lat:</strong> {currentLocation.latitude.toFixed(6)}
                </div>
                <div>
                  <strong>Lng:</strong> {currentLocation.longitude.toFixed(6)}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "14px", color: "#9ca3af" }}>
                No location data
              </div>
            )}
          </div>

          {/* Path Stats */}
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              📊 Session Stats
            </div>
            <div style={{ fontSize: "16px" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>Path Points:</strong> {path.length}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ color: "#10b981" }}>This Session:</strong>{" "}
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  {realtimeHexes.size}
                </span>{" "}
                hexes
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ color: "#3b82f6" }}>Total Hexes:</strong>{" "}
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#3b82f6",
                  }}
                >
                  {totalUserHexes}
                </span>
              </div>
              {userRank && (
                <div>
                  <strong style={{ color: "#f59e0b" }}>Rank:</strong>{" "}
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#f59e0b",
                    }}
                  >
                    #{userRank}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Last Data Coin Location */}
          {lastDataCoinLocation && (
            <div
              style={{
                padding: "15px",
                background: "#dbeafe",
                borderRadius: "8px",
                border: "2px solid #3b82f6",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#1e40af",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                🪙 Last Data Coin
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontFamily: "monospace",
                  color: "#1e3a8a",
                }}
              >
                <div>Lat: {lastDataCoinLocation.latitude.toFixed(6)}</div>
                <div>Lng: {lastDataCoinLocation.longitude.toFixed(6)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Console */}
      <div
        style={{
          background: "#1f2937",
          color: "#10b981",
          padding: "20px",
          borderRadius: "12px",
          fontFamily: "monospace",
          fontSize: "14px",
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: "10px", color: "#9ca3af" }}>
          === Debug Console ===
        </div>
        <div style={{ color: "#fbbf24" }}>🟡 Message Version: {messageVersionRef.current}</div>
        <div>Simulation: {isSimulating ? `ACTIVE 🚶 ${getDirectionName(simulationDirectionRef.current)}` : "INACTIVE"}</div>
        <div>Recording: {isRecording ? "TRUE" : "FALSE"}</div>
        <div>Path Points: {path.length}</div>
        <div>Matched Path Points: {matchedPath.length}</div>
        <div>Distance: {distance.toFixed(2)}m</div>
        <div>Time: {elapsedTime}s</div>
        <div style={{ color: "#10b981" }}>Session Hexes: {realtimeHexes.size}</div>
        <div style={{ color: "#3b82f6" }}>Total User Hexes: {totalUserHexes}</div>
        {userRank && <div style={{ color: "#f59e0b" }}>Rank: #{userRank}</div>}
        {currentLocation && (
          <>
            <div>Current Lat: {currentLocation.latitude.toFixed(6)}</div>
            <div>Current Lng: {currentLocation.longitude.toFixed(6)}</div>
          </>
        )}
      </div>
    </div>
  );
};
