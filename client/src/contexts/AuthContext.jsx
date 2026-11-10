import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAuthToken, getAuthToken, getCurrentUser, getErrorMessage, loginRequest, registerRequest, setAuthToken } from "../services/api.js";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState("");

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setUser(await getCurrentUser());
      } catch (error) {
        if (error.response?.status === 401) clearAuthToken();
        else setRestoreError(getErrorMessage(error));
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const handleUnauthorized = () => {
      clearAuthToken();
      setUser(null);
      setLoading(false);
    };

    window.addEventListener("smartrag:unauthorized", handleUnauthorized);
    restoreSession();
    return () => window.removeEventListener("smartrag:unauthorized", handleUnauthorized);
  }, []);

  const establishSession = (response) => {
    setAuthToken(response.token);
    setUser(response.user);
    setRestoreError("");
    return response.user;
  };

  const login = async (credentials) => establishSession(await loginRequest(credentials));
  const register = async (credentials) => establishSession(await registerRequest(credentials));
  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, restoreError, login, register, logout }), [user, loading, restoreError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
