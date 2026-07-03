"use client";

import { Database, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { formatDateTimeBR } from "@/lib/dates";
import { useLeads } from "@/lib/hooks/useLeads";

export function DatasetManager() {
  const {
    datasets,
    activeDatasetId,
    setActiveDatasetId,
    refresh,
    refreshDatasets,
  } = useLeads();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar base.");
        return;
      }

      await refresh();
      setActiveDatasetId(data.dataset.id);
      setNewName("");
      setMessage(`Base "${data.dataset.name}" criada. Importe um Excel para populá-la.`);
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
    setMessage(null);

    try {
      const res = await fetch(`/api/datasets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao apagar base.");
        return;
      }

      const remaining = await refreshDatasets();
      await refresh();

      if (activeDatasetId === id) {
        const next = remaining[0]?.id;
        if (next) setActiveDatasetId(next);
      }

      setMessage(
        `Base removida (${data.deletedLeads} lead${data.deletedLeads === 1 ? "" : "s"} apagado${data.deletedLeads === 1 ? "" : "s"}).`
      );
      setConfirmDeleteId(null);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setDeletingId(null);
      setTimeout(() => setMessage(null), 6000);
    }
  }

  return (
    <section className="sillion-card rounded-lg border border-border-subtle bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Database size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">Bases de prospecção</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">
          Cada base funciona como uma partição isolada — ideal para trocar de
          campanha ou região sem misturar leads. Nomeie com região e nicho para
          reconhecer facilmente na hora de apagar ou trocar.
        </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ex.: João Pessoa · Clínicas de estética"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          <Plus size={16} aria-hidden />
          {creating ? "Criando…" : "Nova base"}
        </button>
      </form>

      {datasets.length > 0 && (
        <ul className="mt-5 space-y-2">
          {datasets.map((d) => {
            const isActive = d.id === activeDatasetId;
            const confirming = confirmDeleteId === d.id;

            return (
              <li
                key={d.id}
                className={`rounded-md border px-4 py-3 ${
                  isActive
                    ? "border-primary/30 bg-primary/5"
                    : "border-border-subtle bg-surface-elevated"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{d.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {d.leadCount} lead{d.leadCount === 1 ? "" : "s"} · criada{" "}
                      {formatDateTimeBR(d.createdAt)}
                      {d.createdByName ? ` · ${d.createdByName}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => setActiveDatasetId(d.id)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-hover"
                      >
                        Usar esta
                      </button>
                    )}
                    {isActive && (
                      <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                        Ativa
                      </span>
                    )}
                    {!confirming ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(d.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-danger/30 px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10"
                        aria-label={`Apagar base ${d.name}`}
                      >
                        <Trash2 size={13} aria-hidden />
                        Apagar
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={deletingId === d.id}
                          onClick={() => handleDelete(d.id)}
                          className="rounded-md bg-danger px-2.5 py-1.5 text-xs font-medium text-white hover:bg-danger/90 disabled:opacity-60"
                        >
                          {deletingId === d.id ? "Apagando…" : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md px-2 py-1.5 text-xs text-muted hover:text-ink"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {confirming && (
                  <p className="mt-2 text-xs text-danger">
                    Isso apaga permanentemente esta base e todos os{" "}
                    {d.leadCount} leads dela (lista, Kanban, comentários e
                    follow-ups).
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 text-sm text-success">
          {message}
        </p>
      )}
    </section>
  );
}
