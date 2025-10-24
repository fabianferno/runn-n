import mapboxgl from "mapbox-gl";

export interface MapMatchingResult {
  matchedCoordinates: [number, number][];
  confidence: number;
  distance: number;
}

export class MapboxService {
  private static MAPBOX_TOKEN =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  /**
   * Map Matching API - Snap GPS coordinates to roads
   */
  static async matchCoordinates(
    coordinates: [number, number][]
  ): Promise<MapMatchingResult> {
    if (coordinates.length < 2) {
      return {
        matchedCoordinates: coordinates,
        confidence: 1,
        distance: 0,
      };
    }

    try {
      // Format coordinates for Mapbox API
      const coordsString = coordinates
        .map((coord) => `${coord[0]},${coord[1]}`)
        .join(";");

      const url = `https://api.mapbox.com/matching/v5/mapbox/walking/${coordsString}?access_token=${this.MAPBOX_TOKEN}&geometries=geojson&overview=full`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.matchings && data.matchings.length > 0) {
        const matching = data.matchings[0];
        return {
          matchedCoordinates: matching.geometry.coordinates,
          confidence: matching.confidence,
          distance: matching.distance,
        };
      }

      // Fallback to original coordinates
      return {
        matchedCoordinates: coordinates,
        confidence: 0,
        distance: 0,
      };
    } catch (error) {
      console.error("Map matching error:", error);
      return {
        matchedCoordinates: coordinates,
        confidence: 0,
        distance: 0,
      };
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1[1] * Math.PI) / 180;
    const φ2 = (coord2[1] * Math.PI) / 180;
    const Δφ = ((coord2[1] - coord1[1]) * Math.PI) / 180;
    const Δλ = ((coord2[0] - coord1[0]) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate total path distance
   */
  static calculatePathDistance(coordinates: [number, number][]): number {
    let totalDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
      totalDistance += this.calculateDistance(
        coordinates[i - 1],
        coordinates[i]
      );
    }

    return totalDistance;
  }
}
