import { Region, User, PathHistory } from "@/types/backend";
// Mock regions with territories
export const mockRegions = new Map<string, Region>([
  [
    "84618c4ffffffff",
    {
      _id: "84618c4ffffffff",
      territories: {
        "8b618c48991bfff": {
          user: "player1",
          color: "#FF6B6B",
          capturedAt: Date.now() - 3600000,
          method: "loop",
        },
        "8b618c48991bffe": {
          user: "player2",
          color: "#4ECDC4",
          capturedAt: Date.now() - 7200000,
          method: "click",
        },
        "8b618c48991bffd": {
          user: "player1",
          color: "#FF6B6B",
          capturedAt: Date.now() - 1800000,
          method: "line",
        },
      },
      metadata: {
        hexCount: 3,
        lastUpdate: Date.now() - 1800000,
        playerCounts: {
          player1: 2,
          player2: 1,
        },
        contestedBy: ["player1", "player2"],
      },
    },
  ],
  [
    "84618c5ffffffff",
    {
      _id: "84618c5ffffffff",
      territories: {
        "8b618c58991bfff": {
          user: "player3",
          color: "#95E1D3",
          capturedAt: Date.now() - 5400000,
          method: "loop",
        },
        "8b618c58991bffe": {
          user: "player1",
          color: "#FF6B6B",
          capturedAt: Date.now() - 2400000,
          method: "click",
        },
      },
      metadata: {
        hexCount: 2,
        lastUpdate: Date.now() - 2400000,
        playerCounts: {
          player1: 1,
          player3: 1,
        },
        contestedBy: ["player1", "player3"],
      },
    },
  ],
]);

// Mock users
export const mockUsers: Map<string, User> = new Map([
  [
    "player1",
    {
      _id: "player1",
      color: "#FF6B6B",
      stats: {
        totalHexes: 5247,
        totalRegions: 12,
        largestCapture: 1583,
        totalCaptures: 47,
        lastActive: Date.now(),
      },
      activeRegions: ["84618c4ffffffff", "84618c5ffffffff"],
      createdAt: Date.now() - 86400000 * 30,
    },
  ],
  [
    "player2",
    {
      _id: "player2",
      color: "#4ECDC4",
      stats: {
        totalHexes: 4123,
        totalRegions: 9,
        largestCapture: 982,
        totalCaptures: 38,
        lastActive: Date.now() - 3600000,
      },
      activeRegions: ["84618c4ffffffff"],
      createdAt: Date.now() - 86400000 * 25,
    },
  ],
  [
    "player3",
    {
      _id: "player3",
      color: "#95E1D3",
      stats: {
        totalHexes: 3456,
        totalRegions: 7,
        largestCapture: 756,
        totalCaptures: 29,
        lastActive: Date.now() - 7200000,
      },
      activeRegions: ["84618c5ffffffff"],
      createdAt: Date.now() - 86400000 * 20,
    },
  ],
]);

// Mock path history
export const mockPaths: Map<string, PathHistory> = new Map([
  [
    "path_1234567890123",
    {
      _id: "path_1234567890123",
      user: "player1",
      type: "closed_loop",
      coordinates: [
        [37.7749, -122.4194],
        [37.775, -122.418],
        [37.774, -122.418],
        [37.774, -122.4194],
        [37.7749, -122.4194],
      ],
      hexPath: [
        "8b618c48991bfff",
        "8b618c48991bffe",
        "8b618c48991bffd",
        "8b618c48991bffc",
      ],
      hexesCaptured: 87,
      boundaryHexes: 12,
      interiorHexes: 75,
      regionsAffected: ["84618c4ffffffff", "84618c5ffffffff"],
      conflicts: {
        "8b618c48991bfff": "player2",
        "8b618c48991bffe": "player2",
      },
      timestamp: Date.now() - 3600000,
      processingTime: 145,
    },
  ],
]);

// Helper function to get all territories for a user
export function getUserTerritories(
  userId: string
): Array<{ hexId: string; regionId: string }> {
  const territories: Array<{ hexId: string; regionId: string }> = [];

  mockRegions.forEach((region, regionId) => {
    Object.entries(region.territories).forEach(([hexId, territory]) => {
      if (territory.user === userId) {
        territories.push({ hexId, regionId });
      }
    });
  });

  return territories;
}

// Helper function to get territory owner
export function getTerritoryOwner(hexId: string): string | null {
  for (const [_, region] of mockRegions) {
    if (region.territories[hexId]) {
      return region.territories[hexId].user;
    }
  }
  return null;
}

