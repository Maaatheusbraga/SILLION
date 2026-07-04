import { isFollowUpDue } from "./followup";
import {
  computeLeadScore,
  isHighOpportunityLead,
} from "./lead-score";
import type { Dataset, Lead, LeadStatus, WebPresence } from "./types";
import { STATUS_LABELS } from "./types";

export interface DatasetSummary {
  id: string;
  name: string;
  total: number;
  contacted: number;
  notContacted: number;
  converted: number;
  highOpportunity: number;
  contactRate: number;
}

export interface OwnerActivity {
  name: string;
  leadsOwned: number;
  contacted: number;
  converted: number;
  interactionsLast7Days: number;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  contacted: number;
  notContacted: number;
  withPhone: number;
  withoutPhone: number;
  highOpportunity: number;
  followUpDue: number;
  avgScore: number;
  conversionRate: number;
  contactRate: number;
  webPresence: Record<WebPresence, number>;
  owners: OwnerActivity[];
  datasetSummaries: DatasetSummary[];
  topOpportunities: Lead[];
}

export type InsightTone = "action" | "info" | "warning" | "success";

export interface DashboardInsight {
  tone: InsightTone;
  title: string;
  body: string;
}

const CONTACTED_STATUSES: LeadStatus[] = [
  "contatado",
  "negociacao",
  "convertido",
  "descartado",
];

export const PIPELINE_STATUSES: LeadStatus[] = [
  "importado",
  "nao_contatado",
  "contatado",
  "negociacao",
  "convertido",
  "descartado",
];

function isContacted(lead: Lead) {
  return CONTACTED_STATUSES.includes(lead.status);
}

function isNotContacted(lead: Lead) {
  return lead.status === "importado" || lead.status === "nao_contatado";
}

function hasValidPhone(lead: Lead) {
  return (lead.phone?.replace(/\D/g, "") ?? "").length >= 8;
}

function summarizeDataset(dataset: Dataset, leads: Lead[]): DatasetSummary {
  const total = leads.length;
  const contacted = leads.filter(isContacted).length;
  const notContacted = leads.filter(isNotContacted).length;
  const converted = leads.filter((l) => l.status === "convertido").length;
  const highOpportunity = leads.filter(isHighOpportunityLead).length;
  const withPhone = leads.filter(hasValidPhone).length;

  return {
    id: dataset.id,
    name: dataset.name,
    total,
    contacted,
    notContacted,
    converted,
    highOpportunity,
    contactRate: withPhone > 0 ? Math.round((contacted / withPhone) * 100) : 0,
  };
}

function buildOwnerActivity(leads: Lead[]): OwnerActivity[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const map = new Map<string, OwnerActivity>();

  for (const lead of leads) {
    if (lead.ownerName) {
      const key = lead.ownerName;
      const row = map.get(key) ?? {
        name: key,
        leadsOwned: 0,
        contacted: 0,
        converted: 0,
        interactionsLast7Days: 0,
      };
      row.leadsOwned++;
      if (isContacted(lead)) row.contacted++;
      if (lead.status === "convertido") row.converted++;
      map.set(key, row);
    }

    for (const interaction of lead.interactions ?? []) {
      if (new Date(interaction.createdAt).getTime() < cutoff) continue;
      const key = interaction.userName;
      const row = map.get(key) ?? {
        name: key,
        leadsOwned: 0,
        contacted: 0,
        converted: 0,
        interactionsLast7Days: 0,
      };
      row.interactionsLast7Days++;
      map.set(key, row);
    }
  }

  return [...map.values()].sort(
    (a, b) => b.interactionsLast7Days - a.interactionsLast7Days
  );
}

