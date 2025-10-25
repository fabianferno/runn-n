"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TerritoryGame } from "@/lib/territory-game";

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapComponentProps {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  mapStyle?: string;
  showControls?: boolean;
  showNavigationControl?: boolean;
  showGeolocateControl?: boolean;
  showFullscreenControl?: boolean;
  showScaleControl?: boolean;
  showCoordinates?: boolean;
  height?: string;
  useCurrentLocation?: boolean;
  hideLabels?: boolean;
  hideBuildingLabels?: boolean;
  hidePoiLabels?: boolean;
  showGridOverlay?: boolean;
  gridSize?: number; // in meters
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapMove?: (lng: number, lat: number, zoom: number) => void;
  onLocationFound?: (lng: number, lat: number) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  className = "",
  initialCenter = [-74.5, 40],
  initialZoom = 17,
  mapStyle = "mapbox://styles/mapbox/dark-v11",
  showControls = true,
  showNavigationControl = true,
  showGeolocateControl = true,
  showFullscreenControl = true,
  showScaleControl = true,
  showCoordinates = true,
  height = "500px",
  useCurrentLocation = false,
  hideLabels = false,
  hideBuildingLabels = false,
  hidePoiLabels = false,
  showGridOverlay = true,
  gridSize = 20, // 20 meters
  onMapLoad,
  onMapMove,
  onLocationFound,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(initialCenter[0]);
  const [lat, setLat] = useState(initialCenter[1]);
  const [zoom, setZoom] = useState(initialZoom);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Territory game instance
  const [territoryGame, setTerritoryGame] = useState<any>(null);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleMapLoad = useCallback(
    (map: mapboxgl.Map) => {
      if (onMapLoad) {
        onMapLoad(map);
      }
    },
    [onMapLoad]
  );

  const handleMapMove = useCallback(
    (newLng: number, newLat: number, newZoom: number) => {
      if (onMapMove) {
        onMapMove(newLng, newLat, newZoom);
      }
    },
    [onMapMove]
  );

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setLng(longitude);
        setLat(latitude);
        setIsLoadingLocation(false);

        // Call onLocationFound callback
        if (onLocationFound) {
          onLocationFound(longitude, latitude);
        }

        // Update map center if map is already loaded
        if (map.current) {
          map.current.setCenter([longitude, latitude]);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = "Unable to retrieve your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        setLocationError(errorMessage);
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [onLocationFound]);

  // Function to hide labels based on configuration
  const hideMapLabels = useCallback(
    (mapInstance: mapboxgl.Map) => {
      if (!mapInstance) return;

      try {
        const layers = mapInstance.getStyle().layers;
        console.log(
          "Available layers:",
          layers.map((l) => ({ id: l.id, type: l.type }))
        );

        layers.forEach((layer) => {
          if (layer.type === "symbol") {
            const layerId = layer.id.toLowerCase();
            console.log("Processing symbol layer:", layerId);

            // Hide all labels if hideLabels is true
            if (hideLabels) {
              console.log("Hiding all labels - layer:", layerId);
              mapInstance.setLayoutProperty(layerId, "visibility", "none");
            }
            // Hide building labels specifically
            else if (hideBuildingLabels) {
              // More aggressive approach - hide most symbol layers that could contain building names
              if (
                layerId.includes("building") ||
                layerId.includes("poi") ||
                layerId.includes("label") ||
                layerId.includes("place") ||
                layerId.includes("name") ||
                layerId.includes("text") ||
                layerId.includes("symbol") ||
                layerId.includes("annotation") ||
                layerId.includes("poi-label") ||
                layerId.includes("place-label") ||
                layerId.includes("building-label")
              ) {
                console.log("Hiding building/POI labels - layer:", layerId);
                mapInstance.setLayoutProperty(layerId, "visibility", "none");
              }
            }
            // Hide POI labels specifically
            else if (
              hidePoiLabels &&
              (layerId.includes("poi") ||
                layerId.includes("place") ||
                layerId.includes("label") ||
                layerId.includes("name"))
            ) {
              console.log("Hiding POI labels - layer:", layerId);
              mapInstance.setLayoutProperty(layerId, "visibility", "none");
            }
          }
        });

        // Additional approach: Try to hide labels using paint properties
        if (hideBuildingLabels || hidePoiLabels) {
          layers.forEach((layer) => {
            if (layer.type === "symbol") {
              const layerId = layer.id.toLowerCase();
              if (
                layerId.includes("label") ||
                layerId.includes("text") ||
                layerId.includes("name")
              ) {
                try {
                  // Try to make text transparent
                  mapInstance.setPaintProperty(layerId, "text-opacity", 0);
                  mapInstance.setPaintProperty(layerId, "text-halo-blur", 0);
                } catch (error) {
                  // Ignore errors if properties don't exist
                  console.log(
                    "Paint property not available for layer:",
                    layerId
                  );
                }
              }
            }
          });
        }
      } catch (error) {
        console.warn("Error hiding map labels:", error);
      }
    },
    [hideLabels, hideBuildingLabels, hidePoiLabels]
  );

  // Get current location on mount if requested
  useEffect(() => {
    if (useCurrentLocation) {
      getCurrentLocation();
    }
  }, [useCurrentLocation, getCurrentLocation]);

  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [lng, lat],
        zoom: zoom,
        config: {
          basemap: {
            lightPreset: "day",
            colorMotorways: "#2e89ff",
            showPedestrianRoads: true,
            show3dObjects: false,
          },
        },
      });

      // Add controls conditionally
      if (showControls) {
        if (showNavigationControl) {
          map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
        }

        if (showGeolocateControl) {
          map.current.addControl(
            new mapboxgl.GeolocateControl({
              positionOptions: {
                enableHighAccuracy: true,
              },
              trackUserLocation: true,
              showUserHeading: true,
            }),
            "top-right"
          );
        }

        if (showFullscreenControl) {
          map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
        }

        if (showScaleControl) {
          map.current.addControl(
            new mapboxgl.ScaleControl({
              maxWidth: 80,
              unit: "metric",
            }),
            "bottom-left"
          );
        }
      }

      // Call onMapLoad callback
      if (map.current) {
        handleMapLoad(map.current);

        // Hide labels after map loads
        hideMapLabels(map.current);

        // Initialize territory game
        if (showGridOverlay) {
          const game = new TerritoryGame(map.current, 11, 12, (gridData) => {
            // Handle grid click in your React component
            console.log("Grid clicked:", gridData);

            // You can update React state here

            // Or make API calls
            // fetchGridDetails(gridData.id);
          });
          setTerritoryGame(game);
        }

        // Also try hiding labels after a short delay in case style isn't fully loaded
        setTimeout(() => {
          if (map.current) {
            console.log("Retrying label hiding after delay...");
            hideMapLabels(map.current);
          }
        }, 1000);
      }

      // Listen for map events
      map.current.on("move", () => {
        if (map.current) {
          const newLng = parseFloat(map.current.getCenter().lng.toFixed(4));
          const newLat = parseFloat(map.current.getCenter().lat.toFixed(4));
          const newZoom = parseFloat(map.current.getZoom().toFixed(2));

          setLng(newLng);
          setLat(newLat);
          setZoom(newZoom);

          // Call onMapMove callback
          handleMapMove(newLng, newLat, newZoom);

          // Expand territory grid when map moves
          if (territoryGame) {
            territoryGame.expandGrid();
          }
        }
      });

      // Listen for style changes and re-hide labels
      map.current.on("styledata", () => {
        if (map.current) {
          console.log("Style data changed, re-hiding labels...");
          hideMapLabels(map.current);
        }
      });

      // Grid is now fixed and doesn't need to be regenerated on map moves
      // This prevents performance issues and crashes
    }

    // Cleanup function
    return () => {
      if (territoryGame) {
        territoryGame.destroy();
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, [
    mapStyle,
    showControls,
    showNavigationControl,
    showGeolocateControl,
    showFullscreenControl,
    showScaleControl,
    handleMapLoad,
    handleMapMove,
  ]); // Include only necessary dependencies

  return (
    <div className={`relative w-full h-full ${className}`}>
      {showCoordinates && (
        <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
          <div className="text-sm">
            <div>Longitude: {lng}</div>
            <div>Latitude: {lat}</div>
            <div>Zoom: {zoom}</div>
          </div>
        </div>
      )}

      {/* Location status and manual location button */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {isLoadingLocation && (
          <div className="bg-blue-500/80 text-white p-2 rounded-lg backdrop-blur-sm text-xs">
            Getting location...
          </div>
        )}

        {locationError && (
          <div className="bg-red-500/80 text-white p-2 rounded-lg backdrop-blur-sm text-xs max-w-48">
            {locationError}
          </div>
        )}

        {!useCurrentLocation && (
          <button
            onClick={getCurrentLocation}
            className="bg-primary/80 hover:bg-primary text-white p-2 rounded-lg backdrop-blur-sm text-xs transition-colors"
            title="Get current location"
          >
            📍
          </button>
        )}
      </div>

      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg"
        style={{ minHeight: height }}
      />
    </div>
  );
};
