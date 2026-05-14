import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getAuthErrorMessage } from "../services/authService.js";

export function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/library", { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
      <p className="mt-2 text-sm text-slate-600">
        Access your saved experiments and collaborative rooms.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error ? (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-brand-red"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="signin-email"
            className="block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none ring-brand-blue focus:border-brand-blue focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="signin-password"
            className="block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none ring-brand-blue focus:border-brand-blue focus:ring-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full min-h-[44px] items-center justify-center rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link
          to="/signup"
          className="font-semibold text-brand-red hover:text-brand-red-dark hover:underline"
        >
          Create an account
        </Link>
      </p>

      <Link
        to="/"
        className="mt-4 inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
