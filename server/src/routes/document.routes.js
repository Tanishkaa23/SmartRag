import express from "express";
import upload from "../middlewares/upload.middleware.js";
import {uploadDocument} from "../controllers/document.controller.js";
import { getAllDocuments } from "../controllers/document.controller.js";
import { getDocumentById } from "../controllers/document.controller.js";
import { deleteDocument } from "../controllers/document.controller.js";

const router = express.Router();

router.post("/upload", upload.array("file",10), uploadDocument);
router.get('/',getAllDocuments)
router.get("/:id", getDocumentById)
router.delete("/:id", deleteDocument)


export default router;

