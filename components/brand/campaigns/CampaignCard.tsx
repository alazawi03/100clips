import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { CampaignStatus } from "./CampaignStatus";
import { DeleteDraftButton } from "./DeleteDraftButton";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { hasManyBrands } from "@/lib/brandFilter";
import { pendingPayments, workspace } from "@/lib/data/live";
import type { Campaign } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";
import { campaignProgress, isActiveOrder } from "@/lib/statuses";
import { withFee } from "@/lib/fees";

/**
 * One campaign in the list. The brand's name only when the list shows every brand of an account that has
 * several; the product's only when its brand has more than one. A draft opens where it was left.
 */
export async function CampaignCard({ campaign, i18n, showBrand }: { campaign: Campaign; i18n: I18n; showBrand: boolean }) {
  const { t, f } = i18n;
  const [ws, pending] = await Promise.all([workspace(), pendingPayments()]);
  const progress = campaignProgress(campaign, ws.orders);
  const draft = campaign.status === "draft";
  // Paid partly by card, and the card payment isn't confirmed yet: the offers go out once it is.
  const cardPending = draft && pending.has(campaign.id);
  const brand = showBrand && hasManyBrands(ws.brands) ? ws.brand(campaign.brandId) : undefined;
  const productId = campaign.productIds?.[0] ?? (draft ? campaign.draft?.values.productId : undefined);
  const product = productId && ws.productsOf(campaign.brandId).length > 1 ? ws.product(productId) : undefined;
  const hired = ws.orders.filter((o) => o.campaignId === campaign.id && isActiveOrder(o));
  const creatorIds = draft ? (campaign.draft?.picks ?? []).map((p) => p.creatorId) : hired.map((o) => o.creatorId);
  const faces = [...new Set(creatorIds)].slice(0, 4).flatMap((id) => ws.creator(id) ?? []);
  const meta = [brand && f.pick(brand.name), product && f.pick(product.name), t(`niches.${campaign.niche}`)].filter(Boolean).join(t("common.separator"));

  return (
    <div className="relative h-full">
      <Link href={draft ? `/campaigns/new?draft=${campaign.id}` : `/campaigns/${campaign.id}`} className="group block h-full rounded-[var(--radius-xl)]">
        <Card className="flex h-full flex-col gap-4 p-5 transition-shadow duration-200 group-hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={cn("text-h3 font-medium", draft && "pe-10")}>{f.pick(campaign.title) || t("newCampaign.untitled")}</h3>
              <p className="text-small text-text-muted">{meta}</p>
            </div>
          </div>

          {f.pick(campaign.brief) && <p className="line-clamp-2 text-text-muted">{f.pick(campaign.brief)}</p>}

          {/* Status (with "1 to review" when clips wait for you) and approved clips out of active orders. */}
          <CampaignStatus progress={progress} />
          {cardPending ? (
            <p className="text-small font-medium text-warning">{t("newCampaign.cardPending")}</p>
          ) : (
            draft && campaign.draft && <p className="text-small text-text-muted">{t("newCampaign.savedOn", { date: f.date(campaign.draft.savedAt.slice(0, 10)) })}</p>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-small">
            {/* What the brand pays: the creators' prices plus the service fee. */}
            <span className="font-medium tabular-nums">{f.money(withFee(campaign.budget))}</span>
            {faces.length > 0 && (
              <span className="flex -space-x-2 rtl:space-x-reverse">
                {faces.map((c) => (
                  <Avatar key={c.id} id={c.id} name={f.pick(c.name)} src={c.photo} size="sm" className="ring-2 ring-card" />
                ))}
              </span>
            )}
          </div>
        </Card>
      </Link>
      {/* A draft can be thrown away right here; it sits beside the link, not inside it. */}
      {draft && <DeleteDraftButton id={campaign.id} className="absolute end-3 top-3" />}
    </div>
  );
}
