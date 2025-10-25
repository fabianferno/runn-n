import mongoose, { Schema, Document } from "mongoose";
import { User } from "../types";

export interface IUser extends Document, Omit<User, '_id'> {
  _id: string;
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
UserSchema.index({ "stats.totalHexes": -1 });

export const UserModel = mongoose.model<IUser>("User", UserSchema);
