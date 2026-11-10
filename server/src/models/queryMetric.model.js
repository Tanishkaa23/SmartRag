import mongoose from "mongoose";

const queryMetricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cacheHit: {
      type: Boolean,
      required: true,
    },
    cacheSimilarity: Number,

    route: {
      type: String,
      enum: ["simple", "advanced", "cache"],
      required: true,
    },
    queryMode: {
      type: String,
      enum: ["auto", "document", "general"],
    },
    answerSource: {
      type: String,
      enum: ["documents", "general"],
    },

    modelUsed: String,
    responseTimeMs: {
      type: Number,
      required: true,
    },

    inputTokens: Number,
    outputTokens: Number,
    totalTokens: Number,
  },
  { timestamps: true }
);

const QueryMetric = mongoose.model("QueryMetric", queryMetricSchema);

export default QueryMetric;