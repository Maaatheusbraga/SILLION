"use client";

import {
  Check,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
  X,
  Globe,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildContactMessage } from "@/lib/messages";
import { computeLeadScore, getOpportunityHint, getScoreTier } from "@/lib/lead-score";
import { whatsAppUrl } from "@/lib/utils";
import type { InteractionChannel, Lead, SessionUser } from "@/lib/types";
import { CHANNEL_LABELS, DEFAULT_MESSAGE_TEMPLATE } from "@/lib/types";
import { DatePickerPtBR } from "./DatePickerPtBR";
import { StatusBadge } from "./StatusBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { WebPresenceBadge } from "./WebPresenceBadge";
import { formatDateTimeBR } from "@/lib/dates";

interface LeadPanelProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
}

export function LeadPanel({ lead, onClose, onUpdate }: LeadPanelProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lead) {
      setCommentDraft("");
      setFollowUp(lead.nextFollowUp?.slice(0, 10) ?? "");
      setCopied(false);
    }
  }, [lead]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.user && setUser(data.user))
      .catch(() => {});
  }, []);

  const contactMessage = useMemo(() => {
    if (!lead || !user) return "";
    const template = user.messageTemplate || DEFAULT_MESSAGE_TEMPLATE;
    return buildContactMessage(template, {
      vendedor: user.displayName,
      empresa: lead.title,
      cidade: lead.city || "sua cidade",
    });
  }, [lead, user]);

  if (!lead) return null;

  const comments = lead.comments ?? [];

  async function saveFollowUp(value: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextFollowUp: value || null }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data.lead);
    } finally {
      setSaving(false);
    }
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    const text = commentDraft.trim();
    if (!text) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", text }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.lead);
        setCommentDraft("");
      }
    } finally {
      setSendingComment(false);
    }
  }

  async function logInteraction(channel: InteractionChannel) {
    const note = prompt(`Nota da ${CHANNEL_LABELS[channel].toLowerCase()}:`) ?? "";
    const res = await fetch(`/api/leads/${lead!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "interaction", channel, note }),
    });
    const data = await res.json();
    if (res.ok) onUpdate(data.lead);
  }

  async function copyMessage() {
    if (!contactMessage) return;
    await navigator.clipboard.writeText(contactMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wa = whatsAppUrl(lead.phone, contactMessage || undefined);
  const leadScore = computeLeadScore(lead);
  const scoreTier = getScoreTier(leadScore);
  const opportunityHint = getOpportunityHint(lead);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="sillion-card animate-fade-up fixed inset-x-0 bottom-0 z-50 flex max-h-[min(92dvh,100%)] w-full flex-col rounded-t-2xl border-t border-border-subtle bg-surface safe-bottom sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:max-h-none sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0"
        aria-label={`Detalhes de ${lead.title}`}
      >
        <div className="mx-auto mb-2 mt-1 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden />

        <div className="flex items-start justify-between border-b border-border-subtle px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-4">
            <StatusBadge status={lead.status} />
            <h2 className="mt-2 text-lg font-semibold text-balance leading-snug">
              {lead.title}
            </h2>
            {lead.ownerName && (
              <p className="mt-1 text-sm text-muted">
                Responsável: {lead.ownerName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted hover:bg-surface-elevated hover:text-ink"
            aria-label="Fechar painel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sillion-scroll flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          <section className="flex flex-wrap items-start gap-3">
            <LeadScoreBadge score={leadScore} tier={scoreTier} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <WebPresenceBadge
                  presence={lead.webPresence}
                  website={lead.website}
                />
              </div>
              <p className="text-xs font-medium text-primary">
                {opportunityHint}
              </p>
            </div>
          </section>

          <section className="space-y-2 text-sm">
            {lead.phone && (
              <p className="flex items-center gap-2 text-ink">
                <Phone size={15} className="shrink-0 text-muted" aria-hidden />
                {lead.phone}
              </p>
            )}
            {lead.neighborhood && (
              <p className="flex items-start gap-2 text-muted">
                <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden />
                {lead.neighborhood}, {lead.city}
              </p>
            )}
            {lead.totalScore != null && (
              <p className="flex items-center gap-2 text-muted">
                <Star size={15} className="shrink-0 text-accent" aria-hidden />
                {lead.totalScore.toFixed(1)} · {lead.reviewsCount ?? 0} avaliações
              </p>
            )}
            {lead.website && (
              <p className="flex items-center gap-2 text-muted">
                <Globe size={15} className="shrink-0" aria-hidden />
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {lead.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
          </section>

          {contactMessage && (
            <section className="rounded-md border border-primary/20 bg-primary/10 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Mensagem inicial
                </h3>
                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {copied ? (
                    <>
                      <Check size={13} aria-hidden />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm leading-relaxed text-pretty text-ink whitespace-pre-wrap">
                {contactMessage}
              </p>
            </section>
          )}

          <section className="flex flex-wrap gap-2">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                <MessageCircle size={15} aria-hidden />
                WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => logInteraction("ligacao")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-elevated"
            >
              <Phone size={15} aria-hidden />
              Ligação
            </button>
            <button
              type="button"
              onClick={() => logInteraction("email")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-elevated"
            >
              <Mail size={15} aria-hidden />
              E-mail
            </button>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium">Comentários</h3>
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Escreva um comentário…"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={sendingComment || !commentDraft.trim()}
                className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-3 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
                aria-label="Enviar comentário"
              >
                <Send size={16} aria-hidden />
              </button>
            </form>
            {comments.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nenhum comentário ainda.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...comments].reverse().map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-border-subtle bg-surface-elevated px-3 py-2.5"
                  >
                    <p className="text-sm text-ink text-pretty">{item.text}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted">
                      <span>{item.userName}</span>
                      <time dateTime={item.createdAt}>
                        {formatDateTimeBR(item.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <DatePickerPtBR
              id="lead-followup"
              label="Próximo follow-up"
              value={followUp}
              onChange={setFollowUp}
              onBlur={(iso) => saveFollowUp(iso)}
              hint="Formato brasileiro: dia/mês/ano"
            />
          </section>

          {lead.interactions.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium">Contatos registrados</h3>
              <ul className="space-y-2">
                {[...lead.interactions].reverse().map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-border-subtle bg-surface-elevated px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-muted">
                      <span>{CHANNEL_LABELS[item.channel]}</span>
                      <time dateTime={item.createdAt}>
                        {formatDateTimeBR(item.createdAt)}
                      </time>
                    </div>
                    {item.note && (
                      <p className="mt-1 text-sm text-ink">{item.note}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">{item.userName}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {saving && (
          <p className="border-t border-border-subtle px-5 py-2 text-xs text-muted">
            Salvando…
          </p>
        )}
      </aside>
    </>
  );
}
