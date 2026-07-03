import { NextResponse } from "next/server";
import { getMasterSession } from "@/lib/master-auth";

export async function GET() {
  const session = await getMasterSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.json({ master: { username: session.username } });
}
