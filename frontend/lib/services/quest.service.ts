import { QuestModel } from "../models/quest.model";
import { QuestInput, Quest, QuestResponse, QuestListResponse } from "@/types/backend/quest.types";

export class QuestService {
  /**
   * Create a new quest
   */
  static async createQuest(input: QuestInput): Promise<QuestResponse> {
    try {
      const questData = {
        ...input,
        status: input.status || "active",
      };

      const quest = new QuestModel(questData);
      await quest.save();

      return {
        success: true,
        quest: this.formatQuest(quest),
      };
    } catch (error: any) {
      console.error("Error creating quest:", error);
      return {
        success: false,
        error: error.message || "Failed to create quest",
      };
    }
  }

  /**
   * Get a quest by ID
   */
  static async getQuestById(questId: string): Promise<QuestResponse> {
    try {
      const quest = await QuestModel.findById(questId);

      if (!quest) {
        return {
          success: false,
          error: "Quest not found",
        };
      }

      return {
        success: true,
        quest: this.formatQuest(quest),
      };
    } catch (error: any) {
      console.error("Error getting quest:", error);
      return {
        success: false,
        error: error.message || "Failed to get quest",
      };
    }
  }

  /**
   * Update a quest
   */
  static async updateQuest(
    questId: string,
    updates: Partial<QuestInput>
  ): Promise<QuestResponse> {
    try {
      const quest = await QuestModel.findByIdAndUpdate(
        questId,
        { $set: updates },
        { new: true }
      );

      if (!quest) {
        return {
          success: false,
          error: "Quest not found",
        };
      }

      return {
        success: true,
        quest: this.formatQuest(quest),
      };
    } catch (error: any) {
      console.error("Error updating quest:", error);
      return {
        success: false,
        error: error.message || "Failed to update quest",
      };
    }
  }

  /**
   * Get all quests
   */
  static async getAllQuests(
    filters?: {
      creator?: string;
      status?: string;
      difficulty?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<QuestListResponse> {
    try {
      const query: any = {};

      if (filters?.creator) {
        query.creator = filters.creator;
      }

      if (filters?.status) {
        query.status = filters.status;
      }

      if (filters?.difficulty) {
        query.difficulty = filters.difficulty;
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const quests = await QuestModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await QuestModel.countDocuments(query);

      return {
        success: true,
        quests: quests.map((quest: any) => this.formatQuest(quest)),
        total,
      };
    } catch (error: any) {
      console.error("Error getting quests:", error);
      return {
        success: false,
        error: error.message || "Failed to get quests",
      };
    }
  }

  /**
   * Get quests by creator
   */
  static async getQuestsByCreator(
    creator: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<QuestListResponse> {
    try {
      const quests = await QuestModel.find({ creator })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await QuestModel.countDocuments({ creator });

      return {
        success: true,
        quests: quests.map((quest: any) => this.formatQuest(quest)),
        total,
      };
    } catch (error: any) {
      console.error("Error getting quests by creator:", error);
      return {
        success: false,
        error: error.message || "Failed to get quests",
      };
    }
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(questId: string): Promise<QuestResponse> {
    try {
      const quest = await QuestModel.findByIdAndDelete(questId);

      if (!quest) {
        return {
          success: false,
          error: "Quest not found",
        };
      }

      return {
        success: true,
        quest: this.formatQuest(quest),
      };
    } catch (error: any) {
      console.error("Error deleting quest:", error);
      return {
        success: false,
        error: error.message || "Failed to delete quest",
      };
    }
  }

  /**
   * Format quest document for response
   */
  private static formatQuest(quest: any): Quest {
    return {
      _id: quest._id.toString(),
      id: quest._id.toString(),
      questName: quest.questName,
      questDescription: quest.questDescription,
      difficulty: quest.difficulty,
      coinName: quest.coinName,
      coinSymbol: quest.coinSymbol,
      coinDescription: quest.coinDescription,
      tokenURI: quest.tokenURI,
      creatorAllocationBps: quest.creatorAllocationBps,
      contributorsAllocationBps: quest.contributorsAllocationBps,
      liquidityAllocationBps: quest.liquidityAllocationBps,
      creatorVestingDays: quest.creatorVestingDays,
      lockAsset: quest.lockAsset,
      lockAmount: quest.lockAmount,
      chainName: quest.chainName,
      creator: quest.creator,
      dataCoinAddress: quest.dataCoinAddress,
      poolAddress: quest.poolAddress,
      status: quest.status,
      createdAt: quest.createdAt.toISOString(),
      updatedAt: quest.updatedAt?.toISOString(),
    };
  }
}

