import type { LeadStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const STATUS_STYLES: Record<LeadStatus, string> = {
  importado: "bg-surface-elevated text-muted border-border-subtle",
  nao_contatado: "bg-accent-muted text-accent border-accent/20",
  contatado: "bg-primary/15 text-primary border-primary/25",
  negociacao: "bg-[oklch(0.78_0.11_85/0.12)] text-accent border-accent/20",
  convertido: "bg-success/15 text-success border-success/25",
  descartado: "bg-danger/10 text-danger border-danger/20",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
