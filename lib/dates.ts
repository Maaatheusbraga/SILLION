/** Padrão de datas da plataforma SILLION — pt-BR / America/Sao_Paulo */

export const DATE_LOCALE = "pt-BR";
export const DATE_TIMEZONE = "America/Sao_Paulo";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  timeZone: DATE_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

const DATETIME_FMT: Intl.DateTimeFormatOptions = {
  timeZone: DATE_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const DATE_LONG_FMT: Intl.DateTimeFormatOptions = {
  timeZone: DATE_TIMEZONE,
  weekday: "short",
  day: "2-digit",
  month: "long",
  year: "numeric",
};

/** Data de hoje no fuso local (YYYY-MM-DD) */
export function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Interpreta YYYY-MM-DD como data local (evita shift de fuso UTC) */
export function parseISODateLocal(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Exibe data: 03/07/2026 */
export function formatDateBR(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return parseISODateLocal(isoDate).toLocaleDateString(DATE_LOCALE, DATE_FMT);
}

/** Exibe data e hora: 03/07/2026, 14:30 */
export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(DATE_LOCALE, DATETIME_FMT);
}

/** Exibe data por extenso: sex., 03 de julho de 2026 */
export function formatDateLongBR(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return parseISODateLocal(isoDate).toLocaleDateString(DATE_LOCALE, DATE_LONG_FMT);
}

/** Converte ISO (YYYY-MM-DD) → texto dd/mm/aaaa para o campo */
export function isoToDisplayBR(isoDate: string): string {
  return formatDateBR(isoDate);
}

/** Converte dd/mm/aaaa ou dd-mm-aaaa → ISO (YYYY-MM-DD) */
export function displayBRToISO(display: string): string | null {
  const cleaned = display.trim().replace(/-/g, "/");
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Máscara enquanto digita: dd/mm/aaaa */
export function maskDateInputBR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Compara se data ISO <= hoje (local) */
export function isDateOnOrBeforeToday(isoDate: string, today = todayLocalISO()): boolean {
  return isoDate.slice(0, 10) <= today;
}

/** Label relativa para follow-up */
export function followUpRelativeLabel(isoDate: string): string {
  const due = isoDate.slice(0, 10);
  const today = todayLocalISO();
  if (due < today) return "Vencido";
  if (due === today) return "Hoje";
  return formatDateBR(due);
}
