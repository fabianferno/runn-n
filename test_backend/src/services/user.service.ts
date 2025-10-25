import { UserModel } from "../models/user.model";
import { User } from "../types";

export class UserService {
  /**
   * Create or get user by wallet address
   */
  static async createOrGetUser(walletAddress: string): Promise<User> {
    try {
      // Check if user already exists
      let user = await UserModel.findById(walletAddress);
      
      if (user) {
        // Update lastActive timestamp
        user.stats.lastActive = Date.now();
        await user.save();
        return user.toObject() as User;
      }

      // Generate a random color for new user
      const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
        "#F8C471", "#82E0AA", "#F1948A", "#85C1E9", "#D7BDE2"
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // Create new user
      const newUser = new UserModel({
        _id: walletAddress,
        color: randomColor,
        stats: {
          totalHexes: 0,
          totalRegions: 0,
          largestCapture: 0,
          totalCaptures: 0,
          lastActive: Date.now(),
        },
        activeRegions: [],
        createdAt: Date.now(),
      });

      await newUser.save();
      return newUser.toObject() as User;
    } catch (error) {
      console.error("Error creating/getting user:", error);
      throw error;
    }
  }

  /**
   * Get user by wallet address
   */
  static async getUser(walletAddress: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(walletAddress);
      return user ? user.toObject() as User : null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  /**
   * Update user stats
   */
  static async updateUserStats(
    walletAddress: string,
    statsUpdate: Partial<User['stats']>
  ): Promise<User | null> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        walletAddress,
        {
          $set: {
            ...statsUpdate,
            "stats.lastActive": Date.now(),
          },
        },
        { new: true }
      );
      
      return user ? user.toObject() as User : null;
    } catch (error) {
      console.error("Error updating user stats:", error);
      throw error;
    }
  }

  /**
   * Add active region to user
   */
  static async addActiveRegion(
    walletAddress: string,
    regionId: string
  ): Promise<User | null> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        walletAddress,
        {
          $addToSet: { activeRegions: regionId },
          $inc: { "stats.totalRegions": 1 },
          $set: { "stats.lastActive": Date.now() },
        },
        { new: true }
      );
      
      return user ? user.toObject() as User : null;
    } catch (error) {
      console.error("Error adding active region:", error);
      throw error;
    }
  }

  /**
   * Get all users (for leaderboard)
   */
  static async getAllUsers(limit: number = 100): Promise<User[]> {
    try {
      const users = await UserModel.find()
        .sort({ "stats.totalHexes": -1 })
        .limit(limit);
      
      return users.map(user => user.toObject() as User);
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }
}
