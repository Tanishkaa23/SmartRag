import { Navigate, useLocation } from "react-router-dom";
import Loader from "./Loader.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Restoring your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Restoring your session..." />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
