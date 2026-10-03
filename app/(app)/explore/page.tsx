import { Suspense } from "react";
import { CreatorCard } from "@/components/brand/creators/CreatorCard";
import { CreatorFiltersBar } from "@/components/brand/creators/CreatorFiltersBar";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { filterCreators, parseFilters } from "@/lib/data/creatorFilters";
import { getCurrentBrand } from "@/lib/currentBrand";
import { creators } from "@/lib/data/creators";
import { cartOf } from "@/lib/data/store";
import { getI18n } from "@/lib/i18n/server";

export default async function CreatorsPage({ searchParams }: PageProps<"/explore">) {
  const i18n = await getI18n();
  const { t, tp } = i18n;
  const filters = parseFilters(await searchParams);
  const results = filterCreators(creators, filters);
  const inCart = new Set(cartOf((await getCurrentBrand()).id).map((l) => l.creatorId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("explore.title")} />
      <Suspense>
        <CreatorFiltersBar resultsLabel={tp("explore.results", results.length)} />
      </Suspense>
      {results.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((creator) => (
            <li key={creator.id}>
              <CreatorCard creator={creator} inCart={inCart.has(creator.id)} i18n={i18n} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("explore.emptyTitle")} hint={t("explore.emptyHint")} />
      )}
    </div>
  );
}
