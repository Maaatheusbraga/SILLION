"use client";

import { Calendar } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  displayBRToISO,
  formatDateLongBR,
  isoToDisplayBR,
  maskDateInputBR,
} from "@/lib/dates";

interface DatePickerPtBRProps {
  id?: string;
  label: string;
  value: string;
  onChange: (isoValue: string) => void;
  onBlur?: (isoValue: string) => void;
  hint?: string;
}

export function DatePickerPtBR({
  id: idProp,
  label,
  value,
  onChange,
  onBlur,
  hint,
}: DatePickerPtBRProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const nativeRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplay(value ? isoToDisplayBR(value) : "");
    setError(null);
  }, [value]);

  function commitDisplay(raw: string): string | null {
    if (!raw.trim()) {
      setError(null);
      onChange("");
      return "";
    }
    const iso = displayBRToISO(raw);
    if (!iso) {
      setError("Use o formato dd/mm/aaaa.");
      return null;
    }
    setError(null);
    setDisplay(isoToDisplayBR(iso));
    onChange(iso);
    return iso;
  }

  function handleNativeChange(iso: string) {
    setError(null);
    if (!iso) {
      setDisplay("");
      onChange("");
      onBlur?.("");
      return;
    }
    setDisplay(isoToDisplayBR(iso));
    onChange(iso);
    onBlur?.(iso);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          value={display}
          onChange={(e) => setDisplay(maskDateInputBR(e.target.value))}
          onBlur={() => {
            const committed = commitDisplay(display);
            if (committed !== null) onBlur?.(committed);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDisplay(display);
            }
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="min-w-0 flex-1 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary"
        />
        <button
          type="button"
          onClick={() => nativeRef.current?.showPicker?.() ?? nativeRef.current?.click()}
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated px-3 py-2 text-muted transition-colors hover:bg-surface-hover hover:text-ink"
          aria-label="Abrir calendário"
        >
          <Calendar size={16} aria-hidden />
        </button>
        <input
          ref={nativeRef}
          type="date"
          lang="pt-BR"
          tabIndex={-1}
          aria-hidden
          value={value}
          onChange={(e) => handleNativeChange(e.target.value)}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : value ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {formatDateLongBR(value)}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
