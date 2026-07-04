import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildImportPreview } from "@/lib/import-preview";
import { parseWorkbookRows } from "@/lib/import-xlsx";
import { getLeads } from "@/lib/leads";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const datasetId = formData.get("datasetId")?.toString().trim() ?? "";

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo Excel (.xlsx) é obrigatório." },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const rows = parseWorkbookRows(buffer);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Planilha vazia ou sem dados reconhecíveis." },
      { status: 400 }
    );
  }

  const leads = await getLeads();
  const existingPlaceIds = new Set(
    leads
      .filter((l) => !datasetId || l.datasetId === datasetId)
      .map((l) => l.placeId)
  );

  const preview = buildImportPreview(rows, existingPlaceIds);

  return NextResponse.json({ preview });
}
