import { Router, Request, Response } from "express";
import { QuestInput } from "../types/quest.types";
import { QuestService } from "../services/quest.service";

const router = Router();

/**
 * POST /api/quests
 * Create a new quest
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const input: QuestInput = req.body;

    // Validate required fields
    if (!input.questName || !input.questDescription || !input.creator) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: questName, questDescription, creator",
      });
    }

    const result = await QuestService.createQuest(input);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creating quest:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create quest",
    });
  }
});

/**
 * GET /api/quests/:questId
 * Get a quest by ID
 */
router.get("/:questId", async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;
    const result = await QuestService.getQuestById(questId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Error getting quest:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get quest",
    });
  }
});

/**
 * GET /api/quests
 * Get all quests with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { creator, status, difficulty, limit, offset } = req.query;

    const filters: any = {};
    if (creator) filters.creator = creator;
    if (status) filters.status = status;
    if (difficulty) filters.difficulty = difficulty;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = await QuestService.getAllQuests(filters);
    res.json(result);
  } catch (error: any) {
    console.error("Error getting quests:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get quests",
    });
  }
});

/**
 * PATCH /api/quests/:questId
 * Update a quest
 */
router.patch("/:questId", async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;
    const updates = req.body;

    const result = await QuestService.updateQuest(questId, updates);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Error updating quest:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update quest",
    });
  }
});

/**
 * DELETE /api/quests/:questId
 * Delete a quest
 */
router.delete("/:questId", async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;
    const result = await QuestService.deleteQuest(questId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Error deleting quest:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete quest",
    });
  }
});

export default router;
