import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const { login, user, loading, restoreError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="panel w-full max-w-md p-7 sm:p-9">
        <div className="mb-7">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">S</div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Sign in to SmartRAG</h1>
          <p className="mt-2 text-sm text-slate-500">Access your documents and conversations.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="login-email">
            Email
            <input id="login-email" className="field mt-2" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="login-password">
            Password
            <input id="login-password" className="field mt-2" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {(error || restoreError) && <div className="alert-error" role="alert">{error || restoreError}</div>}
          <button className="button-primary w-full" type="submit" disabled={submitting || loading}>
            {submitting ? <><span className="loader" /> Signing in...</> : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">New to SmartRAG? <Link className="font-medium text-blue-600 hover:text-blue-700" to="/register">Create an account</Link></p>
      </section>
    </main>
  );
}
