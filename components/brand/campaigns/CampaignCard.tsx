import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, campaignTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getCreator } from "@/lib/data/creators";
import type { Campaign } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

export function CampaignCard({ campaign, i18n }: { campaign: Campaign; i18n: I18n }) {
  const { t, tp, f } = i18n;
  const progress = Math.round((campaign.deliveredClips / campaign.clipsCount) * 100);
  const waiting = campaign.applications.filter((a) => a.status === "pending");
  const faces = campaign.applications.slice(0, 4).map((a) => getCreator(a.creatorId)!);

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group block h-full rounded-[var(--radius-xl)]">
      <Card className="flex h-full flex-col gap-4 p-5 transition-shadow duration-200 group-hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h3 font-medium">{f.pick(campaign.title)}</h3>
            <p className="text-small text-text-muted">{t(`niches.${campaign.niche}`)}</p>
          </div>
          <Badge tone={campaignTone[campaign.status]}>{t(`status.campaign.${campaign.status}`)}</Badge>
        </div>

        <p className="line-clamp-2 text-text-muted">{f.pick(campaign.brief)}</p>

        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface" role="presentation">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-small text-text-muted">
            {t("brandHome.clipsProgress", { done: f.number(campaign.deliveredClips), total: f.number(campaign.clipsCount) })}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-small">
          <span className="font-medium tabular-nums">{f.money(campaign.budget)}</span>
          {waiting.length > 0 ? (
            <Badge tone="brand">{tp("campaignsPage.newApplicants", waiting.length)}</Badge>
          ) : (
            faces.length > 0 && (
              <span className="flex -space-x-2 rtl:space-x-reverse">
                {faces.map((c) => (
                  <Avatar key={c.id} id={c.id} name={f.pick(c.name)} size="sm" className="ring-2 ring-card" />
                ))}
              </span>
            )
          )}
        </div>
      </Card>
    </Link>
  );
}
