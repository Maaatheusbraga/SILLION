import type { ScoreTier } from "@/lib/lead-score";
import { SCORE_TIER_LABELS } from "@/lib/lead-score";

const TIER_STYLES: Record<
  ScoreTier,
  { badge: string; ring: string }
> = {
  alta: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ring: "ring-emerald-500/40",
  },
  boa: {
    badge: "bg-primary/15 text-primary border-primary/30",
    ring: "ring-primary/40",
  },
  media: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    ring: "ring-amber-500/40",
  },
  baixa: {
    badge: "bg-surface-elevated text-muted border-border-subtle",
    ring: "ring-border",
  },
};

interface LeadScoreBadgeProps {
  score: number;
  tier: ScoreTier;
  compact?: boolean;
}

export function LeadScoreBadge({ score, tier, compact }: LeadScoreBadgeProps) {
  const styles = TIER_STYLES[tier];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${styles.badge}`}
        title={SCORE_TIER_LABELS[tier]}
      >
        {score}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-col items-center rounded-lg border px-2.5 py-1.5 text-center ${styles.badge}`}
      title={SCORE_TIER_LABELS[tier]}
    >
      <span className="text-lg font-bold leading-none tabular-nums">{score}</span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
        score
      </span>
    </span>
  );
}
