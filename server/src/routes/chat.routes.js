import express from "express";

import {chatController, createChat, getAllChats, getChatById, deleteChat} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", chatController);

router.post("/history", createChat);
router.get("/history", getAllChats);
router.get("/history/:id", getChatById);
router.delete("/history/:id", deleteChat);

export default router;
