import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addComment,
  addInteraction,
  assignLeadOwner,
  contactLead,
  getLeadById,
  moveLeadStatus,
  promoteToCard,
  updateLead,
} from "@/lib/leads";
import type { InteractionChannel, LeadStatus } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const action = body.action as string;

  if (action === "promote") {
    const lead = await promoteToCard(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  }

  if (action === "move") {
    const status = body.status as LeadStatus;
    const interaction = body.interaction as
      | { channel: InteractionChannel; note: string }
      | undefined;

    const lead = await moveLeadStatus(id, status, session, interaction);
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  }

  if (action === "contact") {
    const channel = (body.channel as InteractionChannel) ?? "whatsapp";
    const note = body.note?.toString();
    const lead = await contactLead(id, session, { channel, note });
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  }

  if (action === "interaction") {
    const channel = body.channel as InteractionChannel;
    const note = body.note?.toString() ?? "";
    const lead = await addInteraction(id, session, channel, note);
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  }

  if (action === "comment") {
    const text = body.text?.toString() ?? "";
    if (!text.trim()) {
      return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });
    }
    const lead = await addComment(id, session, text);
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  }

  if (action === "assignOwner") {
    const ownerId =
      body.ownerId === null || body.ownerId === ""
        ? null
        : body.ownerId?.toString();

    const lead = await assignLeadOwner(id, ownerId);
    if (!lead) {
      return NextResponse.json(
        { error: "Lead ou responsável não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ lead });
  }

  const patch: Partial<{ nextFollowUp: string | null }> = {};
  if (body.nextFollowUp !== undefined) patch.nextFollowUp = body.nextFollowUp;

  const lead = await updateLead(id, patch);

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
