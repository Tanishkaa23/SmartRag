import { ChatGroq } from "@langchain/groq";
import { selectModel } from "./modelRoute.service.js";
import { searchDocuments } from "./search.service.js";
import embeddings from "../config/embeddings.js";
import { recordMetric } from "./analytics.service.js";
import {
  findCachedAnswer,
  saveCachedAnswer,
} from "./cache.service.js";
import { getAvailableDocumentIds } from "./documentAccess.service.js";
import { validateDocumentRelevance } from "./validator.service.js";

const DOCUMENT_NOT_FOUND = "I couldn't find this information in your uploaded documents.";
const DOCUMENT_UPLOAD_PROMPT = "Upload a PDF first to ask questions in Documents mode.";

const prepareAnswer = async (query, context = null) => {
  const routing = selectModel(query);
  const llm = new ChatGroq({ model: routing.model, temperature: 0 });
  const systemPrompt = context
    ? `You are SmartRAG, an AI document assistant. Answer using ONLY the provided PDF context. If the answer is not contained in the context, say so. Never use outside knowledge or invent facts, filenames, page numbers, or citations. Keep answers clear and concise.`
    : `You are SmartRAG, a helpful general AI assistant. Answer clearly and accurately using general knowledge. Do not claim that your answer came from uploaded documents.`;
  const prompt = context
    ? `PDF context:\n${context}\n\nQuestion: ${query}`
    : query;
  const response = await llm.invoke([
    ["system", systemPrompt],
    ["human", prompt],
  ]);
  return {
    answer: typeof response.content === "string" ? response.content : JSON.stringify(response.content),
    modelUsed: routing.model,
    route: routing.route,
    routingReason: routing.reason,
    usage: response.usage_metadata || {},
  };
};

const recordQuery = async ({
  userId,
  queryMode,
  answerSource,
  route,
  modelUsed = null,
  startTime,
  usage = {},
  cacheHit = false,
  cacheSimilarity,
}) => {
  await recordMetric({
    userId,
    queryMode,
    answerSource,
    cacheHit,
    ...(cacheSimilarity == null ? {} : { cacheSimilarity }),
    route,
    modelUsed,
    responseTimeMs: Date.now() - startTime,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  });
};

const makeResponse = ({ answer, mode, answerSource, sources = [], cacheHit = false, ...metadata }) => ({
  success: true,
  answer,
  mode,
  answerSource,
  sources,
  cacheHit,
  ...metadata,
});

export const generateAnswer = async (
  query,
  userId,
  { mode = "auto", documentIds = [] } = {},
) => {
  if (!userId) throw new Error("A user ID is required to generate an answer");
  if (!["auto", "document", "general"].includes(mode)) {
    const error = new Error("mode must be auto, document, or general");
    error.statusCode = 400;
    throw error;
  }

  const startTime = Date.now();
  const selectedIds = [...new Set(documentIds)].sort();
  const availableIds = mode === "general"
    ? []
    : selectedIds.length
      ? selectedIds
      : await getAvailableDocumentIds(userId);
  const hasDocuments = availableIds.length > 0;

  if (mode === "document" && !hasDocuments) {
    await recordQuery({
      userId,
      queryMode: mode,
      answerSource: null,
      route: "simple",
      startTime,
    });
    return makeResponse({
      answer: DOCUMENT_UPLOAD_PROMPT,
      mode,
      answerSource: null,
      sources: [],
    });
  }

  let answerSource = "general";
  let relevantResults = [];

  if (mode !== "general" && hasDocuments) {
    const results = await searchDocuments(query, userId, availableIds);
    if (await validateDocumentRelevance(query, results)) {
      answerSource = "documents";
      relevantResults = results;
    } else if (mode === "document") {
      await recordQuery({
        userId,
        queryMode: mode,
        answerSource: null,
        route: "simple",
        startTime,
      });
      return makeResponse({
        answer: DOCUMENT_NOT_FOUND,
        mode,
        answerSource: null,
        sources: [],
      });
    }
  }

  const queryVector = await embeddings.embedQuery(query);
  const cached = await findCachedAnswer(
    query,
    queryVector,
    userId,
    mode,
    answerSource,
    availableIds,
  );

  if (cached) {
    await recordQuery({
      userId,
      queryMode: mode,
      answerSource,
      route: "cache",
      startTime,
      cacheHit: true,
      cacheSimilarity: cached.similarity,
    });
    return makeResponse({
      answer: cached.answer,
      mode,
      answerSource,
      sources: cached.sources || [],
      cacheHit: true,
      similarity: cached.similarity,
      modelUsed: cached.modelUsed,
    });
  }

  const context = answerSource === "documents"
    ? relevantResults.map((item, index) => `Source ${index + 1}:\n${item.text}`).join("\n\n")
    : null;
  const generated = await prepareAnswer(query, context);
  const sources = answerSource === "documents"
    ? relevantResults.map((item) => ({
        filename: item.filename,
        documentId: item.documentId,
        pageNumber: item.pageNumber,
        chunkIndex: item.chunkIndex,
        score: item.score,
      }))
    : [];

  await saveCachedAnswer(
    query,
    queryVector,
    generated.answer,
    sources,
    userId,
    mode,
    answerSource,
    generated.modelUsed,
    generated.route,
    availableIds,
  );
  await recordQuery({
    userId,
    queryMode: mode,
    answerSource,
    route: generated.route,
    modelUsed: generated.modelUsed,
    startTime,
    usage: generated.usage,
  });

  return makeResponse({
    answer: generated.answer,
    mode,
    answerSource,
    sources,
    cacheHit: false,
    modelUsed: generated.modelUsed,
    route: generated.route,
    routingReason: generated.routingReason,
  });
};
