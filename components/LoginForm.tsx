"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao entrar.");
        return;
      }

      router.push("/lista");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sillion-card rounded-lg border border-border-subtle bg-surface p-6"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Nome de usuário
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary"
            placeholder="ex.: ana"
          />
          <p className="mt-1.5 text-xs text-muted">
            Um nome único por vendedor — usado só para entrar.
          </p>
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </form>
  );
}
