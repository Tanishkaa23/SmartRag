
import express from "express";
import upload from "../middlewares/upload.middleware.js";
import {uploadDocument, getAllDocuments, getDocumentById, deleteDocument} from "../controllers/document.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/upload", protect, upload.array("file", 10), uploadDocument);
router.get("/", protect, getAllDocuments);
router.get("/:id", protect, getDocumentById);
router.delete("/:id", protect, deleteDocument);

export default router;
