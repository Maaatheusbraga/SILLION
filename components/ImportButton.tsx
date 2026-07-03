"use client";

import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLeads } from "@/lib/hooks/useLeads";

type ImportMode = "active" | "new";

const BASE_NAME_PLACEHOLDER = "Ex.: João Pessoa · Clínicas de estética";

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { refresh, activeDatasetId, activeDataset, setActiveDatasetId } =
    useLeads();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("new");
  const [baseName, setBaseName] = useState("");

  const dialogOpen = pendingFile !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  function closeDialog() {
    if (loading) return;
    setPendingFile(null);
    setBaseName("");
    setImportMode("new");
  }

  async function runImport(file: File, mode: ImportMode, name: string) {
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    if (mode === "new") {
      formData.append("newBaseName", name.trim());
    } else if (activeDatasetId) {
      formData.append("datasetId", activeDatasetId);
    }

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Erro na importação.");
        return;
      }

      if (data.datasetId && mode === "new") {
        setActiveDatasetId(data.datasetId);
      }

      const dup = data.skippedDuplicates ?? 0;
      const invalid = data.skippedInvalid ?? 0;
      const parts = [
        `${data.imported} novos em "${data.datasetName}"`,
        dup > 0 ? `${dup} duplicados nesta base` : null,
        invalid > 0 ? `${invalid} inválidos` : null,
        `${data.datasetTotal} na base`,
      ].filter(Boolean);

      setMessage(parts.join(" · "));
      setPendingFile(null);
      setBaseName("");
      setImportMode("new");
      await refresh();
    } catch {
      setMessage("Falha ao importar arquivo.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 7000);
    }
  }

  function handleFileSelect(file: File) {
    setPendingFile(file);
    setImportMode("new");
    setBaseName("");
    setMessage(null);
  }

  const canImport =
    importMode === "active"
      ? !!activeDatasetId
      : baseName.trim().length > 0;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-60"
      >
        <Upload size={15} aria-hidden />
        <span className="hidden sm:inline">
          {loading ? "Importando…" : "Importar Excel"}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        className="sillion-dialog sillion-dialog--import fixed inset-0 z-[100] rounded-xl border border-border bg-surface p-0 text-ink shadow-[var(--shadow-card)] backdrop:bg-black/60 open:flex open:flex-col"
      >
        {pendingFile && (
          <>
            <div className="flex items-start justify-between border-b border-border-subtle px-5 py-4">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Importar planilha
                </p>
                <h2
                  id="import-dialog-title"
                  className="mt-1 text-lg font-semibold text-balance"
                >
                  Onde salvar os leads?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={loading}
                className="rounded-md p-1 text-muted hover:bg-surface-elevated hover:text-ink disabled:opacity-60"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-elevated px-4 py-3">
                <FileSpreadsheet
                  size={22}
                  className="shrink-0 text-primary"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">Arquivo</p>
                  <p className="truncate text-sm font-medium text-ink">
                    {pendingFile.name}
                  </p>
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-medium text-ink">
                  Destino da importação
                </legend>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle p-4 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "new"}
                    onChange={() => setImportMode("new")}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">
                      Nova base
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">
                      Cria uma partição isolada — ideal para campanha ou região
                      diferente.
                    </span>
                  </span>
                </label>

                {activeDatasetId && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle p-4 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "active"}
                      onChange={() => setImportMode("active")}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">
                        Adicionar à base atual
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">
                        {activeDataset
                          ? `Unifica com "${activeDataset.name}" (${activeDataset.leadCount} leads). Duplicados por place_id são ignorados.`
                          : "Base ativa selecionada no topo."}
                      </span>
                    </span>
                  </label>
                )}
              </fieldset>

              {importMode === "new" && (
                <div>
                  <label
                    htmlFor="import-base-name"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    Nome da base
                  </label>
                  <input
                    id="import-base-name"
                    type="text"
                    value={baseName}
                    onChange={(e) => setBaseName(e.target.value)}
                    placeholder={BASE_NAME_PLACEHOLDER}
                    autoFocus
                    className="w-full rounded-md border border-border bg-surface-elevated px-3 py-3 text-sm placeholder:text-muted focus:border-primary"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Use região e nicho para achar depois no seletor de bases.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-auto flex justify-end gap-2 border-t border-border-subtle px-5 py-4">
              <button
                type="button"
                disabled={loading}
                onClick={closeDialog}
                className="rounded-md px-4 py-2.5 text-sm text-muted hover:text-ink disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !canImport}
                onClick={() => runImport(pendingFile, importMode, baseName)}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "Importando…" : "Importar"}
              </button>
            </div>
          </>
        )}
      </dialog>

      {message &&
        typeof document !== "undefined" &&
        createPortal(
          <p
            role="status"
            className="sillion-card fixed bottom-6 left-1/2 z-[100] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 rounded-lg border border-border bg-surface-elevated px-4 py-3 text-center text-sm leading-relaxed text-ink shadow-lg"
          >
            {message}
          </p>,
          document.body
        )}
    </>
  );
}
