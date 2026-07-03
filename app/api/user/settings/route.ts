import { NextResponse } from "next/server";
import { createSession, getSession, updateUserSettings } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const displayName = body.displayName?.toString() ?? "";
  const messageTemplate = body.messageTemplate?.toString() ?? "";

  if (!displayName.trim()) {
    return NextResponse.json(
      { error: "Nome de apresentação é obrigatório." },
      { status: 400 }
    );
  }

  const user = await updateUserSettings(session.id, {
    displayName,
    messageTemplate,
  });

  if (!user) {
    return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });
  }

  await createSession(user);
  return NextResponse.json({ user });
}
