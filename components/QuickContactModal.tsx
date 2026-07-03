"use client";

import { Copy, Check, MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildContactMessage } from "@/lib/messages";
import { whatsAppUrl } from "@/lib/utils";
import type { InteractionChannel, Lead, SessionUser } from "@/lib/types";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/types";

interface QuickContactModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (channel: InteractionChannel) => void;
  confirming?: boolean;
}

export function QuickContactModal({
  lead,
  open,
  onClose,
  onConfirm,
  confirming = false,
}: QuickContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data?.user && setUser(data.user))
        .catch(() => {});
      setCopied(false);
    }
  }, [open]);

  const message = useMemo(() => {
    if (!lead || !user) return "";
    return buildContactMessage(user.messageTemplate || DEFAULT_MESSAGE_TEMPLATE, {
      vendedor: user.displayName,
      empresa: lead.title,
      cidade: lead.city || "sua cidade",
    });
  }, [lead, user]);

  const wa = lead?.phone ? whatsAppUrl(lead.phone, message) : null;

  async function copyMessage() {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!lead) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="sillion-dialog fixed inset-0 z-50 rounded-lg border border-border bg-surface p-0 text-ink backdrop:bg-black/60 open:flex open:flex-col"
    >
      <div className="flex items-start justify-between border-b border-border-subtle px-5 py-4">
        <div className="min-w-0 pr-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Primeiro contato
          </p>
          <h2 className="mt-1 text-base font-semibold text-balance">{lead.title}</h2>
          <p className="mt-0.5 text-sm text-muted">{lead.phone || "Sem telefone"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted hover:bg-surface-elevated hover:text-ink"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="rounded-md border border-border-subtle bg-surface-elevated p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">Mensagem</span>
            <button
              type="button"
              onClick={copyMessage}
              disabled={!message}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check size={13} aria-hidden /> Copiado
                </>
              ) : (
                <>
                  <Copy size={13} aria-hidden /> Copiar
                </>
              )}
            </button>
          </div>
          <p className="text-sm leading-relaxed text-pretty whitespace-pre-wrap">
            {message || "Carregando mensagem…"}
          </p>
        </div>

        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <MessageCircle size={16} aria-hidden />
            Abrir WhatsApp
          </a>
        )}

        <p className="text-xs leading-relaxed text-muted">
          Envie a mensagem no WhatsApp e confirme abaixo. O lead vira card em{" "}
          <strong className="text-ink">Contatado</strong> no Kanban.
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={confirming}
          className="rounded-md px-4 py-2 text-sm text-muted hover:text-ink disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={confirming || !message}
          onClick={() => onConfirm("whatsapp")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {confirming ? "Registrando…" : "Mensagem enviada"}
        </button>
      </div>
    </dialog>
  );
}
