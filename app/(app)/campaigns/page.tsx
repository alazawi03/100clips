import { Plus } from "lucide-react";
import { CampaignCard } from "@/components/brand/campaigns/CampaignCard";
import { LinkButton } from "@/components/ui/Button";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { brandCampaigns } from "@/lib/data/store";
import type { CampaignStatus } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

const STATUSES: CampaignStatus[] = ["open", "in_progress", "completed", "draft"];

export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const campaigns = brandCampaigns((await getCurrentBrand()).id);
  const raw = (await searchParams).status;
  const status = STATUSES.find((s) => s === raw);
  const shown = status ? campaigns.filter((c) => c.status === status) : campaigns;

  const tabs = [
    { href: "/campaigns", label: t("common.all"), count: f.number(campaigns.length), active: !status },
    ...STATUSES.map((s) => ({
      href: `/campaigns?status=${s}`,
      label: t(`status.campaign.${s}`),
      count: f.number(campaigns.filter((c) => c.status === s).length),
      active: status === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("campaignsPage.title")} />
      {campaigns.length === 0 ? (
        <EmptyState
          title={t("campaignsPage.emptyTitle")}
          hint={t("campaignsPage.emptyHint")}
          action={
            <LinkButton href="/campaigns/new">
              <Plus aria-hidden />
              {t("nav.createCampaign")}
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
