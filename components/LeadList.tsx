"use client";

import { LayoutGrid, LayoutList, MessageCircle, Search, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useLeads } from "@/lib/hooks/useLeads";
import { isFollowUpDue } from "@/lib/followup";
import type { InteractionChannel, Lead, LeadStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { LeadPanel } from "./LeadPanel";
import { QuickContactModal } from "./QuickContactModal";
import { StatusBadge } from "./StatusBadge";

export function LeadList() {
  const searchParams = useSearchParams();
  const followupFilter = searchParams.get("followup") === "due";
  const { leads, loading, error, activeDataset, updateLeadLocal } = useLeads();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [cardFilter, setCardFilter] = useState<"all" | "cards" | "imported">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [contactLead, setContactLead] = useState<Lead | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (followupFilter && !isFollowUpDue(lead)) return false;
      if (followupFilter && (lead.status === "convertido" || lead.status === "descartado"))
        return false;
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (cardFilter === "cards" && !lead.isCard) return false;
      if (cardFilter === "imported" && lead.isCard) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          lead.title.toLowerCase().includes(q) ||
          lead.neighborhood.toLowerCase().includes(q) ||
          lead.phone.includes(q)
        );
      }
      return true;
    });
  }, [leads, search, statusFilter, cardFilter, followupFilter]);

  async function promote(id: string) {
    setPromoting(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote" }),
      });
      const data = await res.json();
      if (res.ok) updateLeadLocal(data.lead);
    } finally {
      setPromoting(null);
    }
  }

  async function confirmContact(channel: InteractionChannel) {
    if (!contactLead) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/leads/${contactLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "contact", channel }),
      });
      const data = await res.json();
      if (res.ok) {
        updateLeadLocal(data.lead);
        setContactLead(null);
      }
    } finally {
      setConfirming(false);
    }
  }

  function canContact(lead: Lead) {
    return (
      lead.phone &&
      (lead.status === "importado" ||
        (lead.isCard && lead.status === "nao_contatado"))
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-muted">
        Carregando lista…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error}
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <LayoutList size={20} aria-hidden />
          </div>
          <div>
            <h1 className="sillion-display text-xl font-bold sm:text-2xl">Lista</h1>
            <p className="mt-0.5 text-sm text-muted text-pretty">
              {filtered.length} de {leads.length} leads
              {activeDataset && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-ink">{activeDataset.name}</span>
                </>
              )}
              {followupFilter && " · follow-ups pendentes"}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 sm:flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-elevated py-2.5 pl-9 pr-3 text-sm placeholder:text-muted"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LeadStatus | "all")
            }
            className="min-w-0 rounded-md border border-border bg-surface-elevated px-2 py-2.5 text-sm sm:px-3"
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={cardFilter}
            onChange={(e) =>
              setCardFilter(e.target.value as "all" | "cards" | "imported")
            }
            className="min-w-0 rounded-md border border-border bg-surface-elevated px-2 py-2.5 text-sm sm:px-3"
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos</option>
            <option value="imported">Só importados</option>
            <option value="cards">Só cards</option>
          </select>
          </div>
        </div>
      </header>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <LayoutList size={32} className="mb-4 text-muted" aria-hidden />
          <p className="font-medium text-ink">Base vazia</p>
          <p className="mt-2 max-w-sm text-sm text-muted text-pretty">
            Importe um Excel pelo botão no topo para começar.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          Nenhum lead corresponde aos filtros.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((lead, index) => (
            <li
              key={lead.id}
              className="sillion-card flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ animationDelay: `${Math.min(index, 6) * 30}ms` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={lead.status} />
                  {!lead.isCard && (
                    <span className="rounded-full border border-border-subtle bg-surface-elevated px-2 py-0.5 text-xs text-muted">
                      Estoque
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(lead)}
                  className="mt-2 block max-w-full truncate text-left text-base font-semibold text-ink hover:text-primary"
                >
                  {lead.title}
                </button>
                <p className="mt-1 text-sm text-muted">
                  {lead.neighborhood}
                  {lead.city ? ` · ${lead.city}` : ""}
                  {lead.phone ? ` · ${lead.phone}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                  {lead.totalScore != null && (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Star size={11} aria-hidden />
                      {lead.totalScore.toFixed(1)}
                    </span>
                  )}
                  {lead.ownerName && <span>{lead.ownerName}</span>}
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                {canContact(lead) ? (
                  <button
                    type="button"
                    onClick={() => setContactLead(lead)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover sm:w-auto sm:py-2"
                  >
                    <MessageCircle size={15} aria-hidden />
                    Contatar
                  </button>
                ) : null}
                {!lead.isCard ? (
                  <button
                    type="button"
                    disabled={promoting === lead.id}
                    onClick={() => promote(lead.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm text-muted hover:bg-surface-elevated hover:text-ink disabled:opacity-60 sm:w-auto sm:py-2"
                  >
                    <LayoutGrid size={14} aria-hidden />
                    {promoting === lead.id ? "…" : "Só card"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <QuickContactModal
        lead={contactLead}
        open={!!contactLead}
        onClose={() => setContactLead(null)}
        onConfirm={confirmContact}
        confirming={confirming}
      />

      <LeadPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={(lead) => {
          updateLeadLocal(lead);
          setSelectedLead(lead);
        }}
      />
    </>
  );
}
