import { Router, Request, Response } from "express";
import { QuestCompletionService } from "../services/quest-completion.service";

const router = Router();

/**
 * POST /api/quest-completions
 * Register a quest completion
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { questId, userId } = req.body;

    if (!questId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: questId, userId",
      });
    }

    const result = await QuestCompletionService.registerCompletion(
      questId,
      userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error registering completion:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to register completion",
    });
  }
});

/**
 * GET /api/quest-completions/:completionId
 * Get a specific completion
 */
router.get("/:completionId", async (req: Request, res: Response) => {
  try {
    const { completionId } = req.params;
    const result = await QuestCompletionService.getCompletion(completionId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Error getting completion:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get completion",
    });
  }
});

/**
 * GET /api/quest-completions/user/:userId/pending
 * Get user's pending completions
 */
router.get("/user/:userId/pending", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await QuestCompletionService.getUserPendingCompletions(userId);
    res.json(result);
  } catch (error: any) {
    console.error("Error getting user completions:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get completions",
    });
  }
});

/**
 * PATCH /api/quest-completions/:completionId/mint
 * Mark completion as minted
 */
router.patch("/:completionId/mint", async (req: Request, res: Response) => {
  try {
    const { completionId } = req.params;
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        error: "Missing transactionHash",
      });
    }

    const result = await QuestCompletionService.markAsMinted(
      completionId,
      transactionHash
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Error marking as minted:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update completion",
    });
  }
});

export default router;

