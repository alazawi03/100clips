import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, campaignTone } from "@/components/ui/Badge";
import { Card, SectionHeader } from "@/components/ui/Card";
import { getCreator } from "@/lib/data/creators";
import { orders } from "@/lib/data/orders";
import type { Campaign } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

export function ActiveCampaigns({ campaigns, i18n }: { campaigns: Campaign[]; i18n: I18n }) {
  const { t, tp, f } = i18n;
  const active = campaigns.filter((c) => c.status === "open" || c.status === "in_progress");

  return (
    <section aria-labelledby="campaigns-title" className="min-w-0">
      <SectionHeader id="campaigns-title" title={t("brandHome.campaignsTitle")} action={{ href: "/campaigns", label: t("common.seeAll") }} />
      <Card className="divide-y divide-border">
        {active.map((campaign) => {
          const progress = Math.round((campaign.deliveredClips / campaign.clipsCount) * 100);
          const hired = orders.filter((o) => o.campaignId === campaign.id);
          const delivered = hired.filter((o) => o.status === "delivered" || o.status === "approved").length;
          const faces = campaign.applications.slice(0, 4).map((a) => getCreator(a.creatorId)!);
          return (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="flex flex-col gap-3 p-5 transition-colors duration-[120ms] first:rounded-t-[var(--radius-xl)] last:rounded-b-[var(--radius-xl)] hover:bg-surface/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-h3 font-medium">{f.pick(campaign.title)}</h3>
                  <p className="text-small text-text-muted">
                    {t("brandHome.creatorsDelivered", { done: f.number(delivered), total: f.number(hired.length) })}
                  </p>
                </div>
                <Badge tone={campaignTone[campaign.status]}>{t(`status.campaign.${campaign.status}`)}</Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface" role="presentation">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-small text-text-muted">
                  <span>{t("brandHome.clipsProgress", { done: f.number(campaign.deliveredClips), total: f.number(campaign.clipsCount) })}</span>
                  <span className="flex items-center gap-2">
                    {faces.length > 0 && (
                      <span className="flex -space-x-2 rtl:space-x-reverse">
                        {faces.map((c) => (
                          <Avatar key={c.id} id={c.id} name={f.pick(c.name)} size="sm" className="ring-2 ring-card" />
                        ))}
                      </span>
                    )}
                    {tp("brandHome.applicants", campaign.applications.length)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </Card>
    </section>
  );
}
