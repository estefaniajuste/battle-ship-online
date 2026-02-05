import mongoose from "mongoose";

const gameResultSchema = new mongoose.Schema(
  {
    winnerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    loserUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    winnerShots: {
      type: Number,
      required: true,
      min: 0
    },
    loserShots: {
      type: Number,
      required: true,
      min: 0
    },
    playedAt: {
      type: Date,
      default: () => new Date()
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const GameResult = mongoose.model("GameResult", gameResultSchema);
