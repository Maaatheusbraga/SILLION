"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { followUpLabel, getDueFollowUps } from "@/lib/followup";
import { useLeads } from "@/lib/hooks/useLeads";
import { StatusBadge } from "./StatusBadge";

export function FollowUpAlert() {
  const { leads } = useLeads();
  const [open, setOpen] = useState(false);

  const dueLeads = useMemo(() => getDueFollowUps(leads), [leads]);
  const count = dueLeads.length;

  if (count === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent-muted px-2.5 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        aria-expanded={open}
        aria-label={`${count} follow-ups pendentes`}
      >
        <Bell size={15} aria-hidden />
        <span className="hidden sm:inline">Follow-ups</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
          {count}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="sillion-card fixed inset-x-3 top-[4.5rem] z-50 max-h-[min(60dvh,360px)] overflow-y-auto rounded-lg border border-border bg-surface p-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(100vw-2rem,320px)] sm:max-h-64">
            <p className="px-2 py-2 text-xs font-medium text-muted">
              Follow-ups vencidos ou para hoje
            </p>
            <ul className="sillion-scroll max-h-64 space-y-1 overflow-y-auto">
              {dueLeads.slice(0, 8).map((lead) => (
                <li key={lead.id}>
                  <Link
                    href="/lista?followup=due"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 transition-colors hover:bg-surface-elevated"
                  >
                    <p className="truncate text-sm font-medium text-ink">
                      {lead.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={lead.status} />
                      <span className="text-xs text-accent">
                        {followUpLabel(lead.nextFollowUp!)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {count > 8 && (
              <Link
                href="/lista?followup=due"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-md px-3 py-2 text-center text-xs font-medium text-primary hover:bg-surface-elevated"
              >
                Ver todos ({count})
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
