"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { useLeads } from "@/lib/hooks/useLeads";
import type { InteractionChannel, Lead, LeadStatus } from "@/lib/types";
import { KANBAN_STATUSES } from "@/lib/types";
import { ContactModal } from "./ContactModal";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";
import { LeadPanel } from "./LeadPanel";

export function KanbanBoard() {
  const { leads, loading, error, updateLeadLocal } = useLeads();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    lead: Lead;
    status: LeadStatus;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  );

  const cardLeads = useMemo(
    () => leads.filter((l) => l.isCard),
    [leads]
  );

  const columns = useMemo(() => {
    const map = Object.fromEntries(
      KANBAN_STATUSES.map((s) => [s, [] as Lead[]])
    ) as Record<LeadStatus, Lead[]>;

    for (const lead of cardLeads) {
      if (map[lead.status]) map[lead.status].push(lead);
    }
    return map;
  }, [cardLeads]);

  async function applyMove(
    leadId: string,
    status: LeadStatus,
    interaction?: { channel: InteractionChannel; note: string }
  ) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "move",
        status,
        interaction,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      updateLeadLocal(data.lead);
      if (selectedLead?.id === leadId) setSelectedLead(data.lead);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as Lead | undefined;
    if (lead) setActiveLead(lead);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const lead = event.active.data.current?.lead as Lead | undefined;
    const newStatus = event.over?.id as LeadStatus | undefined;

    if (!lead || !newStatus || !KANBAN_STATUSES.includes(newStatus)) return;
    if (lead.status === newStatus) return;

    if (lead.status === "nao_contatado" && newStatus === "contatado") {
      setPendingMove({ lead, status: newStatus });
      return;
    }

    applyMove(lead.id, newStatus);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-muted">
        Carregando pipeline…
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
      <div className="mb-6">
        <h1 className="sillion-display text-2xl font-bold">Pipeline</h1>
        <p className="mt-1 text-sm text-muted">
          {cardLeads.length} cards ativos · arraste para atualizar o status
        </p>
      </div>

      {cardLeads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-ink font-medium">Nenhum card no pipeline</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Importe um Excel na Lista e use &quot;Tornar card&quot; para trazer leads
            para cá.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="sillion-scroll -mx-3 flex gap-3 overflow-x-auto px-3 pb-4 snap-x snap-mandatory sm:mx-0 sm:gap-4 sm:px-0">
            {KANBAN_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={columns[status]}
                onOpenLead={setSelectedLead}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="w-72 rotate-1 opacity-90">
                <KanbanCard lead={activeLead} onOpen={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <ContactModal
        open={!!pendingMove}
        leadTitle={pendingMove?.lead.title ?? ""}
        onClose={() => setPendingMove(null)}
        onConfirm={(channel, note) => {
          if (pendingMove) {
            applyMove(pendingMove.lead.id, pendingMove.status, { channel, note });
          }
          setPendingMove(null);
        }}
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
