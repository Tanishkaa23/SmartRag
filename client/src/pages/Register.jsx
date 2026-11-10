import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Register() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Password must be no more than 72 bytes.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password });
      navigate("/", { replace: true });
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
          <p className="eyebrow">Get started</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Start building your personal document workspace.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-name">
            Name
            <input id="register-name" className="field mt-2" type="text" autoComplete="name" maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-email">
            Email
            <input id="register-email" className="field mt-2" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-password">
            Password
            <input id="register-password" className="field mt-2" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="register-confirm-password">
            Confirm password
            <input id="register-confirm-password" className="field mt-2" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <button className="button-primary w-full" type="submit" disabled={submitting || loading}>
            {submitting ? <><span className="loader" /> Creating account...</> : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-medium text-blue-600 hover:text-blue-700" to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
