
import { ChatGroq } from "@langchain/groq";
import { selectModel } from "./modelRoute.service.js";
import { searchDocuments } from "./search.service.js";
import embeddings from "../config/embeddings.js";
import { recordMetric } from "./analytics.service.js";
import {
  findCachedAnswer,
  saveCachedAnswer,
} from "./cache.service.js";

export const generateAnswer = async (query, documentIds = []) => {
  const startTime = Date.now();

  // Normalize document IDs for consistent cache matching
  const normalizedDocumentIds = [...new Set(documentIds)].sort();

  // Generate query embedding
  const queryVector = await embeddings.embedQuery(query);

  console.log("RAG DOCUMENT IDS:", normalizedDocumentIds);

const cached = await findCachedAnswer(
  query,
  queryVector,
  normalizedDocumentIds
);

console.log("CACHE STATUS:", cached ? "HIT" : "MISS");


  if (cached) {
    await recordMetric({
      cacheHit: true,
      cacheSimilarity: cached.similarity,
      route: "cache",
      modelUsed: null,
      responseTimeMs: Date.now() - startTime,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });

    return {
      answer: cached.answer,
      sources: cached.sources,
      cacheHit: true,
      similarity: cached.similarity,
    };
  }

  // Retrieve chunks from selected documents or all documents
  const results = await searchDocuments(
    query,
    normalizedDocumentIds
  );
  console.log(
  "QDRANT RESULTS:",
  results.map((item) => ({
    filename: item.filename,
    documentId: item.documentId,
  }))
);

  if (!results.length) {
    await recordMetric({
      cacheHit: false,
      route: "simple",
      modelUsed: null,
      responseTimeMs: Date.now() - startTime,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });

    return {
      answer: "I couldn't find relevant information in the selected documents.",
      sources: [],
      cacheHit: false,
    };
  }

  // Build context
  const context = results
    .map((item, index) => `Source ${index + 1}:\n${item.text}`)
    .join("\n\n");

  // Select model
  const routing = selectModel(query);

  const llm = new ChatGroq({
    model: routing.model,
    temperature: 0,
  });

  // Generate answer
  const response = await llm.invoke([
    [
      "system",
      `You are SmartRAG, an AI document assistant.
Answer using ONLY the provided context.
If information is unavailable, say so.
Never invent company policies.
Keep answers clear and concise.`,
    ],
    [
      "human",
      `Context:\n${context}\n\nQuestion: ${query}`,
    ],
  ]);

  const answer = response.content;

  // Prepare sources
  const sources = results.map((item) => ({
  filename: item.filename,
  documentId: item.documentId,
  pageNumber: item.pageNumber,
  chunkIndex: item.chunkIndex,
  score: item.score,
}));

  // Save answer with document scope in cache
  await saveCachedAnswer(
    query,
    queryVector,
    answer,
    sources,
    normalizedDocumentIds
  );

  // Extract token usage
  const usage = response.usage_metadata || {};

  await recordMetric({
    cacheHit: false,
    route: routing.route,
    modelUsed: routing.model,
    responseTimeMs: Date.now() - startTime,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  });

  return {
    answer,
    sources,
    cacheHit: false,
    modelUsed: routing.model,
    route: routing.route,
    routingReason: routing.reason,
  };
};
