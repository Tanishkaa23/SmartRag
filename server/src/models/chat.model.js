
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: [
  {
    filename: String,
    documentId: String,
    pageNumber: Number,
    chunkIndex: Number,
    score: Number,
  },
],
    mode: {
      type: String,
      enum: ["auto", "document", "general"],
    },
    answerSource: {
      type: String,
      enum: ["documents", "general"],
    },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
