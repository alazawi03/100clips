import { Compass } from "lucide-react";
import { CampaignCard } from "@/components/brand/campaigns/CampaignCard";
import { LinkButton } from "@/components/ui/Button";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { brandFilterOf, hasManyBrands, href } from "@/lib/brandFilter";
import { brands } from "@/lib/data/account";
import { campaigns as allCampaigns } from "@/lib/data/campaigns";
import type { CampaignStatus } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

/** Open and draft campaigns (creators apply) are post-MVP. */
const STATUSES: CampaignStatus[] = ["in_progress", "completed", "cancelled"];

export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const query = await searchParams;
  const brandId = brandFilterOf(query.brand);
  const campaigns = brandId ? allCampaigns.filter((c) => c.brandId === brandId) : allCampaigns;
  const raw = query.status;
  const status = STATUSES.find((s) => s === raw);
  const shown = status ? campaigns.filter((c) => c.status === status) : campaigns;

  const tabs = [
    { href: href("/campaigns", { brand: brandId }), label: t("common.all"), count: f.number(campaigns.length), active: !status },
    ...STATUSES.map((s) => ({
      href: href("/campaigns", { status: s, brand: brandId }),
      label: t(`status.campaign.${s}`),
      count: f.number(campaigns.filter((c) => c.status === s).length),
      active: status === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("campaignsPage.title")}>
        {hasManyBrands() && <BrandFilter brands={brands.map((b) => ({ id: b.id, name: f.pick(b.name) }))} value={brandId} />}
      </PageHeader>
      {campaigns.length === 0 ? (
        <EmptyState
          title={t("campaignsPage.emptyTitle")}
          hint={t("campaignsPage.emptyHint")}
          action={
            <LinkButton href="/explore">
              <Compass aria-hidden />
              {t("cart.explore")}
            </LinkButton>
          }
        />
      ) : (
        <>
          <FilterTabs tabs={tabs} label={t("campaignsPage.filterLabel")} />
          {shown.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((campaign) => (
                <li key={campaign.id}>
                  <CampaignCard campaign={campaign} i18n={i18n} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t("campaignsPage.emptyFiltered")} />
          )}
        </>
      )}
    </div>
  );
}
