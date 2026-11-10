import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "grid" },
  { to: "/documents", label: "Documents", icon: "file" },
  { to: "/chat", label: "Chat", icon: "chat" },
  { to: "/analytics", label: "Analytics", icon: "chart" },
];

const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
};

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/50 md:hidden" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">S</div>
          <span className="text-[17px] font-semibold tracking-tight text-white">SmartRAG</span>
        </div>
        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
          <nav className="space-y-1">
            {links.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">{paths[icon]}</svg>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-5">
          <div className="flex items-center gap-3 rounded-lg bg-white/[0.05] p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-200">SR</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-200">SmartRAG workspace</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Document assistant</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
