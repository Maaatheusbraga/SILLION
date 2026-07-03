"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DEFAULT_MESSAGE_TEMPLATE, type SessionUser } from "@/lib/types";
import { previewContactMessage } from "@/lib/messages";
import { DatasetManager } from "./DatasetManager";
import { ThemeToggle } from "./ThemeToggle";

export function SettingsForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [messageTemplate, setMessageTemplate] = useState(
    user.messageTemplate || DEFAULT_MESSAGE_TEMPLATE
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user.displayName);
    setMessageTemplate(user.messageTemplate || DEFAULT_MESSAGE_TEMPLATE);
  }, [user]);

  const preview = useMemo(
    () => previewContactMessage(messageTemplate, displayName),
    [messageTemplate, displayName]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, messageTemplate }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        return;
      }

      setMessage("Configurações salvas.");
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  function resetTemplate() {
    setMessageTemplate(DEFAULT_MESSAGE_TEMPLATE);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="sillion-display text-2xl font-bold text-balance">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted">
          Usuário <span className="text-ink">@{user.username}</span> — ajuste
          como você se apresenta nos primeiros contatos.
        </p>
      </header>

      <section className="sillion-card rounded-lg border border-border-subtle bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Aparência</h2>
        <p className="mt-1 text-sm text-muted">
          Modo escuro com identidade roxa SILLION, ou modo claro para ambientes
          iluminados.
        </p>
        <div className="mt-4">
          <ThemeToggle showLabel />
        </div>
      </section>

      <DatasetManager />

      <form
        onSubmit={handleSubmit}
        className="sillion-card space-y-6 rounded-lg border border-border-subtle bg-surface p-5 sm:p-6"
      >
        <div>
          <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium">
            Nome de apresentação
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm"
            placeholder="Como você quer ser chamado nas mensagens"
          />
          <p className="mt-1.5 text-xs text-muted">
            Aparece no claim do lead e na mensagem inicial de contato.
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="messageTemplate" className="text-sm font-medium">
              Modelo da mensagem inicial
            </label>
            <button
              type="button"
              onClick={resetTemplate}
              className="text-xs text-primary hover:underline"
            >
              Restaurar padrão
            </button>
          </div>
          <textarea
            id="messageTemplate"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm leading-relaxed"
          />
          <p className="mt-2 text-xs text-muted">
            Variáveis:{" "}
            <code className="rounded bg-surface-hover px-1 py-0.5 text-ink">
              {"{vendedor}"}
            </code>
            ,{" "}
            <code className="rounded bg-surface-hover px-1 py-0.5 text-ink">
              {"{empresa}"}
            </code>
            ,{" "}
            <code className="rounded bg-surface-hover px-1 py-0.5 text-ink">
              {"{cidade}"}
            </code>
          </p>
        </div>

        <div className="rounded-md border border-border-subtle bg-surface-elevated p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Prévia
          </p>
          <p className="text-sm leading-relaxed text-pretty text-ink whitespace-pre-wrap">
            {preview}
          </p>
        </div>

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

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </form>

      <section className="rounded-lg border border-border-subtle bg-surface/60 p-5 text-sm text-muted">
        <h2 className="font-medium text-ink">Duplicatas na importação</h2>
        <p className="mt-2 leading-relaxed text-pretty">
          Leads com o mesmo{" "}
          <strong className="text-ink">place_id</strong> (Google Place ID) são
          ignorados dentro da mesma base. Bases diferentes são independentes —
          o mesmo estabelecimento pode existir em campanhas separadas.
        </p>
      </section>
    </div>
  );
}
