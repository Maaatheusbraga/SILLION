import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createDataset, ensureDatasetsMigrated, getDatasetById } from "@/lib/datasets";
import { getSession } from "@/lib/auth";
import { importLeadsFromRows, type ImportRow } from "@/lib/leads";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const datasetIdRaw = formData.get("datasetId");
  const mode = formData.get("mode")?.toString() ?? "active";
  const newBaseName = formData.get("newBaseName")?.toString().trim();

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo Excel (.xlsx) é obrigatório." },
      { status: 400 }
    );
  }

  await ensureDatasetsMigrated();

  let datasetId =
    typeof datasetIdRaw === "string" && datasetIdRaw ? datasetIdRaw : null;

  if (mode === "new") {
    if (!newBaseName) {
      return NextResponse.json(
        { error: "Informe o nome da base antes de importar." },
        { status: 400 }
      );
    }
    const dataset = await createDataset(newBaseName, session.displayName);
    datasetId = dataset.id;
  } else if (datasetId) {
    const exists = await getDatasetById(datasetId);
    if (!exists) {
      return NextResponse.json(
        { error: "Base selecionada não encontrada." },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Selecione uma base ou crie uma nova com nome." },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Planilha vazia ou sem dados reconhecíveis." },
      { status: 400 }
    );
  }

  const result = await importLeadsFromRows(rows, datasetId);
  const dataset = await getDatasetById(datasetId);

  return NextResponse.json({
    ...result,
    datasetId,
    datasetName: dataset?.name ?? "Base",
  });
}
