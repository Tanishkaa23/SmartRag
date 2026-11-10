import { searchDocuments } from "../services/search.service.js";
import { validateDocumentAccess } from "../services/documentAccess.service.js";

export const searchDocumentsController = async (req, res) => {
  try {
    const { query, documentIds = [] } = req.body || {};

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        message: "Please provide a valid query",
      });
    }

    const ownedDocumentIds = await validateDocumentAccess(req.user._id, documentIds);
    const results = await searchDocuments(query.trim(), req.user._id.toString(), ownedDocumentIds);

    return res.status(200).json({
      message: "Search successful",
      query,
      totalResults: results.length,
      results,
    });
  } catch (error) {
    console.error("Search error:", error);

    return res.status(error.statusCode || 500).json({
      message: "Failed to search documents",
      error: error.statusCode ? error.message : "Search failed",
    });
  }
};