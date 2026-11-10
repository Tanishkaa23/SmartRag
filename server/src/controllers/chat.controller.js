import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import { generateAnswer } from "../services/rag.service.js";
import { validateDocumentAccess } from "../services/documentAccess.service.js";

const notFound = (res) => res.status(404).json({
  success: false,
  message: "Chat not found",
});

const sendError = (res, error, fallbackMessage) => {
  const status = error.statusCode || 500;
  console.error(`${fallbackMessage}:`, error.message);
  return res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === "production"
      ? fallbackMessage
      : error.message || fallbackMessage,
  });
};

export const chatController = async (req, res) => {
  let newChat;
  try {
    const { query, chatId, documentIds = [], mode = "auto" } = req.body || {};
    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ success: false, message: "Please provide a valid query" });
    }
    if (!["auto", "document", "general"].includes(mode)) {
      return res.status(400).json({ success: false, message: "mode must be auto, document, or general" });
    }

    const userId = req.user._id;
    const ownedDocumentIds = await validateDocumentAccess(userId, documentIds, {
      requireCompleted: mode !== "general",
    });
    let chat;

    if (chatId) {
      if (!mongoose.isObjectIdOrHexString(chatId)) {
        return res.status(400).json({ success: false, message: "Invalid chat ID" });
      }
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) return notFound(res);
    } else {
      chat = new Chat({
        userId,
        title: query.trim().slice(0, 50),
        messages: [],
      });
      newChat = chat;
    }

    const result = await generateAnswer(query.trim(), userId.toString(), {
      mode,
      documentIds: ownedDocumentIds,
    });

    chat.messages.push(
      { role: "user", content: query.trim(), mode },
      {
        role: "assistant",
        content: typeof result.answer === "string" ? result.answer : JSON.stringify(result.answer),
        mode: result.mode,
        answerSource: result.answerSource,
        sources: (result.sources || []).map((source) => ({
          filename: source.filename,
          documentId: source.documentId,
          pageNumber: source.pageNumber,
          chunkIndex: source.chunkIndex,
          score: source.score,
        })),
      },
    );
    await chat.save();

    return res.status(200).json({
      message: "Answer generated and chat saved successfully",
      chatId: chat._id,
      query: query.trim(),
      ...result,
    });
  } catch (error) {
    if (newChat?._id) await Chat.deleteOne({ _id: newChat._id, userId: req.user._id });
    return sendError(res, error, "Failed to generate answer");
  }
};

export const createChat = async (req, res) => {
  try {
    const body = req.body || {};
    const title = typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 100)
      : "New Chat";
    const chat = await Chat.create({ userId: req.user._id, title });
    return res.status(201).json({ success: true, chat });
  } catch (error) {
    return sendError(res, error, "Failed to create chat");
  }
};

export const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, total: chats.length, chats });
  } catch (error) {
    return sendError(res, error, "Failed to fetch chats");
  }
};

export const getChatById = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID" });
    }
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return notFound(res);
    return res.status(200).json({ success: true, chat });
  } catch (error) {
    return sendError(res, error, "Failed to fetch chat");
  }
};

export const deleteChat = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID" });
    }
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!chat) return notFound(res);
    return res.status(200).json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    return sendError(res, error, "Failed to delete chat");
  }
};
