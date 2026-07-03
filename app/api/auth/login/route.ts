import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();  const username = body.username?.toString().trim();
  const password = body.password?.toString();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Nome de usuário e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const user = await authenticate(username, password);
  if (!user) {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos." },
      { status: 401 }
    );
  }

  await createSession(user);
  return NextResponse.json({ user });
}
