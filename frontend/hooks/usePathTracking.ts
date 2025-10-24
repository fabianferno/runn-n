import { useState, useCallback, useRef } from "react";
import { MapboxService } from "../services/mapbox.service";
import { LocationData } from "../services/geolocation.service";

export interface PathPoint {
  coordinates: [number, number]; // [lng, lat]
  timestamp: number;
  accuracy: number;
}

export function usePathTracking() {
  const [path, setPath] = useState<PathPoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [matchedPath, setMatchedPath] = useState<[number, number][]>([]);
  const lastPointRef = useRef<[number, number] | null>(null);

  const startRecording = useCallback(() => {
    setPath([]);
    setDistance(0);
    setMatchedPath([]);
    setIsRecording(true);
    lastPointRef.current = null;
  }, []);

  const addPoint = useCallback(
    (location: LocationData) => {
      if (!isRecording) return;

      const point: PathPoint = {
        coordinates: [location.longitude, location.latitude],
        timestamp: location.timestamp,
        accuracy: location.accuracy,
      };

      setPath((prev) => {
        const newPath = [...prev, point];

        // Calculate distance increment
        if (lastPointRef.current) {
          const dist = MapboxService.calculateDistance(
            lastPointRef.current,
            point.coordinates
          );
          setDistance((d) => d + dist);
        }

        lastPointRef.current = point.coordinates;

        // Update matched path every 5 points
        if (newPath.length % 5 === 0) {
          matchPath(newPath.map((p) => p.coordinates));
        }

        return newPath;
      });
    },
    [isRecording]
  );

  const matchPath = useCallback(async (coordinates: [number, number][]) => {
    try {
      const result = await MapboxService.matchCoordinates(coordinates);
      setMatchedPath(result.matchedCoordinates);
    } catch (error) {
      console.error("Path matching error:", error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);

    // Final map matching
    if (path.length > 1) {
      await matchPath(path.map((p) => p.coordinates));
    }

    return {
      rawPath: path,
      matchedPath:
        matchedPath.length > 0 ? matchedPath : path.map((p) => p.coordinates),
      distance,
    };
  }, [path, matchedPath, distance, matchPath]);

  const clearPath = useCallback(() => {
    setPath([]);
    setDistance(0);
    setMatchedPath([]);
    setIsRecording(false);
    lastPointRef.current = null;
  }, []);

  return {
    path,
    matchedPath,
    distance,
    isRecording,
    startRecording,
    addPoint,
    stopRecording,
    clearPath,
  };
}
