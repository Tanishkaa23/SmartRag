import { useCallback, useEffect, useRef, useState } from "react";
import Loader from "../components/Loader.jsx";
import { deleteDocument, getDocuments, getErrorMessage, uploadDocuments } from "../services/api.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatBytes(bytes) {
  if (!bytes) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  if (!date) return "—";
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? "—" : value.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-emerald-50 text-emerald-700",
    processing: "bg-amber-50 text-amber-700",
    failed: "bg-rose-50 text-rose-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>{status || "unknown"}</span>;
}

export default function Documents() {
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDocuments(await getDocuments());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setNotice("");
    setError("");
    if (!files.length) return;

    const invalid = files.find((file) => file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf"));
    if (invalid) {
      setError(`${invalid.name} is not a PDF file.`);
      return;
    }
    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`${oversized.name} exceeds the 10 MB file size limit.`);
      return;
    }
    if (files.length > 10) {
      setError("You can upload up to 10 PDFs at a time.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadDocuments(files);
      await refresh();
      const failed = result.failedDocuments || [];
      const uploaded = result.totalUploaded ?? 0;
      setNotice(failed.length ? `${uploaded} uploaded. ${failed.map((item) => `${item.filename}: ${item.error}`).join(" ")}` : `${uploaded} ${uploaded === 1 ? "document" : "documents"} uploaded successfully.`);
      if (failed.length) setError(failed.map((item) => `${item.filename}: ${item.error}`).join(" "));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      try {
        setDocuments(await getDocuments());
      } catch {
        setError(`${getErrorMessage(requestError)} Document list could not be refreshed.`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document) => {
    if (!window.confirm(`Delete "${document.filename}"? This will remove it from your knowledge base.`)) return;
    setDeleting(document._id);
    setError("");
    setNotice("");
    try {
      await deleteDocument(document._id);
      setDocuments((current) => current.filter((item) => item._id !== document._id));
      setNotice(`${document.filename} was deleted.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeleting("");
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Knowledge base</p>
          <h2 className="page-heading">Documents</h2>
          <p className="mt-2 text-sm text-slate-500">Upload PDFs to make their contents searchable in chat.</p>
        </div>
        <button className="button-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload PDFs"}
        </button>
        <input ref={inputRef} className="hidden" type="file" accept="application/pdf,.pdf" multiple onChange={handleFiles} />
      </div>
      {error && <div className="alert-error" role="alert">{error}</div>}
      {notice && !error && <div className="alert-success" role="status">{notice}</div>}
      {loading ? <Loader label="Loading documents..." /> : (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-slate-900">All documents</h3>
            <span className="text-xs text-slate-500">{documents.length} total</span>
          </div>
          {documents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></svg>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No documents yet</h3>
              <p className="mt-1 text-sm text-slate-500">Upload a PDF to get started with SmartRAG.</p>
              <button className="button-secondary mt-5" onClick={() => inputRef.current?.click()}>Choose a PDF</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[690px] text-left">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr><th className="px-6 py-3">Filename</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Chunks</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((document) => (
                    <tr key={document._id} className="text-sm">
                      <td className="max-w-[260px] px-6 py-4 font-medium text-slate-800"><span className="block truncate">{document.originalName || document.filename}</span></td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatDate(document.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatBytes(document.fileSize)}</td>
                      <td className="px-4 py-4 text-slate-500">{document.totalChunks ?? 0}</td>
                      <td className="px-4 py-4"><StatusBadge status={document.status} /></td>
                      <td className="px-6 py-4 text-right"><button className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50" onClick={() => handleDelete(document)} disabled={deleting === document._id}>{deleting === document._id ? "Deleting..." : "Delete"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      <p className="text-xs text-slate-400">PDF only · Up to 10 MB per file · Up to 10 files per upload</p>
    </div>
  );
}
