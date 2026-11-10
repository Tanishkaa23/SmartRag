# SmartRAG

An AI-powered document assistant that allows users to upload PDF documents,
ask questions, and receive context-aware answers with relevant page references.

## Features

- PDF upload and text extraction
- Page-aware document chunking
- Google Gemini embeddings
- Semantic search using Qdrant
- Hybrid Auto, Documents-only, and General AI answer modes using Groq
- Retrieval-Augmented Generation (RAG) with relevance-checked PDF context
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

- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — sign in and receive a JWT
- `GET /api/auth/me` — get the authenticated profile
- `/api/documents`
- `/api/search`
- `/api/chat`

Send chat queries to `POST /api/chat` with an optional mode:

```json
{
  "query": "What is gravitational force?",
  "mode": "auto",
  "documentIds": [],
  "chatId": null
}
```

Supported modes are `auto` (use relevant owned documents, otherwise general
AI), `document` (use only owned PDFs), and `general` (do not retrieve document
chunks). When `documentIds` is empty, Auto and Documents modes search all of the
authenticated user's completed PDFs.

## Authentication and data ownership

Set `JWT_SECRET` to a random secret of at least 32 characters in `server/.env`.
`server/.env.example` contains placeholders for the required environment
variables. The server will refuse to start if the JWT secret is missing or too
short. The frontend stores the JWT in localStorage for this MVP and sends it as
a Bearer token; use HTTPS in deployed environments. Logging out removes the
token from this browser only. JWTs are stateless and remain valid until they
expire unless the secret is rotated.

New documents, chats, vectors, cache entries, and query metrics are scoped to
the authenticated user. Existing MongoDB records without a `userId`, and
existing Qdrant points without a `userId` payload, remain preserved but are not
visible to any account. They are intentionally not assigned to the first user
to register. An administrator may assign legacy MongoDB records by first
verifying ownership out of band and then setting each record's `userId` to the
intended account's MongoDB ObjectId. Legacy Qdrant points must similarly be
matched to their verified document records and updated with the corresponding
`userId` payload; points whose owner cannot be verified should remain
unassigned. Never bulk-assign all legacy data to an arbitrary account.