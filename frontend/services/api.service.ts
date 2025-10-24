import {
  PathInput,
  PathResponse,
  BatchUpdateRequest,
  BatchUpdateResponse,
} from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export class ApiService {
  /**
   * Get territories in viewport
   */
  static async getTerritoriesInViewport(
    bounds: { west: number; south: number; east: number; north: number },
    resolution: number = 11
  ) {
    const boundsStr = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
    const response = await fetch(
      `${API_BASE_URL}/territories/viewport?bounds=${boundsStr}&resolution=${resolution}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch territories");
    }

    return response.json();
  }

  /**
   * Capture path
   */
  static async capturePath(input: PathInput): Promise<PathResponse> {
    const response = await fetch(`${API_BASE_URL}/territories/capture-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error("Failed to capture path");
    }

    return response.json();
  }

  /**
   * Batch update territories
   */
  static async batchUpdate(
    updates: BatchUpdateRequest
  ): Promise<BatchUpdateResponse> {
    const response = await fetch(`${API_BASE_URL}/territories/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to batch update");
    }

    return response.json();
  }

  /**
   * Get user stats
   */
  static async getUserStats(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch user stats");
    }

    return response.json();
  }

  /**
   * Get global stats
   */
  static async getGlobalStats() {
    const response = await fetch(`${API_BASE_URL}/territories/stats`);

    if (!response.ok) {
      throw new Error("Failed to fetch global stats");
    }

    return response.json();
  }
}
