
import {
  extractPDFText,
  splitTextIntoChunks,
} from "../services/document.service.js";

import {
  storeChunks,
  deleteDocumentChunks,
  inspectQdrantDocuments
} from "../services/vector.service.js";

import Document from "../models/document.model.js";



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
          filename: file.originalname,
          originalName: file.originalname,
          fileSize: file.size,
          totalChunks: 0,
          status: "processing",
        });

        // Extract PDF page by page
        const pages = await extractPDFText(file.buffer);

        console.log("EXTRACTED PAGES:", pages.length);
        console.log("FIRST PAGE:", pages[0]);

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
        const storedChunks = await storeChunks(chunks);

        // Update MongoDB record
        document.totalChunks = storedChunks;
        document.status = "completed";
        await document.save();

        uploadedDocuments.push(document);

      } catch (error) {
        console.error(
          `Failed to process ${file.originalname}:`,
          error.message
        );

        if (document) {
          document.status = "failed";
          await document.save();
        }

        failedDocuments.push({
          filename: file.originalname,
          error: error.message,
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
      error: error.message,
    });
  }
};


export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });

    await inspectQdrantDocuments();

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

    const document = await Document.findById(id);

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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document",
      error: error.message,
    });
  }
};


export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

await deleteDocumentChunks(
  document._id.toString(),
  document.filename
);
    await Document.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
      error: error.message,
    });
  }
};
