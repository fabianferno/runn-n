import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string; // Wallet address
  color: string;
  stats: {
    totalHexes: number;
    totalRegions: number;
    largestCapture: number;
    totalCaptures: number;
    lastActive: number;
  };
  activeRegions: string[];
  createdAt: number;
}

const UserSchema = new Schema<IUser>({
  _id: {
    type: String,
    required: true,
    unique: true,
  },
  color: {
    type: String,
    required: true,
    default: "#FF6B6B",
  },
  stats: {
    totalHexes: {
      type: Number,
      default: 0,
    },
    totalRegions: {
      type: Number,
      default: 0,
    },
    largestCapture: {
      type: Number,
      default: 0,
    },
    totalCaptures: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Number,
      default: Date.now,
    },
  },
  activeRegions: [{
    type: String,
  }],
  createdAt: {
    type: Number,
    default: Date.now,
  },
}, {
  timestamps: false, // We're using custom createdAt
});

// Index for faster queries
UserSchema.index({ _id: 1 });
UserSchema.index({ "stats.lastActive": -1 });

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

