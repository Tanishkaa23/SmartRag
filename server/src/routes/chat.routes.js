
import express from "express";
import {chatController, createChat, getAllChats, getChatById, deleteChat} from "../controllers/chat.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, chatController);

router.post("/history", protect, createChat);
router.get("/history", protect, getAllChats);
router.get("/history/:id", protect, getChatById);
router.delete("/history/:id", protect, deleteChat);

export default router;
