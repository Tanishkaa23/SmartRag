
import express from "express";
import { searchDocumentsController } from "../controllers/search.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, searchDocumentsController);

export default router;
