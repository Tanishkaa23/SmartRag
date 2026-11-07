# SmartRAG

An AI-powered document assistant that allows users to upload PDF documents,
ask questions, and receive context-aware answers with relevant page references.

## Features

- PDF upload and text extraction
- Page-aware document chunking
- Google Gemini embeddings
- Semantic search using Qdrant
- Retrieval-Augmented Generation (RAG) using Groq
- Redis semantic caching
- Simple and advanced model routing
- Document-level search isolation
- Chat history management
- Query analytics and document management APIs

## Tech Stack

- Node.js and Express.js
- MongoDB
- Redis
- Qdrant
- LangChain
- Google Gemini Embeddings
- Groq LLM
- Docker

## Architecture

PDF Upload → Text Extraction → Chunking → Embeddings → Qdrant

User Query → Embedding → Redis Cache → Qdrant Retrieval → Groq → Answer with Sources

## Setup

1. Clone the repository.
2. Navigate to the server directory.
3. Install dependencies using `npm install`.
4. Configure environment variables in `.env`.
5. Start MongoDB, Redis, and Qdrant.
6. Start the backend server.

## Environment Variables

Create a `.env` file inside `server/` and configure the required API keys and service URLs.

Never commit your `.env` file.

## API

Base URL: `http://localhost:5000`

- `/api/documents`
- `/api/search`
- `/api/chat`