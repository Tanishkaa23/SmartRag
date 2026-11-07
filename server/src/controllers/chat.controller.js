import { generateAnswer } from "../services/rag.service.js";
import Chat from "../models/chat.model.js";




export const chatController = async (req, res) => {
  try {
    const { query, chatId, documentIds = [] } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        message: "Please provide a valid query",
      });
    }

    if (
      !Array.isArray(documentIds) ||
      !documentIds.every((id) => typeof id === "string")
    ) {
      return res.status(400).json({
        message: "documentIds must be an array of strings",
      });
    }

    let chat;

    if (chatId) {
      chat = await Chat.findById(chatId);

      if (!chat) {
        return res.status(404).json({
          message: "Chat not found",
        });
      }
    } else {
      chat = await Chat.create({
        title: query.trim().slice(0, 50),
        messages: [],
      });
    }

    chat.messages.push({
      role: "user",
      content: query.trim(),
    });

    console.log("REQUEST DOCUMENT IDS:", documentIds);

    // Pass document IDs to RAG
    const result = await generateAnswer(
      query.trim(),
      documentIds
    );

    chat.messages.push({
      role: "assistant",
      content: result.answer,
      sources: (result.sources || []).map(source => ({
  filename: source.filename,
  documentId: source.documentId,
  pageNumber: source.pageNumber,
  chunkIndex: source.chunkIndex,
  score: source.score,
}))
    });

    await chat.save();

    return res.status(200).json({
      message: "Answer generated and chat saved successfully",
      chatId: chat._id,
      query: query.trim(),
      ...result,
    });

  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      message: "Failed to generate answer",
      error: error.message,
    });
  }
};




export const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({
      title: req.body.title || "New Chat",
    });

    res.status(201).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all chats
export const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      total: chats.length,
      chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get chat by ID
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete chat
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
