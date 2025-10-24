import { Router, Request, Response } from "express";
import { PathInput, ViewportQuery } from "../types";
import { RegionService } from "../services/region.service";
import { PathService } from "../services/path.service";
import { mockPaths } from "../data/mock-data";

const router = Router();

/**
 * GET /api/territories/viewport
 * Get territories in viewport
 */
router.get("/viewport", (req: Request, res: Response) => {
  try {
    const { bounds, resolution } = req.query as any;

    if (!bounds) {
      return res.status(400).json({
        success: false,
        error: "Bounds parameter is required",
      });
    }

    // Parse bounds: "lng1,lat1,lng2,lat2"
    const [west, south, east, north] = bounds.split(",").map(Number);

    if ([west, south, east, north].some(isNaN)) {
      return res.status(400).json({
        success: false,
        error: "Invalid bounds format",
      });
    }

    const result = RegionService.getTerritoriesInViewport(
      { west, south, east, north },
      parseInt(resolution) || 8
    );

    res.json({
      success: true,
      ...result,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Error getting viewport territories:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/territories/region/:regionId
 * Get single region
 */
/**
 * GET /api/territories/region/:regionId
 * Get single region
 */
router.get("/region/:regionId", async (req: Request, res: Response) => {
  try {
    const { regionId } = req.params;
    const region = await RegionService.getRegion(regionId); // Add await here

    if (!region) {
      return res.status(404).json({
        success: false,
        error: "Region not found",
      });
    }

    res.json({
      success: true,
      regionId: region._id,
      territories: region.territories,
      metadata: region.metadata,
    });
  } catch (error: any) {
    console.error("Error getting region:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * POST /api/territories/capture-path
 * Capture territories from path
 */
router.post("/capture-path", async (req: Request, res: Response) => {
  try {
    const input: PathInput = req.body;

    if (!input.user || !input.color || !input.path) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user, color, path",
      });
    }

    const result = await PathService.processPath(input);
    res.json(result);
  } catch (error: any) {
    console.error("Error processing path:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process path",
    });
  }
});

/**
 * POST /api/territories/batch
 * Batch update territories
 */
router.post("/batch", (req: Request, res: Response) => {
  try {
    const { updates } = req.body;

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
      });
    }

    const result = RegionService.batchUpdate(updates);
    res.json(result);
  } catch (error: any) {
    console.error("Error batch updating:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/territories/paths/:userId
 * Get path history for user
 */
router.get("/paths/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = "50", offset = "0" } = req.query;

    const userPaths = Array.from(mockPaths.values())
      .filter((path) => path.user === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      );

    res.json({
      success: true,
      paths: userPaths,
      total: userPaths.length,
      hasMore: userPaths.length === parseInt(limit as string),
    });
  } catch (error: any) {
    console.error("Error getting paths:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/territories/stats
 * Get global stats
 */
router.get("/stats", (req: Request, res: Response) => {
  try {
    const mockUsers = require("../data/mock-data").mockUsers;

    // Calculate stats
    let totalHexes = 0;
    const activeRegions = new Set<string>();

    require("../data/mock-data").mockRegions.forEach((region: any) => {
      totalHexes += region.metadata.hexCount;
      activeRegions.add(region._id);
    });

    // Create leaderboard
    const leaderboard = Array.from(mockUsers.values())
      .sort((a: any, b: any) => b.stats.totalHexes - a.stats.totalHexes)
      .slice(0, 10)
      .map((user: any, index: number) => ({
        userId: user._id,
        username: user.username,
        color: user.color,
        hexCount: user.stats.totalHexes,
        rank: index + 1,
      }));

    res.json({
      success: true,
      stats: {
        totalHexesCaptured: totalHexes,
        totalRegionsActive: activeRegions.size,
        totalPlayers: mockUsers.size,
        totalPaths: mockPaths.size,
        leaderboard,
        lastUpdate: Date.now(),
      },
    });
  } catch (error: any) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default router;
