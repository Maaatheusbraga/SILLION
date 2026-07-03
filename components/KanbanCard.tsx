"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star } from "lucide-react";
import { formatDateBR } from "@/lib/dates";
import type { Lead } from "@/lib/types";

interface KanbanCardProps {
  lead: Lead;
  onOpen: (lead: Lead) => void;
}

export function KanbanCard({ lead, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id, data: { lead } });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="group sillion-card rounded-md border border-border-subtle bg-surface-elevated transition-[border-color,box-shadow] hover:border-primary/30"
    >
      <div className="flex items-start gap-1 p-3">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded p-1 text-muted opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Arrastar card"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="text-sm font-medium leading-snug text-balance text-ink">
            {lead.title}
          </h3>
          <p className="mt-1 text-xs text-muted">{lead.neighborhood}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {lead.totalScore != null && (
              <span className="inline-flex items-center gap-1 text-xs text-accent">
                <Star size={11} aria-hidden />
                {lead.totalScore.toFixed(1)}
              </span>
            )}
            {lead.ownerName && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {lead.ownerName.split(" ")[0]}
              </span>
            )}
            {lead.nextFollowUp && (
              <span className="text-xs text-muted">
                ↻ {formatDateBR(lead.nextFollowUp)}
              </span>
            )}
          </div>
        </button>
      </div>
    </article>
  );
}
