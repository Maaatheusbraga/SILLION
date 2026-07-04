import type { Lead, WebPresence } from "./types";
import { classifyWebPresence } from "./web-presence";

export type ScoreTier = "alta" | "boa" | "media" | "baixa";

export const SCORE_TIER_LABELS: Record<ScoreTier, string> = {
  alta: "Alta oportunidade",
  boa: "Boa oportunidade",
  media: "Média",
  baixa: "Baixa",
};

export function getScoreTier(score: number): ScoreTier {
  if (score >= 75) return "alta";
  if (score >= 55) return "boa";
  if (score >= 35) return "media";
  return "baixa";
}

/** Score 0–100: prioriza negócios ativos sem presença digital forte (site/gestão). */
export function computeLeadScore(lead: {
  webPresence?: WebPresence;
  website?: string;
  phone?: string;
  totalScore?: number | null;
  reviewsCount?: number | null;
}): number {
  const presence =
    lead.webPresence ?? classifyWebPresence(lead.website ?? "");

  let score = 0;

  switch (presence) {
    case "none":
      score += 42;
      break;
    case "instagram":
      score += 38;
      break;
    case "social":
      score += 28;
      break;
    case "own_site":
      score += 6;
      break;
    case "unknown":
      score += 18;
      break;
  }

  const digits = lead.phone?.replace(/\D/g, "") ?? "";
  if (digits.length >= 10) score += 22;
  else if (digits.length >= 8) score += 10;

  const reviews = lead.reviewsCount ?? 0;
  if (reviews >= 100) score += 16;
  else if (reviews >= 50) score += 12;
  else if (reviews >= 20) score += 8;
  else if (reviews >= 5) score += 4;

  const rating = lead.totalScore ?? 0;
  if (rating >= 4.5) score += 12;
  else if (rating >= 4.0) score += 9;
  else if (rating >= 3.5) score += 5;

  return Math.min(100, Math.round(score));
}

/** Sugestão de abordagem comercial. */
export function getOpportunityHint(lead: {
  webPresence?: WebPresence;
  website?: string;
  totalScore?: number | null;
  reviewsCount?: number | null;
}): string {
  const presence =
    lead.webPresence ?? classifyWebPresence(lead.website ?? "");
  const reviews = lead.reviewsCount ?? 0;

  if (presence === "none" || presence === "instagram") {
    if (reviews >= 30) return "Site + presença digital";
    return "Site para captar clientes";
  }
  if (presence === "social") return "Site profissional + gestão";
  if (presence === "own_site") {
    if (reviews >= 20) return "Sistema de gestão / CRM";
    return "Modernizar site ou gestão";
  }
  return "Avaliar presença digital";
}

export function scoreLead(lead: Lead): number {
  return computeLeadScore(lead);
}

export function isHighOpportunityLead(lead: Lead): boolean {
  return computeLeadScore(lead) >= 60;
}
