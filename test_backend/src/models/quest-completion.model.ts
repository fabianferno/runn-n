import mongoose, { Schema, Document } from "mongoose";

interface IQuestCompletion extends Document {
  questId: string;
  userId: string; // Wallet address
  dataCoinAddress: string;
  mintAmount: number;
  status: "pending" | "minted" | "failed";
  createdAt: Date;
  mintedAt?: Date;
  transactionHash?: string;
  errorMessage?: string;
}

const QuestCompletionSchema = new Schema<IQuestCompletion>(
  {
    questId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    dataCoinAddress: { type: String, required: true, index: true },
    mintAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "minted", "failed"],
      default: "pending",
    },
    transactionHash: { type: String },
    mintedAt: { type: Date },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for querying
QuestCompletionSchema.index({ questId: 1, userId: 1 });
QuestCompletionSchema.index({ status: 1, createdAt: -1 });

export const QuestCompletionModel = mongoose.model<IQuestCompletion>(
  "QuestCompletion",
  QuestCompletionSchema
);

