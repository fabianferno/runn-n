import { UserModel, IUser } from "../models/user.model";

export class UserService {
  /**
   * Create or get user by wallet address
   */
  static async createOrGetUser(walletAddress: string) {
    try {
      // Check if user already exists
      const user = await UserModel.findById(walletAddress);
      
      if (user) {
        // Update lastActive timestamp
        user.stats.lastActive = Date.now();
        await user.save();
        return user.toObject();
      }

      // Generate a random color for new user
      const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
        "#F8C471", "#82E0AA", "#F1948A", "#85C1E9", "#D7BDE2",
        "#F5CBA7", "#F0B27A", "#E67E22", "#D35400", "#C0392B",
        "#9B59B6", "#8E44AD", "#7D3C98", "#6C3483", "#5B2C6F",
        "#4A235A", "#391C46", "#281532", "#170E1E", "#06070A"
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
      return newUser.toObject();
    } catch (error) {
      console.error("Error creating/getting user:", error);
      throw error;
    }
  }

  /**
   * Get user by wallet address
   */
  static async getUser(walletAddress: string) {
    try {
      const user = await UserModel.findById(walletAddress);
      return user ? user.toObject() : null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  /**
   * Update user stats
   */
  static async updateUserStats(walletAddress: string, stats: Partial<IUser['stats']>) {
    try {
      const user = await UserModel.findById(walletAddress);
      if (!user) {
        throw new Error("User not found");
      }

      user.stats = { ...user.stats, ...stats };
      await user.save();
      return user.toObject();
    } catch (error) {
      console.error("Error updating user stats:", error);
      throw error;
    }
  }

  /**
   * Get leaderboard (top users by total captures)
   */
  static async getLeaderboard(limit: number = 10) {
    try {
      const users = await UserModel.find()
        .sort({ "stats.totalCaptures": -1 })
        .limit(limit);
      
      return users.map(user => user.toObject());
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }
}

