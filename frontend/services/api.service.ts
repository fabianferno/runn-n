import {
  PathInput,
  PathResponse,
  BatchUpdateRequest,
  BatchUpdateResponse,
} from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api";

export class ApiService {
  /**
   * Get territories in viewport
   */
  /**
   * Get territories in viewport
   */
  static async getTerritoriesInViewport(
    bounds: { west: number; south: number; east: number; north: number },
    resolution: number = 11
  ) {
    const boundsStr = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
    const url = `${API_BASE_URL}/territories/viewport?bounds=${boundsStr}&resolution=${resolution}`;

    console.log("🌐 Fetching from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch territories");
    }

    const data = await response.json();
    console.log("📥 Raw API response:", data);

    return data;
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

  /**
   * Create a quest
   */
  static async createQuest(questData: any) {
    const response = await fetch(`${API_BASE_URL}/quests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questData),
    });

    if (!response.ok) {
      throw new Error("Failed to create quest");
    }

    return response.json();
  }

  /**
   * Get a quest by ID
   */
  static async getQuest(questId: string) {
    const response = await fetch(`${API_BASE_URL}/quests/${questId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch quest");
    }

    return response.json();
  }

  /**
   * Get all quests
   */
  static async getAllQuests(filters?: {
    creator?: string;
    status?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.creator) queryParams.append("creator", filters.creator);
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.difficulty) queryParams.append("difficulty", filters.difficulty);
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    if (filters?.offset) queryParams.append("offset", filters.offset.toString());

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/quests?${queryString}`
      : `${API_BASE_URL}/quests`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch quests");
    }

    return response.json();
  }

  /**
   * Update a quest
   */
  static async updateQuest(questId: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/quests/${questId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update quest");
    }

    return response.json();
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(questId: string) {
    const response = await fetch(`${API_BASE_URL}/quests/${questId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete quest");
    }

    return response.json();
  }

  /**
   * Register quest completion
   */
  static async registerQuestCompletion(questId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/quest-completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questId, userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to register quest completion");
    }

    return response.json();
  }

  /**
   * Get user's pending completions
   */
  static async getUserPendingCompletions(userId: string) {
    const response = await fetch(
      `${API_BASE_URL}/quest-completions/user/${userId}/pending`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pending completions");
    }

    return response.json();
  }

  /**
   * Get completion by ID
   */
  static async getCompletion(completionId: string) {
    const response = await fetch(
      `${API_BASE_URL}/quest-completions/${completionId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch completion");
    }

    return response.json();
  }

  /**
   * Mark completion as minted
   */
  static async markCompletionAsMinted(
    completionId: string,
    transactionHash: string
  ) {
    const response = await fetch(
      `${API_BASE_URL}/quest-completions/${completionId}/mint`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionHash }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to mark as minted");
    }

    return response.json();
  }
}
