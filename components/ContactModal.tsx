"use client";

import { X } from "lucide-react";
import { FormEvent, useEffect, useRef } from "react";
import type { InteractionChannel } from "@/lib/types";
import { CHANNEL_LABELS } from "@/lib/types";

const CHANNELS: InteractionChannel[] = ["whatsapp", "ligacao", "email"];

interface ContactModalProps {
  leadTitle: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (channel: InteractionChannel, note: string) => void;
}

export function ContactModal({
  leadTitle,
  open,
  onClose,
  onConfirm,
}: ContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const channel = form.get("channel") as InteractionChannel;
    const note = form.get("note")?.toString() ?? "";
    onConfirm(channel, note);
    formRef.current?.reset();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="sillion-dialog fixed inset-0 z-50 rounded-lg border border-border bg-surface p-0 text-ink shadow-[var(--shadow-card)] backdrop:bg-black/60 open:flex open:flex-col"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-start justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Registrar contato
            </p>
            <h2 className="mt-1 text-base font-semibold text-balance">{leadTitle}</h2>
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
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Canal</legend>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <label
                  key={ch}
                  className="has-[:checked]:border-primary has-[:checked]:bg-primary/10 flex cursor-pointer items-center rounded-md border border-border px-3 py-2 text-sm transition-colors"
                >
                  <input
                    type="radio"
                    name="channel"
                    value={ch}
                    defaultChecked={ch === "whatsapp"}
                    className="sr-only"
                  />
                  {CHANNEL_LABELS[ch]}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="contact-note" className="mb-1.5 block text-sm font-medium">
              Nota (opcional)
            </label>
            <textarea
              id="contact-note"
              name="note"
              rows={3}
              placeholder="Ex.: Liguei, pediu retorno na sexta…"
              className="w-full resize-none rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm placeholder:text-muted"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted hover:text-ink"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Confirmar contato
          </button>
        </div>
      </form>
    </dialog>
  );
}
