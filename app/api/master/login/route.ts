import { NextResponse } from "next/server";
import {
  authenticateMaster,
  createMasterSession,
} from "@/lib/master-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuário e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const session = await authenticateMaster(username, password);
  if (!session) {
    return NextResponse.json(
      { error: "Credenciais inválidas." },
      { status: 401 }
    );
  }

  await createMasterSession(session);
  return NextResponse.json({ ok: true, username: session.username });
}
