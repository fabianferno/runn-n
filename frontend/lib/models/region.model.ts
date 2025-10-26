import mongoose, { Schema, Document } from "mongoose";

interface ITerritory {
  user: string; // Wallet address
  color: string;
  capturedAt: number;
  method: "click" | "line" | "loop";
}

interface IRegion extends Document {
  _id: string; // Region hex ID
  territories: Map<string, ITerritory>;
  metadata: {
    hexCount: number;
    lastUpdate: number;
    playerCounts: Map<string, number>; // Map of wallet address -> hex count
    contestedBy: string[]; // Array of wallet addresses
  };
}

const TerritorySchema = new Schema(
  {
    user: { type: String, required: true },
    color: { type: String, required: true },
    capturedAt: { type: Number, required: true },
    method: { type: String, enum: ["click", "line", "loop"], required: true },
  },
  { _id: false }
);

const RegionSchema = new Schema<IRegion>(
  {
    _id: { type: String, required: true },
    territories: {
      type: Map,
      of: TerritorySchema,
      default: new Map(),
    },
    metadata: {
      hexCount: { type: Number, default: 0 },
      lastUpdate: { type: Number, default: Date.now },
      playerCounts: {
        type: Map,
        of: Number,
        default: new Map(),
      },
      contestedBy: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

export const RegionModel = (mongoose.models?.regions as mongoose.Model<IRegion>) || mongoose.model<IRegion>("regions", RegionSchema);

