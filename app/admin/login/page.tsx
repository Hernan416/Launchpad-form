"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Login failed.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-brand-lg border border-brand-line bg-brand-surface p-8 shadow-soft"
      >
        <h1 className="font-display text-xl font-bold text-brand-ink">Admin Login</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Enter the admin password to manage form content.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Password
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-brand border border-brand-line bg-brand-bg px-4 py-3 text-brand-ink outline-none transition-colors focus:border-brand-blue"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="mt-6 w-full rounded-brand bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
