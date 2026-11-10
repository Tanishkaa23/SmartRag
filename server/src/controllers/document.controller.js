
import {
  extractPDFText,
  splitTextIntoChunks,
} from "../services/document.service.js";

import {
  storeChunks,
  deleteDocumentChunks,
} from "../services/vector.service.js";

import Document from "../models/document.model.js";
import mongoose from "mongoose";
import { invalidateCachedAnswersForDocument } from "../services/cache.service.js";



export const uploadDocument = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one PDF",
      });
    }

    const uploadedDocuments = [];
    const failedDocuments = [];

    for (const file of req.files) {
      let document;

      try {
        // Validate PDF
        if (file.buffer.subarray(0, 5).toString() !== "%PDF-") {
          throw new Error("Invalid PDF file");
        }

        // Create MongoDB record first
        document = await Document.create({
          userId: req.user._id,
          filename: file.originalname,
          originalName: file.originalname,
          fileSize: file.size,
          totalChunks: 0,
          status: "processing",
        });

        // Extract PDF page by page
        const pages = await extractPDFText(file.buffer);

        if (!pages || pages.length === 0) {
          throw new Error("No readable text found in PDF");
        }

        const hasText = pages.some(
          (page) => page.text.trim().length > 0
        );

        if (!hasText) {
          throw new Error("PDF contains no readable text");
        }

        // Generate chunks while preserving page numbers
        const chunks = await splitTextIntoChunks(pages, {
          filename: file.originalname,
          documentId: document._id.toString(),
          source: "pdf",
        });

        // Store vectors in Qdrant
        const storedChunks = await storeChunks(chunks, req.user._id.toString());

        // Update MongoDB record
        document.totalChunks = storedChunks;
        document.status = "completed";
        await document.save();

        uploadedDocuments.push(document);

      } catch (error) {
        console.error(`Failed to process ${file.originalname}:`, error.message);

        if (document) {
          let cleanupMessage = "";
          try {
            await deleteDocumentChunks(req.user._id.toString(), document._id.toString());
          } catch (cleanupError) {
            console.error(`Failed to clean up vectors for ${file.originalname}:`, cleanupError.message);
            cleanupMessage = " Vector cleanup failed; contact an administrator.";
          }
          document.status = "failed";
          await document.save();
          error.message += cleanupMessage;
        }

        failedDocuments.push({
          filename: file.originalname,
          error: process.env.NODE_ENV === "production"
            ? "The PDF could not be processed."
            : error.message,
        });
      }
    }

    return res.status(
      uploadedDocuments.length > 0 ? 201 : 422
    ).json({
      success: failedDocuments.length === 0,
      totalReceived: req.files.length,
      totalUploaded: uploadedDocuments.length,
      totalFailed: failedDocuments.length,
      documents: uploadedDocuments,
      failedDocuments,
    });

  } catch (error) {
    console.error("Document upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process documents",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};


export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalDocuments: documents.length,
      documents,
    });

  } catch (error) {
    console.error("Fetch documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ success: false, message: "Invalid document ID" });
    }

    const document = await Document.findOne({ _id: id, userId: req.user._id });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      document,
    });

  } catch (error) {
    console.error("Fetch document error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document",
    });
  }
};


export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ success: false, message: "Invalid document ID" });
    }

    const document = await Document.findOne({ _id: id, userId: req.user._id });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    await deleteDocumentChunks(req.user._id.toString(), document._id.toString());
    await invalidateCachedAnswersForDocument(req.user._id.toString(), document._id.toString());
    await Document.deleteOne({ _id: document._id, userId: req.user._id });

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};
