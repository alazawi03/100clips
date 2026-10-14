import { Heart } from "lucide-react";
import { CreatorCard } from "@/components/brand/creators/CreatorCard";
import { InviteToCampaignMenu } from "@/components/brand/campaigns/InviteMenus";
import { NewListButton } from "@/components/brand/creators/SaveToListButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { allLists, creatorsIn } from "@/lib/data/lists";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";

/** The account's creator lists, one section each: Favourites first, then the brand's lists, newest first. */
export default async function ListsPage() {
  const i18n = await getI18n();
  const { t, tp } = i18n;
  const [ws, all] = await Promise.all([workspace(), allLists()]);
  const lists = [
    ...all.filter((l) => l.favorites),
    ...all.filter((l) => !l.favorites).reverse(),
  ];
  const inCart = new Set(ws.cart.map((l) => l.creatorId));
  const active = ws.campaigns
    .filter((c) => c.status === "in_progress")
    .map((c) => ({ id: c.id, title: i18n.f.pick(c.title) }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("lists.title")} subtitle={t("lists.subtitle")}>
        <NewListButton />
      </PageHeader>
      {lists.map((list) => {
        const members = creatorsIn(list, ws);
        return (
          <section key={list.id} aria-labelledby={`${list.id}-title`}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id={`${list.id}-title`}
                  className="flex items-center gap-2 text-h2 font-medium text-balance"
                >
                  {list.favorites && (
                    <Heart
                      aria-hidden
                      className="size-5 fill-error text-error"
                    />
                  )}
                  {list.favorites ? t("lists.favorites") : list.name}
                </h2>
                <p className="mt-1 text-small text-text-muted">
                  {tp("lists.creators", members.length)}
                </p>
              </div>
              {/* Invite this list to a campaign: everyone arrives ticked on the invite page. */}
              {members.length > 0 && (
                <InviteToCampaignMenu
                  variant="button"
                  listId={list.id}
                  campaigns={active}
                />
              )}
            </div>
            {members.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((creator) => (
                  <li key={creator.id}>
                    <CreatorCard
                      creator={creator}
                      inCart={inCart.has(creator.id)}
                      i18n={i18n}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[var(--radius-lg)] border border-dashed border-border px-5 py-6 text-center text-text-muted">
                {list.favorites
                  ? t("lists.emptyFavorites")
                  : t("lists.emptyList")}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
