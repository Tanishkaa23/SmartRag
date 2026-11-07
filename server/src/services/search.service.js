import qdrantClient from "../config/Qdrant.js";
import embeddings from "../config/embeddings.js";

const COLLECTION_NAME = "smartrag_documents";

export const searchDocuments = async (query, documentIds = []) => {
  // Generate query embedding
  const queryVector = await embeddings.embedQuery(query);

  // Build Qdrant filter
  const searchFilter = documentIds.length > 0
    ? {
        must: [
          {
            key: "documentId",
            match: {
              any: documentIds,
            },
          },
        ],
      }
    : undefined;

  // Search Qdrant
  const response = await qdrantClient.query(COLLECTION_NAME, {
    query: queryVector,
    limit: 3,
    with_payload: true,
    filter: searchFilter,
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
