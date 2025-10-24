import { PathInput, PathResponse, PathHistory } from "../types";
import { H3Service } from "./h3.service";
import { mockPaths, mockRegions, mockUsers } from "../data/mock-data";

export class PathService {
  private static pathCounter = Date.now();

  /**
   * Process a path capture request
   */
  static async processPath(input: PathInput): Promise<PathResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validatePath(input);

      // STEP 1: Convert coordinates to hexes
      const hexPath = H3Service.pathToHexes(input.path, 8);

      // STEP 2: Remove consecutive duplicates
      const uniqueHexPath = H3Service.removeDuplicates(hexPath);

      // STEP 3: Detect loop
      const autoClose = input.options?.autoClose ?? true;
      const minLoopSize = input.options?.minLoopSize ?? 3;
      const isLoop =
        autoClose && H3Service.isClosedLoop(uniqueHexPath, minLoopSize);

      let filledHexes: string[];
      let pathType: "closed_loop" | "open_path" | "single_hex";
      let boundaryHexes: number;
      let interiorHexes: number;

      if (uniqueHexPath.length === 1) {
        // Single hex
        pathType = "single_hex";
        filledHexes = uniqueHexPath;
        boundaryHexes = 1;
        interiorHexes = 0;
      } else if (isLoop) {
        // STEP 4: Fill polygon (closed loop)
        pathType = "closed_loop";
        filledHexes = H3Service.fillPolygon(input.path, 8);
        boundaryHexes = uniqueHexPath.length;
        interiorHexes = filledHexes.length - boundaryHexes;
      } else {
        // Open path - just the boundary
        pathType = "open_path";
        filledHexes = H3Service.getPathHexes(uniqueHexPath);
        boundaryHexes = filledHexes.length;
        interiorHexes = 0;
      }

      // STEP 5: Group by regions
      const regionsMap = H3Service.groupByRegion(filledHexes, 4);
      const regionsAffected = Array.from(regionsMap.keys());

      // STEP 6: Detect conflicts and update mock data
      const conflicts: { [hexId: string]: string } = {};

      regionsMap.forEach((hexes, regionId) => {
        // Get or create region
        let region = mockRegions.get(regionId);
        if (!region) {
          region = {
            _id: regionId,
            territories: {},
            metadata: {
              hexCount: 0,
              lastUpdate: Date.now(),
              playerCounts: {},
              contestedBy: [],
            },
          };
          mockRegions.set(regionId, region);
        }

        // Update territories
        hexes.forEach((hexId) => {
          // Check for conflicts
          if (
            region!.territories[hexId] &&
            region!.territories[hexId].user !== input.user
          ) {
            conflicts[hexId] = region!.territories[hexId].user;

            // Decrement previous owner's count
            const prevUser = region!.territories[hexId].user;
            region!.metadata.playerCounts[prevUser] =
              (region!.metadata.playerCounts[prevUser] || 1) - 1;
          }

          // Update territory
          region!.territories[hexId] = {
            user: input.user,
            color: input.color,
            capturedAt: Date.now(),
            method:
              pathType === "closed_loop"
                ? "loop"
                : pathType === "open_path"
                ? "line"
                : "click",
          };
        });

        // Update metadata
        region.metadata.hexCount = Object.keys(region.territories).length;
        region.metadata.lastUpdate = Date.now();
        region.metadata.playerCounts[input.user] =
          (region.metadata.playerCounts[input.user] || 0) + hexes.length;

        if (!region.metadata.contestedBy.includes(input.user)) {
          region.metadata.contestedBy.push(input.user);
        }
      });

      // STEP 7: Update user stats
      const user = mockUsers.get(input.user);
      if (user) {
        user.stats.totalHexes +=
          filledHexes.length - Object.keys(conflicts).length;
        user.stats.totalCaptures += 1;
        user.stats.largestCapture = Math.max(
          user.stats.largestCapture,
          filledHexes.length
        );
        user.stats.lastActive = Date.now();

        regionsAffected.forEach((regionId) => {
          if (!user.activeRegions.includes(regionId)) {
            user.activeRegions.push(regionId);
            user.stats.totalRegions += 1;
          }
        });
      }

      // STEP 8: Create path history
      const pathId = `path_${this.pathCounter++}`;
      const pathHistory: PathHistory = {
        _id: pathId,
        user: input.user,
        type: pathType,
        coordinates: input.path,
        hexPath: uniqueHexPath,
        hexesCaptured: filledHexes.length,
        boundaryHexes,
        interiorHexes,
        regionsAffected,
        conflicts,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
      };

      mockPaths.set(pathId, pathHistory);

      // STEP 9: Return response
      const response: PathResponse = {
        success: true,
        pathType,
        hexPath: uniqueHexPath,
        uniqueHexes: uniqueHexPath.length,
        loopClosed: isLoop,
        hexesCaptured: filledHexes.length,
        boundaryHexes,
        interiorHexes,
        regionsAffected,
        conflicts,
        processingTime: Date.now() - startTime,
        pathId,
      };

      return response;
    } catch (error) {
      console.error("Error processing path:", error);
      throw error;
    }
  }

  /**
   * Validate path input
   */
  private static validatePath(input: PathInput): void {
    if (!input.path || input.path.length === 0) {
      throw new Error("Path cannot be empty");
    }

    if (input.path.length > 100) {
      throw new Error("Path has too many points (max 100)");
    }

    // Validate coordinates
    for (const [lat, lng] of input.path) {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("Invalid coordinates");
      }
    }
  }
}
