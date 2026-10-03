import { ActiveCampaigns } from "@/components/brand/home/ActiveCampaigns";
import { OrderPipeline } from "@/components/brand/home/OrderPipeline";
import { ReadyForReview } from "@/components/brand/home/ReadyForReview";
import { RecentOrders } from "@/components/brand/home/RecentOrders";
import { Search } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { brandCampaigns, brandOrders } from "@/lib/data/store";
import { getI18n } from "@/lib/i18n/server";

export default async function BrandHome() {
  const i18n = await getI18n();
  const brand = await getCurrentBrand();
  const orders = brandOrders(brand.id);
  const campaigns = brandCampaigns(brand.id);

  return (
    <div className="flex flex-col gap-10">
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
