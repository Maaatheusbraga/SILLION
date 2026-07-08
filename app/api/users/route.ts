import { NextResponse } from "next/server";
import { getSession, listUsersPublic } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const users = await listUsersPublic();
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      username: u.username,
    })),
  });
}
