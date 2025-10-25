import * as h3 from "h3-js";

export class H3Service {
  /**
   * Convert coordinate path to H3 hexes
   */
  static pathToHexes(path: [number, number][], resolution: number): string[] {
    const hexPath: string[] = [];

    for (const [lat, lng] of path) {
      try {
        const hex = h3.latLngToCell(lat, lng, resolution);
        hexPath.push(hex);
      } catch (error) {
        console.error("Error converting coordinate to hex:", error);
      }
    }

    return hexPath;
  }

  /**
   * Remove consecutive duplicate hexes
   */
  static removeDuplicates(hexPath: string[]): string[] {
    if (hexPath.length === 0) return [];

    const unique: string[] = [hexPath[0]];

    for (let i = 1; i < hexPath.length; i++) {
      if (hexPath[i] !== hexPath[i - 1]) {
        unique.push(hexPath[i]);
      }
    }

    return unique;
  }

  /**
   * Detect if hex path forms a closed loop
   */
  static isClosedLoop(hexPath: string[], minLoopSize: number = 3): boolean {
    if (hexPath.length < minLoopSize + 1) return false;

    const firstHex = hexPath[0];
    const lastHex = hexPath[hexPath.length - 1];

    // Check exact match
    if (firstHex === lastHex) return true;

    // Check if adjacent
    try {
      return h3.areNeighborCells(firstHex, lastHex);
    } catch (error) {
      return false;
    }
  }

  /**
   * Fill polygon with hexes
   */
  static fillPolygon(
    coordinates: [number, number][],
    resolution: number
  ): string[] {
    try {
      // Convert [lat, lng] to [lng, lat] for H3
      const polygon = [coordinates.map(([lat, lng]) => [lng, lat])];

      return h3.polygonToCells(polygon, resolution, true);
    } catch (error) {
      console.error("Error filling polygon:", error);
      return [];
    }
  }

  /**
   * Get hexes along a path (line)
   */
  static getPathHexes(hexPath: string[]): string[] {
    const allHexes = new Set<string>();

    for (let i = 0; i < hexPath.length - 1; i++) {
      try {
        const lineHexes = h3.gridPathCells(hexPath[i], hexPath[i + 1]);
        lineHexes.forEach((hex) => allHexes.add(hex));
      } catch (error) {
        // If gridPathCells fails, just add both endpoints
        allHexes.add(hexPath[i]);
        allHexes.add(hexPath[i + 1]);
      }
    }

    return Array.from(allHexes);
  }

  /**
   * Get parent region for a hex
   */
  static getRegionForHex(hexId: string, regionResolution: number = 4): string {
    try {
      return h3.cellToParent(hexId, regionResolution);
    } catch (error) {
      console.error("Error getting region for hex:", error);
      throw error;
    }
  }

  /**
   * Group hexes by region
   */
  static groupByRegion(
    hexes: string[],
    regionResolution: number = 4
  ): Map<string, string[]> {
    const regions = new Map<string, string[]>();

    for (const hex of hexes) {
      try {
        const regionId = this.getRegionForHex(hex, regionResolution);

        if (!regions.has(regionId)) {
          regions.set(regionId, []);
        }

        regions.get(regionId)!.push(hex);
      } catch (error) {
        console.error("Error grouping hex by region:", error);
      }
    }

    return regions;
  }

  /**
   * Get regions in viewport bounds
   */
  /**
   * Get regions in viewport bounds (simpler approach)
   */
  static getViewportRegions(
    bounds: { west: number; south: number; east: number; north: number },
    gameResolution: number,
    regionResolution: number = 4
  ): string[] {
    try {
      // Sample points across the viewport to find regions
      const regions = new Set<string>();

      // Sample 5x5 grid of points across viewport
      const lngStep = (bounds.east - bounds.west) / 5;
      const latStep = (bounds.north - bounds.south) / 5;

      for (let lng = bounds.west; lng <= bounds.east; lng += lngStep) {
        for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
          try {
            const hex = h3.latLngToCell(lat, lng, gameResolution);
            const regionId = h3.cellToParent(hex, regionResolution);
            regions.add(regionId);
          } catch (error) {
            // Skip invalid coordinates
          }
        }
      }

      // Also check the four corners specifically
      const corners = [
        [bounds.south, bounds.west],
        [bounds.south, bounds.east],
        [bounds.north, bounds.west],
        [bounds.north, bounds.east],
      ];

      corners.forEach(([lat, lng]) => {
        try {
          const hex = h3.latLngToCell(lat, lng, gameResolution);
          const regionId = h3.cellToParent(hex, regionResolution);
          regions.add(regionId);
        } catch (error) {
          // Skip invalid coordinates
        }
      });

      return Array.from(regions);
    } catch (error) {
      console.error("Error getting viewport regions:", error);
      return [];
    }
  }
}

