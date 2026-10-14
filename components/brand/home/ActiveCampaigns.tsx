import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { CampaignStatus } from "@/components/brand/campaigns/CampaignStatus";
import { Card, SectionHeader } from "@/components/ui/Card";
import { workspace } from "@/lib/data/live";
import type { Campaign } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";
import { campaignProgress, isActiveOrder } from "@/lib/statuses";

export async function ActiveCampaigns({ campaigns, i18n }: { campaigns: Campaign[]; i18n: I18n }) {
  const { t, tp, f } = i18n;
  const { orders, creator } = await workspace();
  // Campaigns still running: waiting for creators to accept, or in progress.
  const active = campaigns
    .map((c) => ({ campaign: c, progress: campaignProgress(c, orders) }))
    .filter(({ progress }) => progress.status === "pending" || progress.status === "in_progress");
  if (active.length === 0) return null;

  return (
    <section aria-labelledby="campaigns-title" className="min-w-0">
      <SectionHeader id="campaigns-title" title={t("brandHome.campaignsTitle")} action={{ href: "/campaigns", label: t("common.seeAll") }} />
      <Card className="divide-y divide-border">
        {active.map(({ campaign, progress }) => {
          const hired = orders.filter((o) => o.campaignId === campaign.id && isActiveOrder(o));
          const delivered = hired.filter((o) => o.status === "delivered" || o.status === "approved").length;
          const faces = [...new Set(hired.map((o) => o.creatorId))].slice(0, 4).flatMap((id) => creator(id) ?? []);
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
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <CampaignStatus progress={progress} className="flex-1" />
                <div className="flex items-center gap-2 text-small text-text-muted">
                  <span className="flex items-center gap-2">
                    {faces.length > 0 && (
                      <span className="flex -space-x-2 rtl:space-x-reverse">
                        {faces.map((c) => (
                          <Avatar key={c.id} id={c.id} name={f.pick(c.name)} src={c.photo} size="sm" className="ring-2 ring-card" />
                        ))}
                      </span>
                    )}
                    {tp("campaignDetail.creators", hired.length)}
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
