export type WebPresence = "none" | "instagram" | "own_site" | "social" | "unknown";

export const WEB_PRESENCE_LABELS: Record<WebPresence, string> = {
  none: "Sem site",
  instagram: "Só Instagram",
  own_site: "Site próprio",
  social: "Rede social / link",
  unknown: "Não informado",
};

const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "linktr.ee",
  "bio.link",
  "wa.me",
  "api.whatsapp.com",
  "tiktok.com",
  "youtube.com",
  "twitter.com",
  "x.com",
];

function extractHostname(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Classifica a coluna website do crawler Google Places. */
export function classifyWebPresence(websiteRaw?: string | null): WebPresence {
  const raw = websiteRaw?.toString().trim() ?? "";
  if (!raw) return "none";

  const lower = raw.toLowerCase();
  if (
    lower === "n/a" ||
    lower === "na" ||
    lower === "-" ||
    lower === "null" ||
    lower === "none"
  ) {
    return "none";
  }

  const host = extractHostname(raw);
  if (!host) return "unknown";

  if (host.includes("instagram.com")) return "instagram";
  if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return "social";
  }

  return "own_site";
}

export function normalizeWebsiteUrl(raw?: string | null): string {
  const trimmed = raw?.toString().trim() ?? "";
  if (!trimmed || classifyWebPresence(trimmed) === "none") return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
