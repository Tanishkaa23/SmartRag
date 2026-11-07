import QueryMetric from "../models/queryMetric.model.js";

export const getAnalytics = async (req, res) => {
  try {
    const metrics = await QueryMetric.aggregate([
      {
        $group: {
          _id: null,
          totalQueries: { $sum: 1 },

          cacheHits: {
            $sum: { $cond: ["$cacheHit", 1, 0] },
          },

          cacheMisses: {
            $sum: { $cond: ["$cacheHit", 0, 1] },
          },

          avgResponseTime: {
            $avg: "$responseTimeMs",
          },

          simpleQueries: {
            $sum: {
              $cond: [{ $eq: ["$route", "simple"] }, 1, 0],
            },
          },

          advancedQueries: {
            $sum: {
              $cond: [{ $eq: ["$route", "advanced"] }, 1, 0],
            },
          },

          totalTokens: { $sum: "$totalTokens" },
        },
      },
    ]);

    const data = metrics[0] || {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      simpleQueries: 0,
      advancedQueries: 0,
      totalTokens: 0,
    };

    const cacheHitRate = data.totalQueries
      ? (data.cacheHits / data.totalQueries) * 100
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        ...data,
        cacheHitRate: Number(cacheHitRate.toFixed(2)),
        avgResponseTime: Number(data.avgResponseTime.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};