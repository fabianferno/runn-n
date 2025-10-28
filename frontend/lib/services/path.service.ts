import { PathInput, PathResponse, PathHistory } from "@/types/backend";
import { H3Service } from "./h3.service";
import { mockUsers } from "../data/mock-data";
import { RegionModel } from "../models/region.model";
import { PathModel } from "../models/path.model";

export class PathService {
  /**
   * Process a path capture request
   */
  static async processPath(input: PathInput): Promise<PathResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validatePath(input);

      // STEP 1: Convert coordinates to hexes
      const hexPath = H3Service.pathToHexes(input.path, 11);

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
        pathType = "single_hex";
        filledHexes = uniqueHexPath;
        boundaryHexes = 1;
        interiorHexes = 0;
      } else if (isLoop) {
        pathType = "closed_loop";
        filledHexes = H3Service.fillPolygon(input.path, 11);
        boundaryHexes = uniqueHexPath.length;
        interiorHexes = filledHexes.length - boundaryHexes;
      } else {
        pathType = "open_path";
        filledHexes = H3Service.getPathHexes(uniqueHexPath);
        boundaryHexes = filledHexes.length;
        interiorHexes = 0;
      }

      console.log(`Processing ${pathType}: ${filledHexes.length} hexes`);

      // STEP 4: Group by regions
      const regionsMap = H3Service.groupByRegion(filledHexes, 4);
      const regionsAffected = Array.from(regionsMap.keys());

      // STEP 5: Detect conflicts and update MongoDB
      const conflicts: { [hexId: string]: string } = {};

      for (const [regionId, hexes] of regionsMap.entries()) {
        // Get or create region in MongoDB
        let region = await RegionModel.findById(regionId);

        if (!region) {
          region = new RegionModel({
            _id: regionId,
            territories: new Map(),
            metadata: {
              hexCount: 0,
              lastUpdate: Date.now(),
              playerCounts: new Map(),
              contestedBy: [],
            },
          });
        }

        // Update territories
        for (const hexId of hexes) {
          // Check for conflicts
          const existingTerritory = region.territories.get(hexId);
          if (existingTerritory && existingTerritory.user !== input.user) {
            conflicts[hexId] = existingTerritory.user;

            // Decrement previous owner's count
            const prevCount =
              region.metadata.playerCounts.get(existingTerritory.user) || 0;
            region.metadata.playerCounts.set(
              existingTerritory.user,
              Math.max(0, prevCount - 1)
            );
          }

          // Update territory
          region.territories.set(hexId, {
            user: input.user,
            color: input.color,
            capturedAt: Date.now(),
            method:
              pathType === "closed_loop"
                ? "loop"
                : pathType === "open_path"
                ? "line"
                : "click",
          });
        }

        // Update metadata
        region.metadata.hexCount = region.territories.size;
        region.metadata.lastUpdate = Date.now();

        const currentCount = region.metadata.playerCounts.get(input.user) || 0;
        region.metadata.playerCounts.set(
          input.user,
          currentCount + hexes.length
        );

        if (!region.metadata.contestedBy.includes(input.user)) {
          region.metadata.contestedBy.push(input.user);
        }

        // Save to MongoDB
        await region.save();
        console.log(`✅ Saved region ${regionId} with ${hexes.length} hexes`);
      }

      // STEP 6: Update user stats (still using mock data)
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

      // STEP 7: Create path history in MongoDB
      const pathDoc = new PathModel({
        user: input.user,
        type: pathType,
        coordinates: input.path,
        hexPath: uniqueHexPath,
        hexesCaptured: filledHexes.length,
        boundaryHexes,
        interiorHexes,
        regionsAffected,
        conflicts: new Map(Object.entries(conflicts)),
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
      });

      await pathDoc.save();
      console.log(`✅ Saved path ${pathDoc._id}`);

      // STEP 8: Return response
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
        pathId: (pathDoc._id as {toString: () => string}).toString(),
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

    if (input.path.length > 500) {
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

