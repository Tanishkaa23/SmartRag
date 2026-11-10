
import redis from "../config/redis.js";
import { validateCachedAnswer } from "./validator.service.js";
import { randomUUID } from "crypto";

const CACHE_PREFIX = "semantic_cache:";

const SIMILARITY_THRESHOLD = 0.83;
const VALIDATION_FLOOR = 0.65;

const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;

  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Find cached answer
export const findCachedAnswer = async (
  query,
  queryVector,
  userId,
  mode,
  answerSource,
  documentIds = []
) => {
  if (!userId) throw new Error("A user ID is required to search the semantic cache");
  const keys = await redis.keys(`${CACHE_PREFIX}${userId}:*`);

  const normalizedIds = [...new Set(documentIds)].sort();

  const candidates = [];

  for (const key of keys) {
    const cachedData = await redis.get(key);

    if (!cachedData) continue;

    const cached = JSON.parse(cachedData);

    if (cached.userId !== String(userId)) continue;

    if (cached.mode !== mode || cached.answerSource !== answerSource) continue;

    const cachedIds = [...new Set(cached.documentIds || [])].sort();

    if (JSON.stringify(cachedIds) !== JSON.stringify(normalizedIds)) {
      continue;
    }

    if (
      !Array.isArray(cached.embedding) ||
      cached.embedding.length !== queryVector.length
    ) {
      continue;
    }

    const similarity = cosineSimilarity(
      queryVector,
      cached.embedding
    );

    candidates.push({
      query: cached.query,
      answer: cached.answer,
      sources: cached.sources,
      mode: cached.mode,
      answerSource: cached.answerSource,
      modelUsed: cached.modelUsed,
      route: cached.route,
      similarity,
    });
  }

  candidates.sort((a, b) => b.similarity - a.similarity);

  const topCandidates = candidates.slice(0, 3);

  console.log(
    "Top cache candidates:",
    topCandidates.map((candidate) => ({
      query: candidate.query,
      similarity: candidate.similarity,
    }))
  );

  for (const candidate of topCandidates) {
    if (candidate.similarity < VALIDATION_FLOOR) {
      break;
    }

    // Direct high-confidence match
    if (candidate.similarity >= SIMILARITY_THRESHOLD) {
      console.log("Direct cache HIT:", candidate.query);
      return candidate;
    }

    // Validate borderline matches
    console.log("Validating candidate:", candidate.query);

    const isValid = await validateCachedAnswer(
      query,
      candidate.query,
      candidate.answer
    );

    if (isValid) {
      console.log("Validated cache HIT:", candidate.query);
      return candidate;
    }

    console.log("Candidate rejected. Checking next candidate...");
  }

  console.log("Cache MISS");

  return null;
};

// Save cached answer
export const saveCachedAnswer = async (
  query,
  queryVector,
  answer,
  sources,
  userId,
  mode,
  answerSource,
  modelUsed,
  route,
  documentIds = []
) => {
  if (!userId) throw new Error("A user ID is required to save to the semantic cache");
  const key = `${CACHE_PREFIX}${userId}:${randomUUID()}`;

  const normalizedIds = [...new Set(documentIds)].sort();

  await redis.set(
    key,
    JSON.stringify({
      query,
      userId: String(userId),
      mode,
      answerSource,
      embedding: queryVector,
      answer,
      sources,
      modelUsed,
      route,
      documentIds: normalizedIds,
    }),
    "EX",
    3600
  );
};

export const invalidateCachedAnswersForDocument = async (userId, documentId) => {
  if (!userId || !documentId) {
    throw new Error("A user ID and document ID are required to invalidate the semantic cache");
  }

  const keys = await redis.keys(`${CACHE_PREFIX}${userId}:*`);
  for (const key of keys) {
    const cachedData = await redis.get(key);
    if (!cachedData) continue;

    const cached = JSON.parse(cachedData);
    if (
      cached.userId === String(userId) &&
      ((cached.documentIds || []).includes(String(documentId)) ||
        (cached.sources || []).some((source) => String(source.documentId) === String(documentId)))
    ) {
      await redis.del(key);
    }
  }
};
