import QueryMetric from "../models/queryMetric.model.js";
export const recordMetric = async (data) => {
  if (!data.userId) {
    throw new Error("A user ID is required to record analytics");
  }
  await QueryMetric.create(data);
};