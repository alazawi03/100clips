"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Localized } from "@/lib/data/types";
import { CAMPAIGN_STATUS, ORDER_STATUS, type CampaignBadgeStatus, type OrderBadgeStatus, type StatusTone } from "@/lib/statuses";

const tones: Record<StatusTone, string> = {
  gray: "bg-status-gray-bg text-status-gray-text",
  amber: "bg-status-amber-bg text-status-amber-text",
  blue: "bg-status-blue-bg text-status-blue-text",
  purple: "bg-status-purple-bg text-status-purple-text",
  green: "bg-status-green-bg text-status-green-text",
  red: "bg-status-red-bg text-status-red-text",
};

/** `label` replaces the brand's wording for another reader (e.g. READY_FOR_BRAND in the admin panel); the colour stays. */
type Props = ({ order: OrderBadgeStatus; campaign?: never } | { campaign: CampaignBadgeStatus; order?: never }) & { label?: Localized; className?: string };

/**
 * The one status pill: soft background, a dot, and always the text label (never colour alone).
 * Labels and colours come from lib/statuses.ts. Flows with the text direction, so it mirrors in Arabic.
 */
export function StatusBadge({ order, campaign, label, className }: Props) {
  const { locale } = useI18n();
  const def = order ? ORDER_STATUS[order] : CAMPAIGN_STATUS[campaign!];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium", tones[def.tone], className)}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {(label ?? def.label)[locale]}
    </span>
  );
}

/** A small amber tag for something the brand has to do, e.g. "1 to review". Not a status. */
export function ActionTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full bg-status-amber-bg px-2.5 text-xs font-medium text-status-amber-text", className)}>{children}</span>;
}
