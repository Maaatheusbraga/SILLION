import * as XLSX from "xlsx";
import type { ImportRow } from "./leads";

/** Normaliza chaves do Excel (website, Website, etc.). */
export function normalizeImportRow(
  raw: Record<string, unknown>
): ImportRow {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    row[key.toLowerCase().trim()] = value;
  }

  return {
    title: row.title?.toString(),
    phone_unformatted: row.phone_unformatted?.toString(),
    phone: row.phone as string | number | undefined,
    address: row.address?.toString(),
    neighborhood: row.neighborhood?.toString(),
    city: row.city?.toString(),
    postal_code: row.postal_code?.toString(),
    total_score: row.total_score != null ? Number(row.total_score) : undefined,
    reviews_count:
      row.reviews_count != null ? Number(row.reviews_count) : undefined,
    place_id: row.place_id?.toString(),
    website: row.website?.toString(),
  };
}

export function parseWorkbookRows(buffer: ArrayBuffer): ImportRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rawRows.map(normalizeImportRow);
}
