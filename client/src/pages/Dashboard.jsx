import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { getAnalytics, getDocuments, getErrorMessage } from "../services/api.js";

function MetricCard({ label, value, detail }) {
  return (
    <section className="panel p-5 sm:p-6">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </section>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [documentCount, setDocumentCount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAnalytics(), getDocuments()])
      .then(([analytics, documents]) => {
        setMetrics(analytics);
        setDocumentCount(documents.length);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  if (error) return <div className="alert-error">{error}</div>;
  if (!metrics || documentCount === null) return <Loader label="Loading your workspace..." />;

  const cards = [
    { label: "Uploaded documents", value: documentCount, detail: "PDFs in your workspace" },
    { label: "Total queries", value: metrics.totalQueries ?? 0, detail: "Questions answered" },
    { label: "Cache hits", value: metrics.cacheHits ?? 0, detail: "Responses served from cache" },
    { label: "Cache hit rate", value: `${Number(metrics.cacheHitRate ?? 0).toFixed(2)}%`, detail: "Of all recorded queries" },
    { label: "Avg. response time", value: `${Number(metrics.avgResponseTime ?? 0).toFixed(0)} ms`, detail: "Across recorded queries" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Overview</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Your knowledge workspace</h2>
          <p className="mt-2 text-sm text-slate-500">Manage documents and get answers grounded in your files.</p>
        </div>
        <Link className="button-primary w-fit" to="/documents">Upload documents</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <MetricCard key={card.label} {...card} />)}
      </div>
      <section className="panel flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-semibold text-slate-900">Ask your documents</h3>
          <p className="mt-1 text-sm text-slate-500">Start a conversation and get answers with page-level sources.</p>
        </div>
        <Link className="button-secondary w-fit" to="/chat">Open chat <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
