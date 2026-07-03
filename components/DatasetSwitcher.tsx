"use client";

import { ChevronDown, Database } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLeads } from "@/lib/hooks/useLeads";

interface DatasetSwitcherProps {
  fullWidth?: boolean;
}

export function DatasetSwitcher({ fullWidth = false }: DatasetSwitcherProps) {
  const { datasets, activeDatasetId, activeDataset, setActiveDatasetId } =
    useLeads();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  if (datasets.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className={`relative ${fullWidth ? "w-full" : "max-w-[240px]"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-md border border-border bg-surface-elevated py-2 text-sm text-ink transition-colors hover:bg-surface-hover ${
          fullWidth
            ? "w-full justify-between px-3"
            : "max-w-[240px] px-2.5"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={activeDataset?.name ?? "Selecionar base"}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Database size={15} className="shrink-0 text-primary" aria-hidden />
          <span className="truncate">
            {activeDataset?.name ?? "Base de leads"}
          </span>
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted" aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`sillion-card z-50 rounded-lg border border-border bg-surface p-1.5 shadow-lg ${
            fullWidth
              ? "absolute left-0 right-0 top-full mt-1.5 max-h-[min(50dvh,320px)] overflow-y-auto"
              : "absolute left-0 top-full mt-1.5 min-w-[240px] max-w-[320px]"
          }`}
        >
          {datasets.map((d) => {
            const active = d.id === activeDatasetId;
            return (
              <li key={d.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDatasetId(d.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-ink hover:bg-surface-elevated"
                  }`}
                >
                  <span className="truncate font-medium">{d.name}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {d.leadCount}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
