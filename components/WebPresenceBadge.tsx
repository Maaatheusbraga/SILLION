import type { WebPresence } from "@/lib/types";
import { WEB_PRESENCE_LABELS } from "@/lib/web-presence";
import { Globe, Instagram, Link2, XCircle } from "lucide-react";

const ICONS: Record<WebPresence, typeof Globe> = {
  none: XCircle,
  instagram: Instagram,
  own_site: Globe,
  social: Link2,
  unknown: Link2,
};

const STYLES: Record<WebPresence, string> = {
  none: "text-emerald-400 border-emerald-500/25 bg-emerald-500/10",
  instagram: "text-pink-400 border-pink-500/25 bg-pink-500/10",
  own_site: "text-muted border-border-subtle bg-surface-elevated",
  social: "text-amber-400 border-amber-500/25 bg-amber-500/10",
  unknown: "text-muted border-border-subtle bg-surface-elevated",
};

interface WebPresenceBadgeProps {
  presence: WebPresence;
  website?: string;
}

export function WebPresenceBadge({ presence, website }: WebPresenceBadgeProps) {
  const Icon = ICONS[presence];
  const label = WEB_PRESENCE_LABELS[presence];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[presence]}`}
      title={website || label}
    >
      <Icon size={11} aria-hidden />
      {label}
    </span>
  );
}
