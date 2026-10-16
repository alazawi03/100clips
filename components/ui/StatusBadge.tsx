"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { CAMPAIGN_STATUS, ORDER_STATUS, type CampaignBadgeStatus, type OrderBadgeStatus, type StatusTone } from "@/lib/statuses";

const tones: Record<StatusTone, string> = {
  gray: "bg-surface text-text-muted",
  amber: "bg-warning-soft text-warning-on-soft",
  green: "bg-success-soft text-success-on-soft",
  red: "bg-error-soft text-error",
  brand: "bg-brand-soft text-brand-on-soft",
};

type Props = ({ order: OrderBadgeStatus; campaign?: never } | { campaign: CampaignBadgeStatus; order?: never }) & { className?: string };

/**
 * The one status pill: soft background, a dot, and always the text label (never colour alone).
 * Labels and colours come from lib/statuses.ts. Flows with the text direction, so it mirrors in Arabic.
 */
export function StatusBadge({ order, campaign, className }: Props) {
  const { locale } = useI18n();
  const def = order ? ORDER_STATUS[order] : CAMPAIGN_STATUS[campaign!];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium", tones[def.tone], className)}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {def.label[locale]}
    </span>
  );
}

/** A small amber tag for something the brand has to do, e.g. "1 to review". Not a status. */
export function ActionTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full bg-warning-soft px-2.5 text-xs font-medium text-warning-on-soft", className)}>{children}</span>;
}
