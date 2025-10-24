import { useState, useEffect, useCallback } from "react";
import {
  GeolocationService,
  LocationData,
} from "../services/geolocation.service";

const geoService = new GeolocationService();

export function useGeolocation() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTracking = useCallback(() => {
    try {
      geoService.startTracking((location) => {
        setCurrentLocation(location);
        setError(null);
      });
      setIsTracking(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const stopTracking = useCallback(() => {
    geoService.stopTracking();
    setIsTracking(false);
  }, []);

  const getCurrentPosition = useCallback(async () => {
    try {
      const location = await geoService.getCurrentPosition();
      setCurrentLocation(location);
      setError(null);
      return location;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isTracking) {
        geoService.stopTracking();
      }
    };
  }, [isTracking]);

  return {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}
