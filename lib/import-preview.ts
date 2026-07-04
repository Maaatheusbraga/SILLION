import { computeLeadScore, getOpportunityHint } from "./lead-score";
import type { ImportRow } from "./leads";
import {
  classifyWebPresence,
  normalizeWebsiteUrl,
  type WebPresence,
} from "./web-presence";

export interface ImportPreviewRow {
  title: string;
  city: string;
  phone: string;
  website: string;
  webPresence: WebPresence;
  totalScore: number | null;
  reviewsCount: number | null;
  score: number;
  opportunityHint: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  willImport: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  noWebsite: number;
  instagramOnly: number;
  ownWebsite: number;
  highOpportunity: number;
  sample: ImportPreviewRow[];
}

function rowToPreview(row: ImportRow): ImportPreviewRow | null {
  const placeId = row.place_id?.trim();
  const title = row.title?.trim();
  if (!placeId || !title) return null;

  const websiteRaw = row.website?.trim() ?? "";
  const webPresence = classifyWebPresence(websiteRaw);
  const website = normalizeWebsiteUrl(websiteRaw);
  const phone =
    row.phone_unformatted?.trim() || row.phone?.toString().trim() || "";

  const totalScore =
    row.total_score != null && !Number.isNaN(Number(row.total_score))
      ? Number(row.total_score)
      : null;
  const reviewsCount =
    row.reviews_count != null && !Number.isNaN(Number(row.reviews_count))
      ? Number(row.reviews_count)
      : null;

  const partial = {
    webPresence,
    website,
    phone,
    totalScore,
    reviewsCount,
  };

  return {
    title,
    city: row.city?.trim() ?? "",
    phone,
    website,
    webPresence,
    totalScore,
    reviewsCount,
    score: computeLeadScore(partial),
    opportunityHint: getOpportunityHint(partial),
  };
}

export function buildImportPreview(
  rows: ImportRow[],
  existingPlaceIds: Set<string>
): ImportPreviewResult {
  let willImport = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  let noWebsite = 0;
  let instagramOnly = 0;
  let ownWebsite = 0;
  let highOpportunity = 0;
  const importable: ImportPreviewRow[] = [];

  for (const row of rows) {
    const preview = rowToPreview(row);
    if (!preview) {
      skippedInvalid++;
      continue;
    }

    const placeId = row.place_id!.trim();
    if (existingPlaceIds.has(placeId)) {
      skippedDuplicates++;
      continue;
    }

    willImport++;
    importable.push(preview);

    if (preview.webPresence === "none") noWebsite++;
    if (preview.webPresence === "instagram") instagramOnly++;
    if (preview.webPresence === "own_site") ownWebsite++;
    if (preview.score >= 60) highOpportunity++;
  }

  importable.sort((a, b) => b.score - a.score);

  return {
    totalRows: rows.length,
    willImport,
    skippedDuplicates,
    skippedInvalid,
    noWebsite,
    instagramOnly,
    ownWebsite,
    highOpportunity,
    sample: importable.slice(0, 8),
  };
}
