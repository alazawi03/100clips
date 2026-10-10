import { NeedBrandButton } from "@/components/brand/campaigns/NeedBrandDialog";
import { Plus } from "lucide-react";
import { Notice } from "@/components/ui/Notice";
import { CampaignCard } from "@/components/brand/campaigns/CampaignCard";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { brandFilterOf, hasManyBrands, href } from "@/lib/brandFilter";
import { brands } from "@/lib/data/account";
import { campaigns as allCampaigns } from "@/lib/data/campaigns";
import { getI18n } from "@/lib/i18n/server";
import { orders } from "@/lib/data/orders";
import { CAMPAIGN_STATUS, CAMPAIGN_STATUSES, campaignProgress } from "@/lib/statuses";


export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const query = await searchParams;
  const brandId = brandFilterOf(query.brand);
  const campaigns = brandId ? allCampaigns.filter((c) => c.brandId === brandId) : allCampaigns;
  const raw = query.status;
  // Statuses come from each campaign's orders (lib/statuses.ts), so the tabs filter on those.
  const statusOf = new Map(campaigns.map((c) => [c.id, campaignProgress(c, orders).status]));
  const status = CAMPAIGN_STATUSES.find((s) => s === raw);
  const shown = status ? campaigns.filter((c) => statusOf.get(c.id) === status) : campaigns;

  const tabs = [
    { href: href("/campaigns", { brand: brandId }), label: t("common.all"), count: f.number(campaigns.length), active: !status },
    ...CAMPAIGN_STATUSES.map((s) => ({
      href: href("/campaigns", { status: s, brand: brandId }),
      label: f.pick(CAMPAIGN_STATUS[s].label),
      count: f.number(campaigns.filter((c) => statusOf.get(c.id) === s).length),
      active: status === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("campaignsPage.title")}>
        {hasManyBrands() && <BrandFilter brands={brands.map((b) => ({ id: b.id, name: f.pick(b.name), logo: b.logo }))} value={brandId} />}
        <NeedBrandButton hasBrand={brands.length > 0} href="/campaigns/new" then="campaign" variant="hero">
          <Plus aria-hidden />
          {t("newCampaign.button")}
        </NeedBrandButton>
      </PageHeader>
      {query.done === "draftDeleted" && <Notice>{t("newCampaign.draftDeleted")}</Notice>}
      {campaigns.length === 0 ? (
        <EmptyState
          title={t("campaignsPage.emptyTitle")}
          hint={t("campaignsPage.emptyHint")}
          action={
            <NeedBrandButton hasBrand={brands.length > 0} href="/campaigns/new" then="campaign">
              <Plus aria-hidden />
              {t("newCampaign.button")}
            </NeedBrandButton>
          }
        />
      ) : (
        <>
          <FilterTabs tabs={tabs} label={t("campaignsPage.filterLabel")} />
          {shown.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((campaign) => (
                <li key={campaign.id}>
                  <CampaignCard campaign={campaign} i18n={i18n} showBrand={!brandId} />
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