export function buildDashboardStats(
  leads: Lead[],
  datasets: Dataset[]
): DashboardStats {
  const byStatus = {} as Record<LeadStatus, number>;
  for (const key of Object.keys(STATUS_LABELS) as LeadStatus[]) {
    byStatus[key] = 0;
  }

  const webPresence = {
    none: 0,
    instagram: 0,
    own_site: 0,
    social: 0,
    unknown: 0,
  } satisfies Record<WebPresence, number>;

  let contacted = 0;
  let notContacted = 0;
  let withPhone = 0;
  let highOpportunity = 0;
  let followUpDue = 0;
  let scoreSum = 0;

  for (const lead of leads) {
    byStatus[lead.status]++;
    if (isContacted(lead)) contacted++;
    if (isNotContacted(lead)) notContacted++;
    if (hasValidPhone(lead)) withPhone++;
    if (isHighOpportunityLead(lead)) highOpportunity++;
    if (
      isFollowUpDue(lead) &&
      lead.status !== "convertido" &&
      lead.status !== "descartado"
    ) {
      followUpDue++;
    }
    webPresence[lead.webPresence]++;
    scoreSum += computeLeadScore(lead);
  }

  const converted = byStatus.convertido;
  const contactRate =
    withPhone > 0 ? Math.round((contacted / withPhone) * 100) : 0;
  const conversionRate =
    contacted > 0 ? Math.round((converted / contacted) * 100) : 0;

  const topOpportunities = [...leads]
    .filter((l) => isNotContacted(l) && hasValidPhone(l))
    .sort((a, b) => computeLeadScore(b) - computeLeadScore(a))
    .slice(0, 5);

  const datasetSummaries = datasets
    .map((d) =>
      summarizeDataset(
        d,
        leads.filter((l) => l.datasetId === d.id)
      )
    )
    .sort((a, b) => b.total - a.total);

  return {
    total: leads.length,
    byStatus,
    contacted,
    notContacted,
    withPhone,
    withoutPhone: leads.length - withPhone,
    highOpportunity,
    followUpDue,
    avgScore: leads.length > 0 ? Math.round(scoreSum / leads.length) : 0,
    conversionRate,
    contactRate,
    webPresence,
    owners: buildOwnerActivity(leads),
    datasetSummaries,
    topOpportunities,
  };
}

export function buildDashboardInsights(
  stats: DashboardStats,
  context: { datasetName?: string; scope: "active" | "all" }
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const scopeLabel =
    context.scope === "all"
      ? "em todas as bases"
      : context.datasetName
        ? `na base "${context.datasetName}"`
        : "na base ativa";

  if (stats.total === 0) {
    insights.push({
      tone: "info",
      title: "Base vazia",
      body: "Importe um Excel para começar a gerar insights de prospecção.",
    });
    return insights;
  }

  const notContactedPct = Math.round(
    (stats.notContacted / stats.total) * 100
  );

  if (stats.highOpportunity > 0 && stats.notContacted > 0) {
    insights.push({
      tone: "action",
      title: "Priorize alta oportunidade",
      body: `${stats.highOpportunity} leads com score alto ${scopeLabel} — ${stats.notContacted} ainda sem contato. Foque em quem não tem site ou só usa Instagram.`,
    });
  }

  if (notContactedPct >= 50) {
    insights.push({
      tone: "warning",
      title: "Muito estoque parado",
      body: `${notContactedPct}% dos leads (${stats.notContacted}) ainda não foram contatados ${scopeLabel}.`,
    });
  } else if (stats.notContacted > 0) {
    insights.push({
      tone: "info",
      title: "Estoque para trabalhar",
      body: `${stats.notContacted} leads aguardam primeiro contato ${scopeLabel}.`,
    });
  }

  const noSite = stats.webPresence.none + stats.webPresence.instagram;
  if (noSite > 0) {
    const pct = Math.round((noSite / stats.total) * 100);
    insights.push({
      tone: "success",
      title: "Oportunidade digital",
      body: `${noSite} leads (${pct}%) sem site próprio ou só no Instagram — perfil ideal para oferta de site e captura de clientes.`,
    });
  }

  if (stats.webPresence.own_site > 0) {
    insights.push({
      tone: "info",
      title: "Já têm site",
      body: `${stats.webPresence.own_site} leads com site próprio — abordagem de sistema de gestão ou modernização pode funcionar melhor.`,
    });
  }

  if (stats.followUpDue > 0) {
    insights.push({
      tone: "action",
      title: "Follow-ups pendentes",
      body: `${stats.followUpDue} lead(s) com retorno agendado para hoje ou atrasado ${scopeLabel}.`,
    });
  }

  if (stats.contacted > 0 && stats.conversionRate > 0) {
    insights.push({
      tone: "success",
      title: "Taxa de conversão",
      body: `${stats.conversionRate}% dos leads contatados viraram clientes (${stats.byStatus.convertido} de ${stats.contacted}).`,
    });
  }

  if (stats.withoutPhone > 0) {
    insights.push({
      tone: "warning",
      title: "Sem telefone",
      body: `${stats.withoutPhone} leads sem telefone válido — difícil contatar; considere descartar ou enriquecer a base.`,
    });
  }

  const topOwner = stats.owners.find((o) => o.interactionsLast7Days > 0);
  if (topOwner) {
    insights.push({
      tone: "info",
      title: "Atividade da equipe",
      body: `${topOwner.name} registrou ${topOwner.interactionsLast7Days} interação(ões) nos últimos 7 dias.`,
    });
  }

  if (stats.byStatus.negociacao > 0) {
    insights.push({
      tone: "action",
      title: "Em negociação",
      body: `${stats.byStatus.negociacao} lead(s) em negociação ativa ${scopeLabel} — acompanhe follow-ups de perto.`,
    });
  }

  return insights.slice(0, 6);
}
