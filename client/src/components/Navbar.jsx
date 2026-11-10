import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const titles = {
  "/": "Dashboard",
  "/documents": "Documents",
  "/chat": "Chat",
  "/analytics": "Analytics",
};

export default function Navbar({ onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <button className="icon-button md:hidden" onClick={onMenu} aria-label="Open navigation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">{titles[pathname] || "SmartRAG"}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[180px] truncate text-xs text-slate-700 font-semibold sm:block capitalize" title={user?.email}>{user?.name || user?.email}</span>
        <button className="button-secondary min-h-9 px-3" type="button" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
