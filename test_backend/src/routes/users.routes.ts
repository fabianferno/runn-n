import { Router, Request, Response } from "express";
import { mockUsers } from "../data/mock-data";

const router = Router();

/**
 * GET /api/users/:userId
 * Get user stats
 */
router.get("/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = mockUsers.get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default router;
