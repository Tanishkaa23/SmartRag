import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-lg font-semibold tracking-tight text-slate-900 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2.5 mt-5 text-base font-semibold tracking-tight text-slate-900 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-900 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-6 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-slate-400">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:text-slate-500">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-6">{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-slate-300 pl-4 text-slate-600">{children}</blockquote>,
  hr: () => <hr className="my-5 border-0 border-t border-slate-200" />,
  a: ({ href, children }) => <a className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-500" href={href} target="_blank" rel="noreferrer">{children}</a>,
  table: ({ children }) => (
    <div className="my-4 max-w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-max border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 text-slate-700">{children}</thead>,
  th: ({ children }) => <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-slate-100 px-3 py-2.5 align-top">{children}</td>,
  pre: ({ children }) => <pre className="my-4 max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800">{children}</pre>,
  code: ({ className, children }) => {
    const isBlock = Boolean(className) || String(children).includes("\n");
    return <code className={isBlock ? "font-mono" : "rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800"}>{children}</code>;
  },
};

export default function MessageContent({ content }) {
  const markdown = typeof content === "string" ? content.replace(/<br\s*\/?>/gi, "  \n") : "";

  if (!markdown.trim()) {
    return <p className="text-sm italic text-slate-500">No response content available.</p>;
  }

  return (
    <div className="message-content break-words text-sm leading-6 text-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{markdown}</ReactMarkdown>
    </div>
  );
}
