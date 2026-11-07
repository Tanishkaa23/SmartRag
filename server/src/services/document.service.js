import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

// 1. Extract text from PDF


export const extractPDFText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));
  } finally {
    await parser.destroy();
  }
};


// 2. Split text into chunks
export const splitTextIntoChunks = async (pages, metadata = {}) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const pageDocuments = pages.map((page) =>
    new Document({
      pageContent: page.text,
      metadata: {
        ...metadata,
        pageNumber: page.pageNumber,
      },
    })
  );

  return await splitter.splitDocuments(pageDocuments);
};
