"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TerritoryGame } from "@/lib/territory-game";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePathTracking } from "@/hooks/usePathTracking";
import { ApiService } from "@/services/api.service";

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
  useEffect(() => {
    console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL);
  }, []);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const gameRef = useRef<TerritoryGame | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Hooks
  const { currentLocation, startTracking, stopTracking } = useGeolocation();
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

  // State
  const [elapsedTime, setElapsedTime] = useState(0);
  const [capturedHexes, setCapturedHexes] = useState(0);
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
      console.log("Map loaded, initializing game...");

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
      console.warn("Map or game not ready");
      return;
    }

    try {
      const bounds = mapRef.current.getBounds();

      if (!bounds) {
        console.warn("Map bounds not available yet");
        return;
      }

      console.log("🔍 Loading territories for bounds:", {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      });

      const viewportData = await ApiService.getTerritoriesInViewport(
        {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        },
        11
      );

      console.log("📦 Received viewport data:", {
        regionCount: Object.keys(viewportData.regions || {}).length,
        totalHexes: viewportData.totalHexes,
        regions: viewportData.regions,
      });

      if (
        viewportData.regions &&
        Object.keys(viewportData.regions).length > 0
      ) {
        let totalLoaded = 0;

        Object.entries(viewportData.regions).forEach(([regionId, hexes]) => {
          console.log(
            `🔧 Processing region ${regionId} with ${
              Object.keys(hexes as object).length
            } hexes`
          );

          Object.entries(
            hexes as Record<string, { user: string; color: string }>
          ).forEach(([hexId, territory]) => {
            console.log(
              `  Adding hex ${hexId} for user ${territory.user} (${territory.color})`
            );
            gameRef.current?.setTerritory(
              hexId,
              territory.user,
              territory.color
            );
            totalLoaded++;
          });
        });

        console.log(`✅ Loaded ${totalLoaded} hexes from MongoDB to map`);
      } else {
        console.log("⚠️ No territories found in viewport");
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
    }
  }, [currentLocation, isRecording, addPoint]);

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

  // Start tracking
  const handleStartTracking = () => {
    startTracking();
    startRecording();
  };

  // Stop tracking and send to backend
  // Stop tracking and send to backend
  const handleStopTracking = async () => {
    const result = await stopRecording();
    stopTracking();

    if (result.matchedPath.length < 2) {
      alert("Path too short to capture territories");
      clearPath();
      return;
    }

    try {
      const pathCoordinates: [number, number][] = result.matchedPath.map(
        (coord) => [coord[1], coord[0]]
      );

      console.log("Sending to backend:", {
        pathLength: pathCoordinates.length,
        firstPoint: pathCoordinates[0],
        lastPoint: pathCoordinates[pathCoordinates.length - 1],
      });

      const response = await ApiService.capturePath({
        user: userId,
        color: userColor,
        path: pathCoordinates,
      });

      console.log("Capture response:", response);

      // Add captured hexes to map immediately
      if (gameRef.current && response.hexPath) {
        response.hexPath.forEach((hexId) => {
          gameRef.current?.setTerritory(hexId, userId, userColor);
        });
      }

      setCapturedHexes((prev) => prev + response.hexesCaptured);

      alert(
        `Captured ${response.hexesCaptured} hexes!\n` +
          `Path type: ${response.pathType}\n` +
          `Distance: ${(distance / 1000).toFixed(2)} km`
      );

      clearPath();
    } catch (error: any) {
      console.error("Error capturing path:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
      });
      alert(`Failed to capture path: ${error.message || "Please try again."}`);
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
      <div
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "30px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
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
              📊 Path Data
            </div>
            <div style={{ fontSize: "16px" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>Path Points:</strong> {path.length}
              </div>
              <div>
                <strong style={{ color: "#10b981" }}>Hexes Captured:</strong>{" "}
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  {capturedHexes}
                </span>
              </div>
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
        <div>Recording: {isRecording ? "TRUE" : "FALSE"}</div>
        <div>Path Points: {path.length}</div>
        <div>Matched Path Points: {matchedPath.length}</div>
        <div>Distance: {distance.toFixed(2)}m</div>
        <div>Time: {elapsedTime}s</div>
        <div>Total Captured Hexes: {capturedHexes}</div>
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
