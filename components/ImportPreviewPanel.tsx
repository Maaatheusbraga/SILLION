"use client";

import type { ImportPreviewResult } from "@/lib/import-preview";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { getScoreTier } from "@/lib/lead-score";
import { WebPresenceBadge } from "./WebPresenceBadge";

interface ImportPreviewPanelProps {
  preview: ImportPreviewResult;
  loading?: boolean;
}

export function ImportPreviewPanel({
  preview,
  loading,
}: ImportPreviewPanelProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-elevated px-4 py-8 text-center text-sm text-muted">
        Analisando planilha…
      </div>
    );
  }

  const stats = [
    { label: "Novos leads", value: preview.willImport, accent: true },
    { label: "Duplicados", value: preview.skippedDuplicates },
    { label: "Inválidos", value: preview.skippedInvalid },
    { label: "Sem site", value: preview.noWebsite },
    { label: "Só Instagram", value: preview.instagramOnly },
    { label: "Alta oportunidade", value: preview.highOpportunity, accent: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Pré-visualização</h3>
        <p className="mt-1 text-xs text-muted">
          {preview.totalRows} linhas na planilha · prioridade para quem precisa
          de site ou gestão
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map(({ label, value, accent }) => (
          <div
            key={label}
            className={`rounded-lg border px-3 py-2 ${
              accent
                ? "border-primary/30 bg-primary/5"
                : "border-border-subtle bg-surface-elevated"
            }`}
          >
            <p className="text-xl font-bold tabular-nums text-ink">{value}</p>
            <p className="text-[11px] leading-snug text-muted">{label}</p>
          </div>
        ))}
      </div>

      {preview.sample.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          <p className="border-b border-border-subtle bg-surface-elevated px-3 py-2 text-xs font-medium text-muted">
            Top leads por oportunidade (amostra)
          </p>
          <ul className="divide-y divide-border-subtle">
            {preview.sample.map((row, i) => (
              <li
                key={`${row.title}-${i}`}
                className="flex items-start gap-3 px-3 py-2.5"
              >
                <LeadScoreBadge
                  score={row.score}
                  tier={getScoreTier(row.score)}
                  compact
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {row.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {row.city}
                    {row.phone ? ` · ${row.phone}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <WebPresenceBadge
                      presence={row.webPresence}
                      website={row.website}
                    />
                    <span className="text-[11px] text-muted">
                      {row.opportunityHint}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Nenhum lead novo será importado (todos duplicados ou inválidos).
        </p>
      )}
    </div>
  );
}
