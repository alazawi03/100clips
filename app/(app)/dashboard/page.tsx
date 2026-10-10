import { ActiveCampaigns } from "@/components/brand/home/ActiveCampaigns";
import { NeedsYou } from "@/components/brand/home/NeedsYou";
import { ReadyForReview } from "@/components/brand/home/ReadyForReview";
import { ResultsRow } from "@/components/brand/home/ResultsRow";
import { Welcome } from "@/components/brand/home/Welcome";
import { DebugAccountSwitch } from "@/components/brand/home/DebugAccountSwitch";
import { isNewAccount } from "@/lib/data/accountSwitch";
import { Search } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { brandFilterOf, hasManyBrands } from "@/lib/brandFilter";
import { DEMO_TODAY, brands, getBrand } from "@/lib/data/account";
import { brandCampaigns, brandOrders } from "@/lib/data/store";
import { campaigns as allCampaigns } from "@/lib/data/campaigns";
import { orders as allOrders } from "@/lib/data/orders";
import { needsYou, results } from "@/lib/dashboard";
import { getI18n } from "@/lib/i18n/server";

/**
 * The brand's home: results at a glance, what needs them now, clips to review, and running campaigns.
 * Before the first campaign it's a welcome instead: how it works and one way in.
 */
export default async function BrandHome({ searchParams }: PageProps<"/dashboard">) {
  const i18n = await getI18n();
  const brandId = brandFilterOf((await searchParams).brand);
  const orders = brandId ? brandOrders(brandId) : allOrders;
  const campaigns = brandId ? brandCampaigns(brandId) : allCampaigns;
  const fresh = campaigns.length === 0 && orders.length === 0;

  return (
    <div className="flex flex-col gap-10">
      {process.env.NODE_ENV !== "production" && <DebugAccountSwitch isNew={isNewAccount()} />}
      {hasManyBrands() && <BrandFilter brands={brands.map((b) => ({ id: b.id, name: i18n.f.pick(b.name), logo: b.logo }))} value={brandId} />}

      <PageHeader title={i18n.t("nav.dashboard")}>
        {/* The welcome has its own way in; one gradient button per screen. */}
        {!fresh && (
          <LinkButton href="/explore" variant="hero">
            <Search aria-hidden />
            {i18n.t("nav.hireCreator")}
          </LinkButton>
        )}
      </PageHeader>

      {fresh ? (
        <Welcome brands={brandId ? [getBrand(brandId)!] : brands} i18n={i18n} />
      ) : (
        <>
          <ResultsRow results={results(orders, DEMO_TODAY)} i18n={i18n} />
          <NeedsYou items={needsYou(orders, DEMO_TODAY)} i18n={i18n} />
          <ReadyForReview orders={orders} i18n={i18n} />
          <ActiveCampaigns campaigns={campaigns} i18n={i18n} />
        </>
      )}
    </div>
  );
}
