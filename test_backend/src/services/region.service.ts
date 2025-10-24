import { Region, User } from "../types";
import { H3Service } from "./h3.service";
import { mockRegions, mockUsers } from "../data/mock-data";

export class RegionService {
  /**
   * Get territories in viewport
   */
  static getTerritoriesInViewport(
    bounds: { west: number; south: number; east: number; north: number },
    resolution: number = 8
  ): {
    regions: {
      [regionId: string]: { [hexId: string]: { user: string; color: string } };
    };
    regionIds: string[];
    totalHexes: number;
  } {
    // Get regions in viewport
    const regionIds = H3Service.getViewportRegions(bounds, resolution, 4);

    const regions: {
      [regionId: string]: { [hexId: string]: { user: string; color: string } };
    } = {};
    let totalHexes = 0;

    regionIds.forEach((regionId) => {
      const region = mockRegions.get(regionId);
      if (region) {
        regions[regionId] = {};
        Object.entries(region.territories).forEach(([hexId, territory]) => {
          regions[regionId][hexId] = {
            user: territory.user,
            color: territory.color,
          };
          totalHexes++;
        });
      }
    });

    return {
      regions,
      regionIds,
      totalHexes,
    };
  }

  /**
   * Get single region
   */
  static getRegion(regionId: string): Region | null {
    return mockRegions.get(regionId) || null;
  }

  /**
   * Batch update territories
   */
  static batchUpdate(updates: { [userId: string]: string[] }): {
    success: boolean;
    updated: number;
    users: number;
    regionsAffected: string[];
    conflicts: { [hexId: string]: { previous: string; new: string } };
  } {
    const conflicts: { [hexId: string]: { previous: string; new: string } } =
      {};
    const affectedRegions = new Set<string>();
    let totalUpdated = 0;

    Object.entries(updates).forEach(([userId, hexIds]) => {
      hexIds.forEach((hexId) => {
        try {
          const regionId = H3Service.getRegionForHex(hexId, 4);
          affectedRegions.add(regionId);

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

          // Check for conflict
          if (
            region.territories[hexId] &&
            region.territories[hexId].user !== userId
          ) {
            conflicts[hexId] = {
              previous: region.territories[hexId].user,
              new: userId,
            };
          }

          // Get user with proper typing
          const user: User | undefined = mockUsers.get(userId);

          // Update territory
          region.territories[hexId] = {
            user: userId,
            color: user?.color || "#E8E8E8",
            capturedAt: Date.now(),
            method: "click",
          };

          totalUpdated++;
        } catch (error) {
          console.error("Error updating hex:", error);
        }
      });
    });

    return {
      success: true,
      updated: totalUpdated,
      users: Object.keys(updates).length,
      regionsAffected: Array.from(affectedRegions),
      conflicts,
    };
  }
}
