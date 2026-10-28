"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { ActionTag, StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { createFormatters } from "@/lib/i18n/format";
import type { CampaignProgress } from "@/lib/statuses";

/**
 * A campaign's status badge, an amber "N to review" tag when clips wait for the brand,
 * and under them "1 of 2 clips approved" with a thin bar (approved / active orders).
 */
export function CampaignStatus({ progress, showReview = true, className }: { progress: CampaignProgress; showReview?: boolean; className?: string }) {
  const { t, tp, locale, currency } = useI18n();
  const f = createFormatters(locale, currency);
  const percent = progress.active > 0 ? Math.round((progress.approved / progress.active) * 100) : 0;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge campaign={progress.status} />
        {showReview && progress.toReview > 0 && <ActionTag>{tp("campaignStatus.toReview", progress.toReview)}</ActionTag>}
      </div>
      {progress.active > 0 && progress.status !== "cancelled" && (
        <>
          <div className="h-1 w-full max-w-60 overflow-hidden rounded-full bg-surface" role="presentation">
            <div className="h-full rounded-full bg-success" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-small text-text-muted">{t("campaignStatus.approvedOf", { done: f.number(progress.approved), total: f.number(progress.active) })}</p>
        </>
      )}
    </div>
  );
}
