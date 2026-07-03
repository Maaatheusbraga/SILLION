import { NextResponse } from "next/server";
import {
  countLeadsByDataset,
  createDataset,
  ensureDatasetsMigrated,
  getDatasets,
} from "@/lib/datasets";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureDatasetsMigrated();
  const datasets = await getDatasets();
  const counts = await countLeadsByDataset();

  return NextResponse.json({
    datasets: datasets.map((d) => ({
      ...d,
      leadCount: counts[d.id] ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : "";

  if (!name.trim()) {
    return NextResponse.json(
      { error: "Informe o nome da nova base." },
      { status: 400 }
    );
  }

  const dataset = await createDataset(name, session.displayName);
  return NextResponse.json({ dataset: { ...dataset, leadCount: 0 } });
}
