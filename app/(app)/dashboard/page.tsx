import { Search } from "lucide-react";
import { ActiveCampaigns } from "@/components/brand/home/ActiveCampaigns";
import { NeedsYou } from "@/components/brand/home/NeedsYou";
import { ReadyForReview } from "@/components/brand/home/ReadyForReview";
import { ResultsRow } from "@/components/brand/home/ResultsRow";
import { Welcome } from "@/components/brand/home/Welcome";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { LinkButton } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { MonthlyChart } from "@/components/ui/MonthlyChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { brandFilterOf, hasManyBrands } from "@/lib/brandFilter";
import { workspace } from "@/lib/data/live";
import { needsYou, results, spentByMonth } from "@/lib/dashboard";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/today";

/**
 * The brand's home: results at a glance, what needs them now, clips to review, and running campaigns.
 * Before the first campaign it's a welcome instead: how it works, one way in, and what's left to set up.
 */
export default async function BrandHome({ searchParams }: PageProps<"/dashboard">) {
  const i18n = await getI18n();
  const ws = await workspace();
  const brandId = brandFilterOf((await searchParams).brand, ws.brands);
  const orders = brandId ? ws.orders.filter((o) => o.brandId === brandId) : ws.orders;
  // Drafts don't count: the welcome stays until something was paid for.
  const campaigns = (brandId ? ws.campaigns.filter((c) => c.brandId === brandId) : ws.campaigns).filter((c) => c.status !== "draft");
  const fresh = campaigns.length === 0 && orders.length === 0;
  const shownBrands = brandId ? ws.brands.filter((b) => b.id === brandId) : ws.brands;
  const day = today();

  return (
    <div className="flex flex-col gap-10">
      {hasManyBrands(ws.brands) && <BrandFilter brands={ws.brands.map((b) => ({ id: b.id, name: i18n.f.pick(b.name), logo: b.logo }))} value={brandId} />}

      <PageHeader title={i18n.t("nav.dashboard")}>
        {/* The welcome has its own way in; one primary button per screen. */}
        {!fresh && (
          <LinkButton href="/explore" variant="hero">
            <Search aria-hidden />
            {i18n.t("nav.hireCreator")}
          </LinkButton>
        )}
      </PageHeader>

      {fresh ? (
        <Welcome brands={shownBrands} productCounts={Object.fromEntries(shownBrands.map((b) => [b.id, ws.productsOf(b.id).length]))} i18n={i18n} />
      ) : (
        <>
          <ResultsRow results={results(orders, day)} i18n={i18n} />
          <section aria-labelledby="spend-title">
            <SectionHeader id="spend-title" title={i18n.t("brandHome.spendTitle")} hint={i18n.t("brandHome.spendHint")} />
            <Card className="p-5">
              <MonthlyChart
                data={spentByMonth(orders, day)}
                caption={i18n.t("brandHome.spendTitle")}
                locale={i18n.locale}
                format={(n) => i18n.f.money(n)}
                tick={(n) => i18n.f.compact(n)}
                emptyText={i18n.t("brandHome.spendEmpty")}
              />
            </Card>
          </section>
          <NeedsYou items={needsYou(orders, day, ws)} i18n={i18n} />
          <ReadyForReview orders={orders} i18n={i18n} />
          <ActiveCampaigns campaigns={campaigns} i18n={i18n} />
        </>
      )}
    </div>
  );
}
