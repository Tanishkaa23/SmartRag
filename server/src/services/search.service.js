import qdrantClient from "../config/Qdrant.js";
import embeddings from "../config/embeddings.js";

const COLLECTION_NAME = "smartrag_documents";

export const searchDocuments = async (query, userId, documentIds = []) => {
  if (!userId) {
    throw new Error("A user ID is required to search documents");
  }

  // Generate query embedding
  const queryVector = await embeddings.embedQuery(query);

  const must = [
    {
      key: "userId",
      match: { value: String(userId) },
    },
  ];
  if (documentIds.length > 0) {
    must.push({
      key: "documentId",
      match: { any: documentIds },
    });
  }

  const response = await qdrantClient.query(COLLECTION_NAME, {
    query: queryVector,
    limit: 3,
    with_payload: true,
    filter: { must },
  });

  return response.points.map((point) => ({
    text: point.payload.text,
    score: point.score,
    filename: point.payload.filename,
    documentId: point.payload.documentId,
    pageNumber: point.payload.pageNumber,
    chunkIndex: point.payload.chunkIndex,
  }));
};
