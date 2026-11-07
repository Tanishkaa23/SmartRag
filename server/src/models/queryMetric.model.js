import mongoose from "mongoose";

const queryMetricSchema = new mongoose.Schema(
  {
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