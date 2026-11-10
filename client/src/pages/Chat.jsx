import { useCallback, useEffect, useRef, useState } from "react";
import Loader from "../components/Loader.jsx";
import MessageContent from "../components/MessageContent.jsx";
import { createChat, deleteChat, getChat, getChats, getDocuments, getErrorMessage, sendMessage, uploadDocuments } from "../services/api.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;

function SourceList({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <div key={`${source.documentId || source.filename}-${source.chunkIndex}-${index}`} className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-700">{source.filename || "Document"}</span>
            {source.pageNumber != null && <span> · Page {source.pageNumber}</span>}
            {source.chunkIndex != null && <span> · Chunk {source.chunkIndex}</span>}
            {typeof source.score === "number" && <span> · {`Score ${(source.score * 100).toFixed(0)}%`}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Message({ message }) {
  const isUser = message.role === "user";
  const answerSourceLabel = message.answerSource === "documents"
    ? "Answered using your documents"
    : message.answerSource === "general"
      ? "Answered using general AI"
      : "";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${isUser ? "bg-blue-100 text-blue-700" : "bg-slate-900 text-white"}`}>{isUser ? "You" : "AI"}</div>
      <div className={`min-w-0 max-w-[min(760px,88%)] rounded-xl px-4 py-3 ${isUser ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
        {!isUser && answerSourceLabel && <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{answerSourceLabel}</p>}
        {isUser ? <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div> : <MessageContent content={message.content} />}
        {!isUser && <SourceList sources={message.sources} />}
      </div>
    </div>
  );
}

export default function Chat() {
  const [documents, setDocuments] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [mode, setMode] = useState("auto");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const refreshChats = useCallback(async () => {
    const list = await getChats();
    setChats(list);
    return list;
  }, []);

  useEffect(() => {
    Promise.all([getDocuments(), getChats()])
      .then(([documentList, chatList]) => {
        setDocuments(documentList);
        setChats(chatList);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const selectChat = async (id) => {
    if (!id) {
      setActiveChatId("");
      setMessages([]);
      return;
    }
    setError("");
    try {
      const chat = await getChat(id);
      setActiveChatId(chat._id);
      setMessages(chat.messages || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const startNewChat = () => {
    setActiveChatId("");
    setMessages([]);
    setError("");
    inputRef.current?.focus();
  };

  const handleDeleteChat = async () => {
    if (!activeChatId) return;
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await deleteChat(activeChatId);
      setActiveChatId("");
      setMessages([]);
      await refreshChats();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setUploadError("");
    setUploadNotice("");
    if (!files.length) return;

    const invalid = files.find((file) => file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf"));
    if (invalid) {
      setUploadError(`${invalid.name} is not a PDF file.`);
      return;
    }
    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setUploadError(`${oversized.name} exceeds the 10 MB file size limit.`);
      return;
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      setUploadError(`You can upload up to ${MAX_FILES_PER_UPLOAD} PDFs at a time.`);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadDocuments(files);
      const uploadedDocuments = result.documents || [];
      setDocuments(await getDocuments());
      if (uploadedDocuments.length === 1) {
        setSelectedDocumentId(uploadedDocuments[0]._id);
      } else if (uploadedDocuments.length > 1) {
        setSelectedDocumentId("");
      }

      const failedDocuments = result.failedDocuments || [];
      setUploadNotice(failedDocuments.length
        ? `${uploadedDocuments.length} uploaded. ${failedDocuments.map((item) => `${item.filename}: ${item.error}`).join(" ")}`
        : `${uploadedDocuments.length} ${uploadedDocuments.length === 1 ? "PDF" : "PDFs"} uploaded successfully.`);
      if (failedDocuments.length) {
        setUploadError(failedDocuments.map((item) => `${item.filename}: ${item.error}`).join(" "));
      }
    } catch (requestError) {
      setUploadError(getErrorMessage(requestError));
      try {
        setDocuments(await getDocuments());
      } catch (refreshError) {
        setUploadError(`${getErrorMessage(requestError)} Document list could not be refreshed: ${getErrorMessage(refreshError)}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = query.trim();
    if (!text || sending) return;
    setError("");
    setSending(true);
    const userMessage = { role: "user", content: text, mode };
    setMessages((current) => [...current, userMessage]);
    setQuery("");
    try {
      const result = await sendMessage({
        query: text,
        chatId: activeChatId || undefined,
        documentIds: mode !== "general" && selectedDocumentId ? [selectedDocumentId] : [],
        mode,
      });
      setActiveChatId(result.chatId);
      setMessages((current) => [...current, {
        role: "assistant",
        content: typeof result.answer === "string" ? result.answer : JSON.stringify(result.answer),
        sources: result.sources || [],
        mode: result.mode,
        answerSource: result.answerSource,
      }]);
      try {
        await refreshChats();
      } catch (requestError) {
        setError(`Answer received, but chat history could not be refreshed: ${getErrorMessage(requestError)}`);
      }
    } catch (requestError) {
      setMessages((current) => current.filter((message, index) => !(index === current.length - 1 && message === userMessage)));
      setQuery(text);
      setError(getErrorMessage(requestError));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loader label="Loading chat..." />;

  return (
    <div className="grid min-h-[calc(100vh-150px)] overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
        <button className="button-primary w-full" onClick={startNewChat}>＋ <span>New conversation</span></button>
        <label className="mt-6 block text-xs font-semibold text-slate-600" htmlFor="document-select">Search in</label>
        <select id="document-select" className="field mt-2" value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)}>
          <option value="">All documents</option>
          {documents.map((document) => <option key={document._id} value={document._id}>{document.filename}</option>)}
        </select>
        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent chats</h2>
          <span className="text-[11px] text-slate-400">{chats.length}</span>
        </div>
        {chats.length === 0 ? <p className="mt-4 text-xs leading-5 text-slate-400">Your conversations will appear here.</p> : (
          <div className="mt-2 max-h-[360px] space-y-1 overflow-y-auto">
            {chats.map((chat) => (
              <button key={chat._id} className={`w-full rounded-lg px-3 py-2.5 text-left text-xs leading-5 ${activeChatId === chat._id ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-white"}`} onClick={() => selectChat(chat._id)}>
                <span className="block truncate">{chat.title || "New chat"}</span>
                {chat.updatedAt && <span className="mt-0.5 block text-[10px] font-normal text-slate-400">{new Date(chat.updatedAt).toLocaleDateString()}</span>}
              </button>
            ))}
          </div>
        )}
      </aside>
      <section className="flex min-h-[560px] flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">{activeChatId ? chats.find((chat) => chat._id === activeChatId)?.title || "Conversation" : "New conversation"}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {mode === "general"
                ? "General AI answers without document retrieval"
                : mode === "document"
                  ? selectedDocumentId ? "Answering only from the selected PDF" : "Answering only from your uploaded PDFs"
                  : selectedDocumentId ? "Using the selected PDF when relevant" : "Using your PDFs when relevant"}
            </p>
          </div>
          {activeChatId && <button className="text-xs font-medium text-slate-400 hover:text-rose-600" onClick={handleDeleteChat}>Delete chat</button>}
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></svg>
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-900">Ask SmartRAG anything</h2>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{documents.length ? "Auto uses your PDFs when relevant and general AI otherwise." : "Ask general questions now, or upload a PDF to get document-grounded answers."}</p>
            </div>
          ) : messages.map((message, index) => <Message key={`${message._id || message.role}-${index}`} message={message} />)}
          {sending && <div className="flex items-center gap-3 text-sm text-slate-500"><span className="loader" />{mode === "general" ? "Generating an answer..." : mode === "document" ? "Searching your documents..." : "Finding the best answer..."}</div>}
          {error && <div className="alert-error" role="alert">{error}</div>}
          <div ref={bottomRef} />
        </div>
        <form className="border-t border-slate-100 p-4 sm:p-5" onSubmit={handleSubmit}>
          <div className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-blue-400">
            <button type="button" className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => fileInputRef.current?.click()} disabled={sending || uploading} aria-label="Upload PDF" title="Upload PDF">
              {uploading ? <span className="loader" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>}
            </button>
            <input ref={fileInputRef} className="hidden" type="file" accept="application/pdf,.pdf" multiple onChange={handleFileUpload} />
            <textarea ref={inputRef} className="max-h-32 min-h-[42px] flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400" placeholder={mode === "general" ? "Ask anything..." : mode === "document" ? "Ask about your uploaded PDFs..." : "Ask anything or about your documents..."} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} rows={1} disabled={sending} />
            <button type="submit" className="button-primary px-4" disabled={sending || uploading || !query.trim()} aria-label="Send message">
              <span className="hidden sm:inline">{sending ? "Thinking..." : "Send"}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 sm:hidden"><path d="m5 12 14-7-4 14-3-6-7-1zM12 13l7-8" /></svg>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
            <label htmlFor="chat-mode" className="text-[11px] font-medium text-slate-500">Answer mode</label>
            <select id="chat-mode" className="field w-auto min-w-[120px] py-1" value={mode} onChange={(event) => setMode(event.target.value)} disabled={sending}>
              <option value="auto">Auto</option>
              <option value="document">Documents</option>
              <option value="general">General AI</option>
            </select>
            <span className="text-[10px] text-slate-400">
              {mode === "auto"
                ? "Use documents when relevant, otherwise general AI."
                : mode === "document"
                  ? "Answer only from my uploaded PDFs."
                  : "Ask anything without using uploaded documents."}
            </span>
          </div>
          {uploadError && <p className="mt-2 px-1 text-xs text-rose-600" role="alert">{uploadError}</p>}
          {uploadNotice && !uploadError && <p className="mt-2 px-1 text-xs text-emerald-700" role="status">{uploadNotice}</p>}
          <p className="mt-2 px-1 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
        </form>
      </section>
    </div>
  );
}
