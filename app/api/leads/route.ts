import { NextResponse } from "next/server";
import { ensureDatasetsMigrated } from "@/lib/datasets";
import { getSession } from "@/lib/auth";
import { getLeads } from "@/lib/leads";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureDatasetsMigrated();
  const leads = await getLeads();
  return NextResponse.json({ leads });
}
