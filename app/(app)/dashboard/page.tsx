import { ActiveCampaigns } from "@/components/brand/home/ActiveCampaigns";
import { OrderPipeline } from "@/components/brand/home/OrderPipeline";
import { ReadyForReview } from "@/components/brand/home/ReadyForReview";
import { RecentOrders } from "@/components/brand/home/RecentOrders";
import { Search } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { brandFilterOf, hasManyBrands } from "@/lib/brandFilter";
import { brands } from "@/lib/data/account";
import { brandCampaigns, brandOrders } from "@/lib/data/store";
import { campaigns as allCampaigns } from "@/lib/data/campaigns";
import { orders as allOrders } from "@/lib/data/orders";
import { getI18n } from "@/lib/i18n/server";

export default async function BrandHome({ searchParams }: PageProps<"/dashboard">) {
  const i18n = await getI18n();
  const brandId = brandFilterOf((await searchParams).brand);
  const orders = brandId ? brandOrders(brandId) : allOrders;
  const campaigns = brandId ? brandCampaigns(brandId) : allCampaigns;

  return (
    <div className="flex flex-col gap-10">
      {hasManyBrands() && <BrandFilter brands={brands.map((b) => ({ id: b.id, name: i18n.f.pick(b.name) }))} value={brandId} />}

      <PageHeader title={i18n.t("nav.dashboard")}>
        <LinkButton href="/explore" variant="hero">
          <Search aria-hidden />
          {i18n.t("nav.hireCreator")}
        </LinkButton>
      </PageHeader>

      <OrderPipeline orders={orders} i18n={i18n} />

      <ReadyForReview orders={orders} i18n={i18n} />

      <ActiveCampaigns campaigns={campaigns} i18n={i18n} />

      <RecentOrders orders={orders} i18n={i18n} />
    </div>
  );
}
