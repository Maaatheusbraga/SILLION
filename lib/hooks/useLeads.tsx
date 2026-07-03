"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Dataset, Lead } from "@/lib/types";

const ACTIVE_DATASET_KEY = "sillion-active-dataset";

export interface DatasetWithCount extends Dataset {
  leadCount: number;
}

interface LeadsContextValue {
  leads: Lead[];
  allLeads: Lead[];
  datasets: DatasetWithCount[];
  activeDatasetId: string | null;
  activeDataset: DatasetWithCount | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshDatasets: () => Promise<DatasetWithCount[]>;
  setActiveDatasetId: (id: string) => void;
  updateLeadLocal: (lead: Lead) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [datasets, setDatasets] = useState<DatasetWithCount[]>([]);
  const [activeDatasetId, setActiveDatasetIdState] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setActiveDatasetId = useCallback((id: string) => {
    setActiveDatasetIdState(id);
    try {
      localStorage.setItem(ACTIVE_DATASET_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshDatasets = useCallback(async (): Promise<DatasetWithCount[]> => {
    const res = await fetch("/api/datasets");
    if (!res.ok) throw new Error("Falha ao carregar bases.");
    const data = await res.json();
    const items = (data.datasets ?? []) as DatasetWithCount[];
    setDatasets(items);
    return items;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, loadedDatasets] = await Promise.all([
        fetch("/api/leads"),
        refreshDatasets(),
      ]);
      if (!leadsRes.ok) throw new Error("Falha ao carregar leads.");
      const leadsData = await leadsRes.json();
      setAllLeads(leadsData.leads);

      let activeId: string | null = null;
      try {
        activeId = localStorage.getItem(ACTIVE_DATASET_KEY);
      } catch {
        /* ignore */
      }

      const validIds = new Set(loadedDatasets.map((d: DatasetWithCount) => d.id));
      if (!activeId || !validIds.has(activeId)) {
        activeId = loadedDatasets[0]?.id ?? null;
      }
      if (activeId) setActiveDatasetId(activeId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [refreshDatasets, setActiveDatasetId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const leads = useMemo(() => {
    if (!activeDatasetId) return allLeads;
    return allLeads.filter((l) => l.datasetId === activeDatasetId);
  }, [allLeads, activeDatasetId]);

  const activeDataset = useMemo(
    () => datasets.find((d) => d.id === activeDatasetId) ?? null,
    [datasets, activeDatasetId]
  );

  const updateLeadLocal = useCallback((lead: Lead) => {
    setAllLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
  }, []);

  const value = useMemo(
    () => ({
      leads,
      allLeads,
      datasets,
      activeDatasetId,
      activeDataset,
      loading,
      error,
      refresh,
      refreshDatasets,
      setActiveDatasetId,
      updateLeadLocal,
    }),
    [
      leads,
      allLeads,
      datasets,
      activeDatasetId,
      activeDataset,
      loading,
      error,
      refresh,
      refreshDatasets,
      setActiveDatasetId,
      updateLeadLocal,
    ]
  );

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) {
    throw new Error("useLeads must be used within LeadsProvider");
  }
  return ctx;
}
