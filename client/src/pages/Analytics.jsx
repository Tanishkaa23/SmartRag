import { useEffect, useState } from "react";
import Loader from "../components/Loader.jsx";
import { getAnalytics, getErrorMessage } from "../services/api.js";

const metrics = [
  { key: "totalQueries", label: "Total queries", format: (value) => value.toLocaleString(), detail: "Questions processed" },
  { key: "cacheHits", label: "Cache hits", format: (value) => value.toLocaleString(), detail: "Served from semantic cache" },
  { key: "cacheMisses", label: "Cache misses", format: (value) => value.toLocaleString(), detail: "Required document retrieval" },
  { key: "cacheHitRate", label: "Cache hit rate", format: (value) => `${value.toFixed(2)}%`, detail: "Share of all queries" },
  { key: "avgResponseTime", label: "Avg. response time", format: (value) => `${value.toFixed(0)} ms`, detail: "Across recorded queries" },
  { key: "totalTokens", label: "Total tokens", format: (value) => value.toLocaleString(), detail: "Recorded model usage" },
  { key: "simpleQueries", label: "Simple queries", format: (value) => value.toLocaleString(), detail: "Routed to the standard model" },
  { key: "advancedQueries", label: "Advanced queries", format: (value) => value.toLocaleString(), detail: "Routed to the advanced model" },
  { key: "autoQueries", label: "Auto mode", format: (value) => value.toLocaleString(), detail: "Questions using automatic source selection" },
  { key: "documentModeQueries", label: "Documents mode", format: (value) => value.toLocaleString(), detail: "Questions restricted to uploaded PDFs" },
  { key: "generalModeQueries", label: "General AI mode", format: (value) => value.toLocaleString(), detail: "Questions answered without document retrieval" },
  { key: "documentAnswers", label: "Document answers", format: (value) => value.toLocaleString(), detail: "Answers grounded in PDF content" },
  { key: "generalAnswers", label: "General AI answers", format: (value) => value.toLocaleString(), detail: "Answers from general model knowledge" },
];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics().then(setData).catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return <Loader label="Loading analytics..." />;

  return (
    <div className="space-y-7">
      <div>
        <p className="eyebrow">Workspace performance</p>
        <h2 className="page-heading">Analytics</h2>
        <p className="mt-2 text-sm text-slate-500">Usage metrics reported by the SmartRAG API.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, format, detail }) => {
          const value = Number(data[key] ?? 0);
          return (
            <section key={key} className="panel p-5">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{format(value)}</p>
              <p className="mt-2 text-xs text-slate-400">{detail}</p>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">Metrics reflect the data currently available from the API.</p>
    </div>
  );
}
