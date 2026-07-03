import { NextResponse } from "next/server";
import { createUser, deleteUser, listUsersPublic } from "@/lib/auth";
import { getMasterSession } from "@/lib/master-auth";

export async function GET() {
  const session = await getMasterSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const users = await listUsersPublic();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getMasterSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = await createUser({ username, displayName, password });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ user: result.user }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getMasterSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  }

  const ok = await deleteUser(id);
  if (!ok) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
