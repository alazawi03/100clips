import { Suspense } from "react";
import { CreatorCard } from "@/components/brand/creators/CreatorCard";
import { CreatorFiltersBar } from "@/components/brand/creators/CreatorFiltersBar";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { areasOf, filterCreators, parseFilters } from "@/lib/data/creatorFilters";
import { workspace } from "@/lib/data/live";
import { allLists } from "@/lib/data/lists";
import { getI18n } from "@/lib/i18n/server";

export default async function CreatorsPage({ searchParams }: PageProps<"/explore">) {
  const i18n = await getI18n();
  const { t, tp } = i18n;
  const query = await searchParams;
  const filters = parseFilters(query);
  // allLists: each creator card reads it; loading it now saves a wait.
  const [ws] = await Promise.all([workspace(), allLists()]);
  const results = filterCreators(ws.bookable, filters);
  const inCart = new Set(ws.cart.map((l) => l.creatorId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("explore.title")} />
      <Suspense>
        <CreatorFiltersBar resultsLabel={tp("explore.results", results.length)} areas={areasOf(ws.bookable.map((c) => c.city.ar))} />
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
