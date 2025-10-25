import mongoose, { Schema, Document } from "mongoose";

interface IPath extends Document {
  user: string;
  type: "closed_loop" | "open_path" | "single_hex";
  coordinates: [number, number][];
  hexPath: string[];
  hexesCaptured: number;
  boundaryHexes: number;
  interiorHexes: number;
  regionsAffected: string[];
  conflicts: Map<string, string>;
  timestamp: number;
  processingTime: number;
}

const PathSchema = new Schema<IPath>(
  {
    user: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["closed_loop", "open_path", "single_hex"],
      required: true,
    },
    coordinates: {
      type: [[Number]],
      required: true,
    },
    hexPath: [{ type: String }],
    hexesCaptured: { type: Number, required: true },
    boundaryHexes: { type: Number, required: true },
    interiorHexes: { type: Number, required: true },
    regionsAffected: [{ type: String, index: true }],
    conflicts: {
      type: Map,
      of: String,
      default: new Map(),
    },
    timestamp: { type: Number, default: Date.now },
    processingTime: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Index for querying user paths
PathSchema.index({ user: 1, timestamp: -1 });

export const PathModel = mongoose.models.Path || mongoose.model<IPath>("Path", PathSchema);

