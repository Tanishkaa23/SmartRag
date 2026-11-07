
import { randomUUID } from "crypto";

import qdrantClient from "../config/Qdrant.js";
import embeddings from "../config/embeddings.js";

const COLLECTION_NAME = "smartrag_documents";
const VECTOR_SIZE = 3072;


// Create collection if it doesn't exist
const createCollectionIfNotExists = async () => {
  console.log("Checking Qdrant collection...");

  const response = await qdrantClient.getCollections();

  const exists = response.collections.some(
    (collection) => collection.name === COLLECTION_NAME
  );

  if (!exists) {
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });

    console.log("Qdrant collection created");
  } else {
    console.log("Qdrant collection already exists");
  }
};


// Store document chunks
export const storeChunks = async (chunks) => {
  if (!chunks || chunks.length === 0) {
    throw new Error("No chunks provided for storage");
  }

  console.log("Checking Qdrant collection...");

  await createCollectionIfNotExists();

  console.log("Generating embeddings...");

  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.pageContent)
  );

  console.log("Embeddings generated:", vectors.length);

  if (vectors.length !== chunks.length) {
    throw new Error("Embedding count does not match chunk count");
  }

  // Validate vector dimensions
  for (const vector of vectors) {
    if (vector.length !== VECTOR_SIZE) {
      throw new Error(
        `Invalid vector dimensions: expected ${VECTOR_SIZE}, received ${vector.length}`
      );
    }
  }

  console.log(
  "CHUNK METADATA:",
  chunks.map((chunk) => chunk.metadata)
);

  const points = chunks.map((chunk, index) => ({
    id: randomUUID(),
    vector: vectors[index],
    payload: {
  text: chunk.pageContent,
  filename: chunk.metadata.filename,
  documentId: String(chunk.metadata.documentId),
  source: chunk.metadata.source,
  pageNumber: chunk.metadata.pageNumber,
  chunkIndex: index,
},
  }));

  console.log("Upserting points into Qdrant:", points.length);

  const result = await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log("Qdrant upsert response:", result);

  // Verify collection count
  const collectionInfo = await qdrantClient.getCollection(
    COLLECTION_NAME
  );

  console.log(
    "Total points currently in Qdrant:",
    collectionInfo.points_count
  );

  return points.length;
};


// Delete document chunks



export const deleteDocumentChunks = async (documentId, filename) => {
  // Delete newer chunks using documentId
  await qdrantClient.delete(COLLECTION_NAME, {
    wait: true,
    filter: {
      must: [
        {
          key: "documentId",
          match: { value: documentId },
        },
      ],
    },
  });

  // Delete legacy chunks using filename
  await qdrantClient.delete(COLLECTION_NAME, {
    wait: true,
    filter: {
      must: [
        {
          key: "filename",
          match: { value: filename },
        },
      ],
    },
  });
};


export const inspectQdrantDocuments = async () => {
  const response = await qdrantClient.scroll(COLLECTION_NAME, {
    limit: 10,
    with_payload: true,
    with_vector: false,
  });

  console.log(
    "QDRANT STORED PAYLOADS:",
    response.points.map((point) => ({
      filename: point.payload.filename,
      documentId: point.payload.documentId,
      pageNumber: point.payload.pageNumber,
      chunkIndex: point.payload.chunkIndex,
    }))
  );
};

