"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Lightbulb,
  Phone,
  PhoneOff,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLeads } from "@/lib/hooks/useLeads";
import {
  buildDashboardInsights,
  buildDashboardStats,
  PIPELINE_STATUSES,
  type InsightTone,
} from "@/lib/dashboard-stats";
import { computeLeadScore, getScoreTier } from "@/lib/lead-score";
import type { Lead } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { LeadPanel } from "./LeadPanel";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { WebPresenceBadge } from "./WebPresenceBadge";

const INSIGHT_STYLES: Record<
  InsightTone,
  { border: string; bg: string; icon: string }
> = {
  action: {
    border: "border-primary/40",
    bg: "bg-primary/5",
    icon: "text-primary",
  },
  info: {
    border: "border-border-subtle",
    bg: "bg-surface-elevated",
    icon: "text-muted",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
  },
  success: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
  },
};

const STATUS_BAR_COLORS: Record<string, string> = {
  importado: "bg-muted",
  nao_contatado: "bg-slate-400",
  contatado: "bg-primary",
  negociacao: "bg-amber-400",
  convertido: "bg-emerald-500",
  descartado: "bg-danger/70",
};

export function DashboardView() {
  const { leads, allLeads, datasets, activeDataset, loading, error, updateLeadLocal } =
    useLeads();
  const [scope, setScope] = useState<"active" | "all">("active");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const scopedLeads = scope === "all" ? allLeads : leads;

  const stats = useMemo(
    () => buildDashboardStats(scopedLeads, datasets),
    [scopedLeads, datasets]
  );

  const insights = useMemo(
    () =>
      buildDashboardInsights(stats, {
        scope,
        datasetName: activeDataset?.name,
      }),
    [stats, scope, activeDataset?.name]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-muted">
        Carregando dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error}
      </div>
    );
  }

  const maxStatus = Math.max(...PIPELINE_STATUSES.map((s) => stats.byStatus[s]), 1);

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BarChart3 size={20} aria-hidden />
          </div>
          <div>
            <h1 className="sillion-display text-xl font-bold sm:text-2xl">
              Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {scope === "all"
                ? "Todas as bases"
                : activeDataset?.name ?? "Base ativa"}
              {" · "}
              {stats.total} leads
            </p>
          </div>
        </div>

        <div className="flex rounded-lg border border-border-subtle bg-surface p-1">
          <button
            type="button"
            onClick={() => setScope("active")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === "active"
                ? "bg-primary text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            Base ativa
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === "all"
                ? "bg-primary text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            Todas as bases
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Contatados"
          value={stats.contacted}
          sub={`${stats.contactRate}% com telefone`}
          icon={Phone}
          highlight={stats.contacted > 0}
        />
        <KpiCard
          label="Sem contato"
          value={stats.notContacted}
          sub="importados + não contatados"
          icon={PhoneOff}
          highlight={stats.notContacted > 0}
        />
        <KpiCard
          label="Alta oportunidade"
          value={stats.highOpportunity}
          sub={`score médio ${stats.avgScore}`}
          icon={Target}
          highlight={stats.highOpportunity > 0}
        />
        <KpiCard
          label="Convertidos"
          value={stats.byStatus.convertido}
          sub={
            stats.contacted > 0
              ? `${stats.conversionRate}% dos contatados`
              : "—"
          }
          icon={TrendingUp}
          highlight={stats.byStatus.convertido > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="sillion-card rounded-xl border border-border-subtle bg-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Pipeline por status</h2>
          <p className="mt-1 text-xs text-muted">
            Distribuição dos leads no funil de prospecção
          </p>

          <ul className="mt-5 space-y-3">
            {PIPELINE_STATUSES.map((status) => {
              const count = stats.byStatus[status];
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const barPct = (count / maxStatus) * 100;

              return (
                <li key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink">{STATUS_LABELS[status]}</span>
                    <span className="tabular-nums text-muted">
                      {count}{" "}
                      <span className="text-xs">({Math.round(pct)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[status]}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="sillion-card rounded-xl border border-border-subtle bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Insights</h2>
          <p className="mt-1 text-xs text-muted">Ações sugeridas para hoje</p>

          <ul className="mt-4 space-y-3">
            {insights.map((insight, i) => {
              const style = INSIGHT_STYLES[insight.tone];
              return (
                <li
                  key={`${insight.title}-${i}`}
                  className={`rounded-lg border p-3 ${style.border} ${style.bg}`}
                >
                  <div className="flex gap-2">
                    <Lightbulb
                      size={16}
                      className={`mt-0.5 shrink-0 ${style.icon}`}
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {insight.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {insight.body}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="sillion-card rounded-xl border border-border-subtle bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Presença digital</h2>
          <p className="mt-1 text-xs text-muted">
            Onde focar oferta de site vs gestão
          </p>

          <ul className="mt-4 space-y-2">
            {(
              Object.entries(stats.webPresence) as [
                keyof typeof stats.webPresence,
                number,
              ][]
            )
              .filter(([, n]) => n > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2"
                >
                  <WebPresenceBadge presence={key} />
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        </section>

        <section className="sillion-card rounded-xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Top oportunidades
              </h2>
              <p className="mt-1 text-xs text-muted">
                Ainda sem contato · com telefone
              </p>
            </div>
            <Link
              href="/lista"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver lista
              <ArrowRight size={14} />
            </Link>
          </div>

          {stats.topOpportunities.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              Nenhum lead pendente com telefone neste recorte.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border-subtle">
              {stats.topOpportunities.map((lead) => {
                const score = computeLeadScore(lead);
                return (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="flex w-full items-start gap-3 py-3 text-left transition-colors first:pt-0 hover:bg-surface-elevated/60"
                    >
                      <LeadScoreBadge
                        score={score}
                        tier={getScoreTier(score)}
                        compact
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {lead.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <WebPresenceBadge presence={lead.webPresence} />
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {stats.datasetSummaries.length > 1 && (
        <section className="sillion-card mt-6 rounded-xl border border-border-subtle bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Comparativo de bases</h2>
          <p className="mt-1 text-xs text-muted">
            Visão geral de cada campanha importada
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-muted">
                  <th className="pb-2 pr-4 font-medium">Base</th>
                  <th className="pb-2 pr-4 font-medium text-right">Total</th>
                  <th className="pb-2 pr-4 font-medium text-right">Contatados</th>
                  <th className="pb-2 pr-4 font-medium text-right">Pendentes</th>
                  <th className="pb-2 pr-4 font-medium text-right">Convertidos</th>
                  <th className="pb-2 pr-4 font-medium text-right">Alta opp.</th>
                  <th className="pb-2 font-medium text-right">% contato</th>
                </tr>
              </thead>
              <tbody>
                {stats.datasetSummaries.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border-subtle/60 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-ink">
                      {row.name}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {row.total}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {row.contacted}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted">
                      {row.notContacted}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-emerald-400">
                      {row.converted}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-primary">
                      {row.highOpportunity}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {row.contactRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stats.owners.length > 0 && (
        <section className="sillion-card mt-6 rounded-xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" aria-hidden />
            <h2 className="text-sm font-semibold text-ink">Equipe</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Responsáveis e atividade nos últimos 7 dias
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.owners.map((owner) => (
              <li
                key={owner.name}
                className="rounded-lg border border-border-subtle bg-surface-elevated px-4 py-3"
              >
                <p className="font-medium text-ink">{owner.name}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted">
                  <dt>Leads</dt>
                  <dd className="text-right tabular-nums text-ink">
                    {owner.leadsOwned}
                  </dd>
                  <dt>Contatados</dt>
                  <dd className="text-right tabular-nums text-ink">
                    {owner.contacted}
                  </dd>
                  <dt>Convertidos</dt>
                  <dd className="text-right tabular-nums text-emerald-400">
                    {owner.converted}
                  </dd>
                  <dt>7 dias</dt>
                  <dd className="text-right tabular-nums text-primary">
                    {owner.interactionsLast7Days} ações
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}

      <LeadPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={(lead) => {
          updateLeadLocal(lead);
          setSelectedLead(lead);
        }}
      />
    </>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  sub: string;
  icon: typeof Phone;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border-subtle bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        <Icon size={16} className="text-primary opacity-80" aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}
