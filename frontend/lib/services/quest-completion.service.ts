import { QuestCompletionModel } from "../models/quest-completion.model";
import { QuestModel } from "../models/quest.model";

export class QuestCompletionService {
  /**
   * Register a quest completion
   */
  static async registerCompletion(
    questId: string,
    userId: string
  ): Promise<{ success: boolean; completionId?: string; error?: string; data?: {questId: string; dataCoinAddress: string; mintAmount: number; status: string} }> {
    try {
      // Get quest details
      const quest = await QuestModel.findById(questId);
      if (!quest) {
        return { success: false, error: "Quest not found" };
      }

      if (!quest.dataCoinAddress) {
        return { success: false, error: "Quest has no DataCoin configured" };
      }

      // Check if user already completed this quest
      const existingCompletion = await QuestCompletionModel.findOne({
        questId,
        userId,
      });

      if (existingCompletion && existingCompletion.status === "minted") {
        return {
          success: false,
          error: "Quest already completed and minted",
        };
      }

      // If pending, return existing
      if (existingCompletion && existingCompletion.status === "pending") {
        return {
          success: true,
          completionId: (existingCompletion._id as {toString: () => string}).toString(),
          data: {
            questId: (quest._id as {toString: () => string}).toString(),
            dataCoinAddress: quest.dataCoinAddress,
            mintAmount: this.calculateMintAmount(quest.difficulty),
            status: "pending",
          },
        };
      }

      // Calculate mint amount based on quest difficulty
      const mintAmount = this.calculateMintAmount(quest.difficulty);

      // Create completion record
      const completion = new QuestCompletionModel({
        questId,
        userId,
        dataCoinAddress: quest.dataCoinAddress,
        mintAmount,
        status: "pending",
      });

      await completion.save();

      console.log(`✅ Quest completion registered: ${completion._id}`);

      return {
        success: true,
        completionId: (completion._id as {toString: () => string}).toString(),
        data: {
          questId: (quest._id as {toString: () => string}).toString(),
          dataCoinAddress: quest.dataCoinAddress,
          mintAmount,
          status: "pending",
        },
      };
    } catch (error: unknown) {
      console.error("Error registering quest completion:", error);
      return {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to register completion",
      };
    }
  }

  /**
   * Calculate mint amount based on difficulty
   */
  private static calculateMintAmount(difficulty: string): number {
    const amounts: { [key: string]: number } = {
      easy: 10,
      medium: 25,
      hard: 50,
      expert: 100,
    };
    return amounts[difficulty.toLowerCase()] || 10;
  }

  /**
   * Get completion by ID
   */
  static async getCompletion(completionId: string) {
    try {
      const completion = await QuestCompletionModel.findById(completionId);
      
      if (!completion) {
        return {
          success: false,
          error: "Completion not found",
        };
      }

      return {
        success: true,
        completion: {
          id: (completion._id as {toString: () => string}).toString(),
          questId: completion.questId,
          userId: completion.userId,
          dataCoinAddress: completion.dataCoinAddress,
          mintAmount: completion.mintAmount,
          status: completion.status,
          transactionHash: completion.transactionHash,
          mintedAt: completion.mintedAt,
          createdAt: completion.createdAt,
        },
      };
    } catch (error: unknown) {
      console.error("Error getting completion:", error);
      return {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to get completion",
      };
    }
  }

  /**
   * Get user's pending completions
   */
  static async getUserPendingCompletions(userId: string) {
    try {
      const completions = await QuestCompletionModel.find({
        userId,
        status: "pending",
      }).sort({ createdAt: -1 });

      return {
        success: true,
        completions: completions.map((c) => ({
          id: (c._id as {toString: () => string}).toString(),
          questId: c.questId,
          dataCoinAddress: c.dataCoinAddress,
          mintAmount: c.mintAmount,
          status: c.status,
          createdAt: c.createdAt,
        })),
      };
    } catch (error: unknown) {
      console.error("Error getting user completions:", error);
      return {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to get completions",
      };
    }
  }

  /**
   * Mark completion as minted
   */
  static async markAsMinted(
    completionId: string,
    transactionHash: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await QuestCompletionModel.findByIdAndUpdate(completionId, {
        status: "minted",
        transactionHash,
        mintedAt: new Date(),
      });

      return { success: true };
    } catch (error: unknown) {
      console.error("Error marking as minted:", error);
      return {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to update completion",
      };
    }
  }

  /**
   * Mark completion as failed
   */
  static async markAsFailed(
    completionId: string,
    errorMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await QuestCompletionModel.findByIdAndUpdate(completionId, {
        status: "failed",
        errorMessage,
      });

      return { success: true };
    } catch (error: unknown) {
      console.error("Error marking as failed:", error);
      return {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to update completion",
      };
    }
  }
}

