"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useLeads } from "@/lib/hooks/useLeads";

type ImportMode = "active" | "new";

const BASE_NAME_PLACEHOLDER = "Ex.: João Pessoa · Clínicas de estética";

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { refresh, activeDatasetId, activeDataset, setActiveDatasetId } =
    useLeads();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("new");
  const [baseName, setBaseName] = useState("");

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
  }

  const canImport =
    importMode === "active"
      ? !!activeDatasetId
      : baseName.trim().length > 0;

  return (
    <div className="relative">
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

      {pendingFile && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => !loading && setPendingFile(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-labelledby="import-dialog-title"
            className="sillion-card fixed left-1/2 top-1/2 z-50 max-h-[min(90dvh,100%)] w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl"
          >
            <h3
              id="import-dialog-title"
              className="text-base font-semibold text-ink"
            >
              Importar planilha
            </h3>
            <p className="mt-1 text-sm text-muted">
              Arquivo:{" "}
              <span className="text-ink">{pendingFile.name}</span>
            </p>

            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border-subtle p-3 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "new"}
                  onChange={() => setImportMode("new")}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    Nova base
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Partição isolada — ideal para trocar de campanha ou região.
                  </span>
                </span>
              </label>

              {activeDatasetId && (
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border-subtle p-3 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "active"}
                    onChange={() => setImportMode("active")}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      Adicionar à base atual
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {activeDataset
                        ? `"${activeDataset.name}" (${activeDataset.leadCount} leads)`
                        : "Base ativa"}
                    </span>
                  </span>
                </label>
              )}
            </div>

            {importMode === "new" && (
              <div className="mt-4">
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
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-muted focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-muted">
                  Dica: use região e nicho para identificar depois ao apagar ou
                  trocar de base. O nome é livre — escolha como preferir.
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setPendingFile(null);
                  setBaseName("");
                }}
                className="rounded-md px-4 py-2 text-sm text-muted hover:text-ink disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !canImport}
                onClick={() =>
                  runImport(pendingFile, importMode, baseName)
                }
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "Importando…" : "Importar"}
              </button>
            </div>
          </div>
        </>
      )}

      {message && !pendingFile && (
        <p
          role="status"
          className="sillion-card fixed left-1/2 top-20 z-40 w-[min(calc(100vw-2rem),300px)] -translate-x-1/2 rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs leading-relaxed text-muted sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-max sm:max-w-[300px] sm:translate-x-0"
        >
          {message}
        </p>
      )}
    </div>
  );
}
