import { Router, Request, Response } from "express";
import { UserService } from "../services/user.service";

const router = Router();

/**
 * POST /api/users/auth
 * Create or authenticate user with wallet address
 */
router.post("/auth", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    // Validate wallet address format (basic check)
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format",
      });
    }

    const user = await UserService.createOrGetUser(walletAddress);

    res.json({
      success: true,
      user,
      message: user.stats.totalCaptures === 0 ? "New user created" : "User authenticated",
    });
  } catch (error: any) {
    console.error("Error authenticating user:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/users/:userId
 * Get user stats
 */
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await UserService.getUser(userId);

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

/**
 * GET /api/users
 * Get all users (for leaderboard)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const users = await UserService.getAllUsers(limit);

    res.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error: any) {
    console.error("Error getting all users:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default router;
