"use client";

import { LogOut, Shield, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { formatDateTimeBR } from "@/lib/dates";
import type { UserPublic } from "@/lib/types";

export function MasterUserManager({ masterUsername }: { masterUsername: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/master/users");
      if (res.status === 401) {
        router.push("/master/login");
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar usuários.");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/master/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao criar usuário.");
        return;
      }

      setUsername("");
      setDisplayName("");
      setPassword("");
      setMessage(`Usuário "${data.user.username}" criado.`);
      await loadUsers();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/master/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao remover usuário.");
        return;
      }

      setMessage("Usuário removido.");
      setConfirmDeleteId(null);
      await loadUsers();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setDeletingId(null);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function logout() {
    await fetch("/api/master/logout", { method: "POST" });
    router.push("/master/login");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Shield size={22} aria-hidden />
          </div>
          <div>
            <h1 className="sillion-display text-xl font-bold sm:text-2xl">
              Administração
            </h1>
            <p className="mt-1 text-sm text-muted">
              Logado como{" "}
              <span className="text-ink">{masterUsername}</span> · gerencie
              quem acessa o CRM
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink"
        >
          <LogOut size={16} aria-hidden />
          Sair
        </button>
      </header>

      <section className="sillion-card rounded-lg border border-border-subtle bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <UserPlus size={16} aria-hidden />
          Novo usuário do CRM
        </h2>
        <p className="mt-1 text-sm text-muted">
          A senha é hasheada no servidor (bcrypt) — nunca é armazenada em
          texto nem enviada de volta pela API.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-username"
                className="mb-1.5 block text-sm font-medium"
              >
                Usuário (login)
              </label>
              <input
                id="new-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex.: maria"
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="new-display"
                className="mb-1.5 block text-sm font-medium"
              >
                Nome de apresentação
              </label>
              <input
                id="new-display"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ex.: Maria Santos"
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="mb-1.5 block text-sm font-medium"
            >
              Senha inicial
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm"
            />
            <p className="mt-1.5 text-xs text-muted">Mínimo 6 caracteres.</p>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {creating ? "Criando…" : "Criar usuário"}
          </button>
        </form>
      </section>

      <section className="sillion-card rounded-lg border border-border-subtle bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">
          Usuários cadastrados ({users.length})
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted">Carregando…</p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nenhum usuário ainda. Crie o primeiro acima.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-md border border-border-subtle bg-surface-elevated px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      @{u.username}{" "}
                      <span className="font-normal text-muted">
                        · {u.displayName}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Criado {formatDateTimeBR(u.createdAt)}
                    </p>
                  </div>
                  {confirmDeleteId === u.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={deletingId === u.id}
                        onClick={() => handleDelete(u.id)}
                        className="rounded-md bg-danger px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {deletingId === u.id ? "…" : "Confirmar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-muted hover:text-ink"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(u.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-danger/30 px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={13} aria-hidden />
                      Remover
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}

      <p className="text-center text-xs text-muted">
        <a href="/login" className="text-primary hover:underline">
          Ir para login do CRM
        </a>
      </p>
    </div>
  );
}
