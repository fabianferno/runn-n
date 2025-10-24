import { Region } from "../types";
import { H3Service } from "./h3.service";
import { RegionModel } from "../models/region.model";
import { mockUsers } from "../data/mock-data";

export class RegionService {
  /**
   * Get territories in viewport
   */
  static async getTerritoriesInViewport(
    bounds: { west: number; south: number; east: number; north: number },
    resolution: number = 11
  ): Promise<{
    regions: {
      [regionId: string]: { [hexId: string]: { user: string; color: string } };
    };
    regionIds: string[];
    totalHexes: number;
  }> {
    // Get regions in viewport
    const regionIds = H3Service.getViewportRegions(bounds, resolution, 4);

    console.log(
      `🔍 Loading ${regionIds.length} regions from MongoDB for viewport`
    );
    console.log(`Region IDs:`, regionIds);

    // Fetch regions from MongoDB
    const regionDocs = await RegionModel.find({
      _id: { $in: regionIds },
    });

    console.log(`📦 Found ${regionDocs.length} regions in MongoDB`);

    const regions: {
      [regionId: string]: { [hexId: string]: { user: string; color: string } };
    } = {};
    let totalHexes = 0;

    regionDocs.forEach((region) => {
      console.log(`Region ${region._id}: ${region.territories.size} hexes`);
      regions[region._id] = {};
      region.territories.forEach((territory, hexId) => {
        regions[region._id][hexId] = {
          user: territory.user,
          color: territory.color,
        };
        totalHexes++;
      });
    });

    console.log(`✅ Returning ${totalHexes} total hexes`);

    return {
      regions,
      regionIds,
      totalHexes,
    };
  }

  /**
   * Get single region
   */
  static async getRegion(regionId: string): Promise<Region | null> {
    const region = await RegionModel.findById(regionId);

    if (!region) {
      return null;
    }

    // Convert Map to plain object
    const territories: any = {};
    region.territories.forEach((territory, hexId) => {
      territories[hexId] = territory;
    });

    const playerCounts: any = {};
    region.metadata.playerCounts.forEach((count, playerId) => {
      playerCounts[playerId] = count;
    });

    return {
      _id: region._id,
      territories,
      metadata: {
        hexCount: region.metadata.hexCount,
        lastUpdate: region.metadata.lastUpdate,
        playerCounts,
        contestedBy: region.metadata.contestedBy,
      },
    };
  }

  /**
   * Batch update territories
   */
  static async batchUpdate(updates: { [userId: string]: string[] }): Promise<{
    success: boolean;
    updated: number;
    users: number;
    regionsAffected: string[];
    conflicts: { [hexId: string]: { previous: string; new: string } };
  }> {
    const conflicts: { [hexId: string]: { previous: string; new: string } } =
      {};
    const affectedRegions = new Set<string>();
    let totalUpdated = 0;

    for (const [userId, hexIds] of Object.entries(updates)) {
      const user = mockUsers.get(userId);
      const color = user?.color || "#E8E8E8";

      // Group hexes by region
      const hexesByRegion = new Map<string, string[]>();

      for (const hexId of hexIds) {
        try {
          const regionId = H3Service.getRegionForHex(hexId, 4);
          if (!hexesByRegion.has(regionId)) {
            hexesByRegion.set(regionId, []);
          }
          hexesByRegion.get(regionId)!.push(hexId);
          affectedRegions.add(regionId);
        } catch (error) {
          console.error("Error grouping hex:", error);
        }
      }

      // Update each region
      for (const [regionId, regionHexes] of hexesByRegion.entries()) {
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

        for (const hexId of regionHexes) {
          // Check for conflict
          const existingTerritory = region.territories.get(hexId);
          if (existingTerritory && existingTerritory.user !== userId) {
            conflicts[hexId] = {
              previous: existingTerritory.user,
              new: userId,
            };
          }

          // Update territory
          region.territories.set(hexId, {
            user: userId,
            color,
            capturedAt: Date.now(),
            method: "click",
          });

          totalUpdated++;
        }

        // Update metadata
        region.metadata.hexCount = region.territories.size;
        region.metadata.lastUpdate = Date.now();

        const currentCount = region.metadata.playerCounts.get(userId) || 0;
        region.metadata.playerCounts.set(
          userId,
          currentCount + regionHexes.length
        );

        if (!region.metadata.contestedBy.includes(userId)) {
          region.metadata.contestedBy.push(userId);
        }

        await region.save();
      }
    }

    return {
      success: true,
      updated: totalUpdated,
      users: Object.keys(updates).length,
      regionsAffected: Array.from(affectedRegions),
      conflicts,
    };
  }
}
