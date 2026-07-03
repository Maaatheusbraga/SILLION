"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Lead, LeadStatus } from "@/lib/types";
import { COLUMN_META } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
}

export function KanbanColumn({ status, leads, onOpenLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = COLUMN_META[status];

  return (
    <section
      ref={setNodeRef}
      className={`flex w-[min(85vw,18rem)] shrink-0 snap-center flex-col rounded-lg border transition-colors sm:w-72 ${
        isOver
          ? "border-primary bg-primary/10"
          : "border-border-subtle bg-surface/80"
      }`}
      aria-label={meta.label}
    >
      <header className="border-b border-border-subtle px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">{meta.label}</h2>
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-muted">
            {leads.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">{meta.hint}</p>
      </header>

      <div className="sillion-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-3 min-h-[100px] max-h-[min(55dvh,520px)] sm:min-h-[120px] sm:max-h-[calc(100dvh-220px)]">
        {leads.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">Nenhum card aqui</p>
        ) : (
          leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onOpen={onOpenLead} />
          ))
        )}
      </div>
    </section>
  );
}
