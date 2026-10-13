import { Suspense } from "react";
import { CreatorCard } from "@/components/brand/creators/CreatorCard";
import { CreatorFiltersBar } from "@/components/brand/creators/CreatorFiltersBar";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { filterCreators, parseFilters } from "@/lib/data/creatorFilters";
import { exploreCreators } from "@/lib/data/creatorsApi";
import { getI18n } from "@/lib/i18n/server";

export default async function CreatorsPage({ searchParams }: PageProps<"/explore">) {
  const i18n = await getI18n();
  const { t, tp } = i18n;
  const query = await searchParams;
  const filters = parseFilters(query);
  // Real creators from the API. Booking (cart, lists, invites) joins them with the checkout slice.
  const results = filterCreators(await exploreCreators(), filters);

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
              <CreatorCard creator={creator} inCart={false} i18n={i18n} browseOnly />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("explore.emptyTitle")} hint={t("explore.emptyHint")} />
      )}
    </div>
  );
}
