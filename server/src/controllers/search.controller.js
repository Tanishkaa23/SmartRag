import { searchDocuments } from "../services/search.service.js";

export const searchDocumentsController = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        message: "Please provide a valid query",
      });
    }

    const results = await searchDocuments(query.trim());

    return res.status(200).json({
      message: "Search successful",
      query,
      totalResults: results.length,
      results,
    });
  } catch (error) {
    console.error("Search error:", error);

    return res.status(500).json({
      message: "Failed to search documents",
      error: error.message,
    });
  }
};