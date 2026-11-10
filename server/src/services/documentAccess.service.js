import mongoose from "mongoose";
import Document from "../models/document.model.js";

export const validateDocumentAccess = async (userId, documentIds = [], { requireCompleted = true } = {}) => {
  if (!Array.isArray(documentIds)) {
    const error = new Error("documentIds must be an array of strings");
    error.statusCode = 400;
    throw error;
  }

  if (!documentIds.every((id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id))) {
    const error = new Error("One or more document IDs are invalid");
    error.statusCode = 400;
    throw error;
  }

  const uniqueIds = [...new Set(documentIds.map((id) => String(new mongoose.Types.ObjectId(id))))];
  if (!uniqueIds.length) return [];

  const filter = {
    _id: { $in: uniqueIds },
    userId,
  };
  if (requireCompleted) filter.status = "completed";
  const ownedDocuments = await Document.find(filter).select("_id");

  if (ownedDocuments.length !== uniqueIds.length) {
    const error = new Error("One or more documents were not found");
    error.statusCode = 404;
    throw error;
  }

  return uniqueIds;
};

export const getAvailableDocumentIds = async (userId) => {
  const documents = await Document.find({ userId, status: "completed" }).select("_id");
  return documents.map((document) => document._id.toString()).sort();
};
