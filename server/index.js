import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./src/config/db.js";
import redis from "./src/config/redis.js";
import qdrant from "./src/config/Qdrant.js";

import documentRoutes from './src/routes/document.routes.js'
import searchRoutes from "./src/routes/searc.routes.js";
import chatRoutes from './src/routes/chat.routes.js'
import analyticRoutes from "./src/routes/analytic.routes.js";
import authRoutes from "./src/routes/auth.routes.js";

import errorHandler from "./src/middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SmartRAG API is running!",
  });
});

app.get("/health", async (req, res) => {
  const health = {
    server: "OK",
    mongodb: "Unknown",
    redis: "Unknown",
    qdrant: "Unknown",
  };

  try {
    health.mongodb =
      (await import("mongoose")).default.connection.readyState === 1
        ? "Connected"
        : "Disconnected";
  } catch {
    health.mongodb = "Disconnected";
  }

  try {
    await redis.ping();
    health.redis = "Connected";
  } catch {
    health.redis = "Disconnected";
  }

  try {
    await qdrant.getCollections();
    health.qdrant = "Connected";
  } catch {
    health.qdrant = "Disconnected";
  }

  const allConnected = Object.values(health)
    .filter((value) => typeof value === "string")
    .every((value) => ["OK", "Connected"].includes(value));

  res.status(allConnected ? 200 : 503).json(health);
});

app.use("/api/documents", documentRoutes);
app.use("/api/search",searchRoutes)
app.use("/api/chat",chatRoutes)
app.use("/api/analytics",analyticRoutes)
app.use("/api/auth",authRoutes)

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});
app.use(errorHandler);

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
      throw new Error("JWT_SECRET must be configured with at least 32 characters");
    }

    await connectDB();

    await redis.ping();
    console.log("Redis connection verified");

    await qdrant.getCollections();
    console.log("Qdrant connection verified");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`SmartRAG running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();