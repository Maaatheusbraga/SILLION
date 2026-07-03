import { NextResponse } from "next/server";
import { deleteDataset, renameDataset } from "@/lib/datasets";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  const dataset = await renameDataset(id, name);
  if (!dataset) {
    return NextResponse.json({ error: "Base não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ dataset });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteDataset(id);

  if (!result) {
    return NextResponse.json({ error: "Base não encontrada." }, { status: 404 });
  }

  return NextResponse.json(result);
}
