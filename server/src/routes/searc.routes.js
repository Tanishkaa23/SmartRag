import express from "express";
import { searchDocumentsController } from "../controllers/search.controller.js";

const router = express.Router();

router.post("/", searchDocumentsController);

export default router;