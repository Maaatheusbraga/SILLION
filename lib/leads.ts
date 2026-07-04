import { v4 as uuidv4 } from "uuid";
import { readJsonFile, writeJsonFile } from "./storage";
import {
  classifyWebPresence,
  normalizeWebsiteUrl,
} from "./web-presence";
import type { Comment, Interaction, InteractionChannel, Lead, LeadStatus } from "./types";

const LEADS_FILE = "leads.json";

function normalizeLead(raw: Lead & { website?: string; webPresence?: Lead["webPresence"] }): Lead {
  const interactions = raw.interactions ?? [];
  let comments: Comment[] = raw.comments ?? [];

  if (raw.notes?.trim() && comments.length === 0) {
    comments = [
      {
        id: uuidv4(),
        text: raw.notes.trim(),
        createdAt: raw.updatedAt ?? new Date().toISOString(),
        userId: "legacy",
        userName: "Nota anterior",
      },
    ];
  }

  const websiteRaw = raw.website ?? "";
  const webPresence =
    raw.webPresence ?? classifyWebPresence(websiteRaw);

  return {
    ...raw,
    datasetId: raw.datasetId ?? "",
    website: normalizeWebsiteUrl(websiteRaw),
    webPresence,
    interactions,
    comments,
    notes: "",
  };
}

export async function getLeads(): Promise<Lead[]> {
  const raw = await readJsonFile<(Lead & { website?: string })[]>(LEADS_FILE, []);
  const leads = raw.map(normalizeLead);
  const needsSave = raw.some(
    (l) =>
      !l.comments ||
      (l.notes?.trim() && (l.comments?.length ?? 0) === 0) ||
      l.website === undefined ||
      l.webPresence === undefined
  );
  if (needsSave && leads.length > 0) await saveLeads(leads);
  return leads;
}

async function saveLeads(leads: Lead[]) {
  await writeJsonFile(LEADS_FILE, leads);
}

export async function saveLeadsDirect(leads: Lead[]) {
  await saveLeads(leads);
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  const leads = await getLeads();
  return leads.find((l) => l.id === id);
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>
): Promise<Lead | null> {
  const leads = await getLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveLeads(leads);
  return leads[index];
}

export async function promoteToCard(id: string): Promise<Lead | null> {
  const lead = await getLeadById(id);
  if (!lead || lead.isCard) return lead ?? null;

  return updateLead(id, {
    isCard: true,
    status: "nao_contatado",
  });
}

export async function moveLeadStatus(
  id: string,
  status: LeadStatus,
  user?: { id: string; displayName: string },
  interaction?: { channel: InteractionChannel; note: string }
): Promise<Lead | null> {
  const lead = await getLeadById(id);
  if (!lead) return null;

  const patch: Partial<Lead> = { status };

  if (status === "contatado" && user) {
    if (!lead.ownerId) {
      patch.ownerId = user.id;
      patch.ownerName = user.displayName;
    }

    if (interaction) {
      const entry: Interaction = {
        id: uuidv4(),
        channel: interaction.channel,
        note: interaction.note,
        createdAt: new Date().toISOString(),
        userId: user.id,
        userName: user.displayName,
      };
      patch.interactions = [...lead.interactions, entry];
    }
  }

  return updateLead(id, patch);
}

export async function contactLead(
  id: string,
  user: { id: string; displayName: string },
  interaction: { channel: InteractionChannel; note?: string }
): Promise<Lead | null> {
  const lead = await getLeadById(id);
  if (!lead) return null;

  const entry: Interaction = {
    id: uuidv4(),
    channel: interaction.channel,
    note: interaction.note ?? "Primeiro contato via lista",
    createdAt: new Date().toISOString(),
    userId: user.id,
    userName: user.displayName,
  };

  return updateLead(id, {
    isCard: true,
    status: "contatado",
    ownerId: lead.ownerId ?? user.id,
    ownerName: lead.ownerName ?? user.displayName,
    interactions: [...lead.interactions, entry],
  });
}

export async function addInteraction(
  id: string,
  user: { id: string; displayName: string },
  channel: InteractionChannel,
  note: string
): Promise<Lead | null> {
  const lead = await getLeadById(id);
  if (!lead) return null;

  const entry: Interaction = {
    id: uuidv4(),
    channel,
    note,
    createdAt: new Date().toISOString(),
    userId: user.id,
    userName: user.displayName,
  };

  return updateLead(id, {
    interactions: [...(lead.interactions ?? []), entry],
  });
}

export async function addComment(
  id: string,
  user: { id: string; displayName: string },
  text: string
): Promise<Lead | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lead = await getLeadById(id);
  if (!lead) return null;

  const entry: Comment = {
    id: uuidv4(),
    text: trimmed,
    createdAt: new Date().toISOString(),
    userId: user.id,
    userName: user.displayName,
  };

  return updateLead(id, {
    comments: [...(lead.comments ?? []), entry],
  });
}

export interface ImportRow {
  title?: string;
  phone_unformatted?: string;
  phone?: string | number;
  address?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  total_score?: number;
  reviews_count?: number;
  place_id?: string;
  website?: string;
}

export async function importLeadsFromRows(
  rows: ImportRow[],
  datasetId: string
): Promise<{
  imported: number;
  skipped: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  total: number;
  datasetTotal: number;
}> {
  const leads = await getLeads();
  const existingPlaceIds = new Set(
    leads.filter((l) => l.datasetId === datasetId).map((l) => l.placeId)
  );
  let imported = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    const placeId = row.place_id?.toString().trim();
    const title = row.title?.toString().trim();
    if (!placeId || !title) {
      skippedInvalid++;
      continue;
    }
    if (existingPlaceIds.has(placeId)) {
      skippedDuplicates++;
      continue;
    }

    const phone =
      row.phone_unformatted?.toString().trim() ||
      row.phone?.toString().trim() ||
      "";

    const websiteRaw = row.website?.toString().trim() ?? "";
    const webPresence = classifyWebPresence(websiteRaw);

    const now = new Date().toISOString();
    const lead: Lead = {
      id: uuidv4(),
      datasetId,
      placeId,
      title,
      phone,
      address: row.address?.toString() ?? "",
      neighborhood: row.neighborhood?.toString() ?? "",
      city: row.city?.toString() ?? "",
      postalCode: row.postal_code?.toString() ?? "",
      totalScore:
        row.total_score != null && !Number.isNaN(Number(row.total_score))
          ? Number(row.total_score)
          : null,
      reviewsCount:
        row.reviews_count != null && !Number.isNaN(Number(row.reviews_count))
          ? Number(row.reviews_count)
          : null,
      website: normalizeWebsiteUrl(websiteRaw),
      webPresence,
      status: "importado",
      isCard: false,
      notes: "",
      ownerId: null,
      ownerName: null,
      nextFollowUp: null,
      interactions: [],
      comments: [],
      importedAt: now,
      updatedAt: now,
    };

    leads.push(lead);
    existingPlaceIds.add(placeId);
    imported++;
  }

  await saveLeads(leads);
  const datasetTotal = leads.filter((l) => l.datasetId === datasetId).length;
  return {
    imported,
    skipped: skippedDuplicates + skippedInvalid,
    skippedDuplicates,
    skippedInvalid,
    total: leads.length,
    datasetTotal,
  };
}
