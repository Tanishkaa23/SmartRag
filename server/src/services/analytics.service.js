import QueryMetric from "../models/queryMetric.model.js";
export const recordMetric = async (data) => {
  try {
    await QueryMetric.create(data);
  } catch (error) {
    console.error("Failed to record analytics:", error.message);
  }
};