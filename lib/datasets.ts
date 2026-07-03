import { v4 as uuidv4 } from "uuid";
import { getLeads, saveLeadsDirect } from "./leads";
import { readJsonFile, writeJsonFile } from "./storage";
import type { Dataset } from "./types";

const DATASETS_FILE = "datasets.json";

interface DatasetsStore {
  items: Dataset[];
}

async function readStore(): Promise<DatasetsStore> {
  return readJsonFile<DatasetsStore>(DATASETS_FILE, { items: [] });
}

async function writeStore(store: DatasetsStore) {
  await writeJsonFile(DATASETS_FILE, store);
}

export async function getDatasets(): Promise<Dataset[]> {
  const store = await readStore();
  return store.items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDatasetById(id: string): Promise<Dataset | undefined> {
  const datasets = await getDatasets();
  return datasets.find((d) => d.id === id);
}

export async function createDataset(
  name: string,
  createdByName?: string | null
): Promise<Dataset> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nome da base é obrigatório.");

  const store = await readStore();
  const dataset: Dataset = {
    id: uuidv4(),
    name: trimmed,
    createdAt: new Date().toISOString(),
    createdByName: createdByName ?? null,
  };
  store.items.push(dataset);
  await writeStore(store);
  return dataset;
}

export async function renameDataset(
  id: string,
  name: string
): Promise<Dataset | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const store = await readStore();
  const index = store.items.findIndex((d) => d.id === id);
  if (index === -1) return null;

  store.items[index] = { ...store.items[index], name: trimmed };
  await writeStore(store);
  return store.items[index];
}

export async function deleteDataset(id: string): Promise<{
  deletedLeads: number;
  remainingDatasets: number;
} | null> {
  const store = await readStore();
  const index = store.items.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const leads = await getLeads();
  const remaining = leads.filter((l) => l.datasetId !== id);
  const deletedLeads = leads.length - remaining.length;

  await saveLeadsDirect(remaining);
  store.items.splice(index, 1);
  await writeStore(store);

  return {
    deletedLeads,
    remainingDatasets: store.items.length,
  };
}

/** Garante dataset padrão e associa leads legados sem datasetId */
export async function ensureDatasetsMigrated(): Promise<Dataset[]> {
  const store = await readStore();
  const leads = await getLeads();

  if (store.items.length === 0) {
    const legacy = await createDataset("Base importada");
    if (leads.length > 0) {
      const patched = leads.map((l) =>
        l.datasetId ? l : { ...l, datasetId: legacy.id }
      );
      await saveLeadsDirect(patched);
    }
    return [legacy];
  }

  const defaultId = store.items[0].id;
  const needsLeadPatch = leads.some((l) => !l.datasetId);
  if (needsLeadPatch) {
    const patched = leads.map((l) =>
      l.datasetId ? l : { ...l, datasetId: defaultId }
    );
    await saveLeadsDirect(patched);
  }

  return store.items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countLeadsByDataset(): Promise<Record<string, number>> {
  const leads = await getLeads();
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    counts[lead.datasetId] = (counts[lead.datasetId] ?? 0) + 1;
  }
  return counts;
}
