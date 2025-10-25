import mongoose, { Schema, Document } from "mongoose";

interface IQuest extends Document {
  // Quest information
  questName: string;
  questDescription: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  
  // DataCoin information
  coinName: string;
  coinSymbol: string;
  coinDescription: string;
  tokenURI: string;
  
  // Allocation configuration (basis points)
  creatorAllocationBps: number;
  contributorsAllocationBps: number;
  liquidityAllocationBps: number;
  creatorVestingDays: number;
  
  // Lock asset configuration
  lockAsset: string;
  lockAmount: number;
  
  // Chain configuration
  chainName: string;
  
  // Creator info
  creator: string;
  
  // Blockchain data (populated after creation)
  dataCoinAddress?: string;
  poolAddress?: string;
  
  // Status
  status: "active" | "completed" | "cancelled";
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema = new Schema<IQuest>(
  {
    questName: { type: String, required: true, index: true },
    questDescription: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      required: true,
    },
    coinName: { type: String, required: true },
    coinSymbol: { type: String, required: true },
    coinDescription: { type: String, required: true },
    tokenURI: { type: String, required: true },
    creatorAllocationBps: { type: Number, required: true },
    contributorsAllocationBps: { type: Number, required: true },
    liquidityAllocationBps: { type: Number, required: true },
    creatorVestingDays: { type: Number, required: true },
    lockAsset: { type: String, required: true },
    lockAmount: { type: Number, required: true },
    chainName: { type: String, required: true },
    creator: { type: String, required: true, index: true },
    dataCoinAddress: { type: String, index: true },
    poolAddress: { type: String },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for querying
QuestSchema.index({ creator: 1, createdAt: -1 });
QuestSchema.index({ status: 1, createdAt: -1 });
QuestSchema.index({ difficulty: 1 });

export const QuestModel = mongoose.model<IQuest>("Quest", QuestSchema);
