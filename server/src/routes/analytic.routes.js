import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/overview", getAnalytics);

export default router;