"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapMove?: (lng: number, lat: number, zoom: number) => void;
  onLocationFound?: (lng: number, lat: number) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  className = "",
  initialCenter = [-74.5, 40],
  initialZoom = 9,
  mapStyle = "mapbox://styles/mapbox/dark-v11",
  showControls = true,
  showNavigationControl = true,
  showGeolocateControl = true,
  showFullscreenControl = true,
  showScaleControl = true,
  showCoordinates = true,
  height = "500px",
  useCurrentLocation = false,
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
        }
      });
    }

    // Cleanup function
    return () => {
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
