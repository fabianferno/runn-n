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

  /**
   * Downsample path using Douglas-Peucker-like algorithm
   * Keeps important points (start, end, and significant direction changes)
   */
  const downsamplePath = (
    coordinates: [number, number][],
    maxPoints: number = 80
  ): [number, number][] => {
    if (coordinates.length <= maxPoints) {
      return coordinates;
    }

    console.log(
      `Downsampling path from ${coordinates.length} to ${maxPoints} points`
    );

    // Always keep first and last
    const result: [number, number][] = [coordinates[0]];

    // Calculate how many points to skip
    const step = Math.ceil(coordinates.length / maxPoints);

    // Sample at regular intervals
    for (let i = step; i < coordinates.length - 1; i += step) {
      result.push(coordinates[i]);
    }

    // Always keep last point
    result.push(coordinates[coordinates.length - 1]);

    console.log(`Downsampled to ${result.length} points`);
    return result;
  };

  /**
   * Advanced downsampling using Ramer-Douglas-Peucker algorithm
   * Better preserves shape while reducing points
   */
  const downsamplePathAdvanced = (
    coordinates: [number, number][],
    maxPoints: number = 80,
    epsilon: number = 0.0001
  ): [number, number][] => {
    if (coordinates.length <= maxPoints) {
      return coordinates;
    }

    // Recursive function to simplify path
    const simplify = (
      points: [number, number][],
      eps: number
    ): [number, number][] => {
      if (points.length <= 2) return points;

      // Find point with maximum distance from line segment
      let maxDist = 0;
      let maxIndex = 0;
      const start = points[0];
      const end = points[points.length - 1];

      for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDistance(points[i], start, end);
        if (dist > maxDist) {
          maxDist = dist;
          maxIndex = i;
        }
      }

      // If max distance is greater than epsilon, recursively simplify
      if (maxDist > eps) {
        const left = simplify(points.slice(0, maxIndex + 1), eps);
        const right = simplify(points.slice(maxIndex), eps);
        return [...left.slice(0, -1), ...right];
      }

      // Otherwise, just return endpoints
      return [start, end];
    };

    const simplified = simplify(coordinates, epsilon);

    // If still too many points, use uniform sampling
    if (simplified.length > maxPoints) {
      console.log(
        `Still ${simplified.length} points after simplification, using uniform sampling`
      );
      return downsamplePath(simplified, maxPoints);
    }

    console.log(
      `Downsampled from ${coordinates.length} to ${simplified.length} points using RDP`
    );
    return simplified;
  };

  /**
   * Calculate perpendicular distance from point to line segment
   */
  const perpendicularDistance = (
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): number => {
    const [x, y] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

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

    // Get the path to use
    let pathToUse = path.map((p) => p.coordinates);

    // Final map matching if we have enough points
    if (path.length > 1) {
      try {
        await matchPath(pathToUse);
        // Use matched path if available
        if (matchedPath.length > 0) {
          pathToUse = matchedPath;
        }
      } catch (error) {
        console.error("Final path matching failed:", error);
      }
    }

    // Downsample path to max 80 points (backend limit is 100, leave buffer)
    // Use advanced downsampling for better shape preservation
    const downsampledPath = downsamplePathAdvanced(pathToUse, 80);

    return {
      rawPath: path,
      matchedPath: downsampledPath,
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
