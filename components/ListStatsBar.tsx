"use client";

import type { Lead } from "@/lib/types";
import { isFollowUpDue } from "@/lib/followup";
import { isHighOpportunityLead } from "@/lib/lead-score";

interface ListStatsBarProps {
  leads: Lead[];
}

export function ListStatsBar({ leads }: ListStatsBarProps) {
  const imported = leads.filter((l) => l.status === "importado").length;
  const ready = leads.filter(
    (l) =>
      l.phone &&
      (l.status === "importado" ||
        (l.isCard && l.status === "nao_contatado"))
  ).length;
  const noSite = leads.filter(
    (l) => l.webPresence === "none" || l.webPresence === "instagram"
  ).length;
  const highOpp = leads.filter(isHighOpportunityLead).length;
  const followUps = leads.filter(
    (l) =>
      isFollowUpDue(l) &&
      l.status !== "convertido" &&
      l.status !== "descartado"
  ).length;

  const items = [
    { label: "Importados", value: imported, highlight: false },
    { label: "Prontos p/ contato", value: ready, highlight: ready > 0 },
    { label: "Sem site / só IG", value: noSite, highlight: noSite > 0 },
    { label: "Alta oportunidade", value: highOpp, highlight: highOpp > 0 },
    { label: "Follow-up hoje", value: followUps, highlight: followUps > 0 },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ label, value, highlight }) => (
        <div
          key={label}
          className={`rounded-lg border px-3 py-2.5 ${
            highlight
              ? "border-primary/30 bg-primary/5"
              : "border-border-subtle bg-surface"
          }`}
        >
          <p className="text-2xl font-bold tabular-nums text-ink">{value}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
