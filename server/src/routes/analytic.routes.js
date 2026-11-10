
import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/overview", protect, getAnalytics);

export default router;
