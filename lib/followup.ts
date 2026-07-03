import type { Lead } from "./types";
import { followUpRelativeLabel, isDateOnOrBeforeToday } from "./dates";

export function isFollowUpDue(lead: Lead): boolean {
  if (!lead.nextFollowUp) return false;
  return isDateOnOrBeforeToday(lead.nextFollowUp);
}

export function followUpLabel(dateStr: string): string {
  return followUpRelativeLabel(dateStr);
}

export function getDueFollowUps(leads: Lead[]): Lead[] {
  return leads
    .filter(
      (l) =>
        isFollowUpDue(l) &&
        l.status !== "convertido" &&
        l.status !== "descartado"
    )
    .sort((a, b) => (a.nextFollowUp ?? "").localeCompare(b.nextFollowUp ?? ""));
}
