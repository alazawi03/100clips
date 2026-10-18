import Link from "next/link";
import { Star } from "lucide-react";
import { PortfolioStrip } from "./PortfolioStrip";
import { SaveToListButton } from "./SaveToListButton";
import { InviteToCampaignMenu } from "@/components/brand/campaigns/InviteMenus";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { allLists } from "@/lib/data/lists";
import { workspace } from "@/lib/data/live";
import { fromPrice, platformOf, type Creator } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";
import { priceForBrand } from "@/lib/fees";

/**
 * Links to the creator profile, where brands pick platforms and add to cart.
 * The save button sits on top of the link (a button can't live inside one), beside the rating.
 * browseOnly: just the card, without save and invite.
 */
export async function CreatorCard({
  creator,
  inCart,
  i18n,
  browseOnly = false,
}: {
  creator: Creator;
  inCart: boolean;
  i18n: I18n;
  browseOnly?: boolean;
}) {
  const { t, f } = i18n;
  const samples = (creator.portfolio ?? []).slice(0, 3);
  const [ws, lists] = browseOnly ? [undefined, []] : await Promise.all([workspace(), allLists()]);
  const active = (ws?.campaigns ?? []).filter((c) => c.status === "in_progress").map((c) => ({ id: c.id, title: i18n.f.pick(c.title) }));
  const name = f.pick(creator.name);
  const platforms = [
    ...new Set(creator.formats.map((o) => platformOf[o.format])),
  ];

  return (
    // Lifted while its save menu is open, so the menu isn't covered by the next card's button.
    <div className="group relative h-full has-[[aria-expanded=true]]:z-20">
      {/* The whole card opens the profile; the samples and the save/invite buttons sit above this link. */}
      <Link
        href={`/creators/${creator.id}`}
        aria-label={`${t("explore.viewProfile")} · ${name}`}
        className="absolute inset-0 rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
      <Card className="pointer-events-none flex h-full flex-col gap-4 p-4 transition-colors duration-200 group-hover:border-icon-inactive">
        <div className="flex items-center gap-3">
          <Avatar
            id={creator.id}
            name={name}
            src={creator.photo}
            size="lg"
            ring={creator.hasNewClips ? "new" : undefined}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-h3 font-medium">{name}</p>
            <p className="truncate text-small text-text-muted">
              {f.pick(creator.city)}
            </p>
          </div>
          {creator.rating ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 text-small font-medium"
              aria-label={t("common.rating", { rating: creator.rating })}
            >
              <Star aria-hidden className="size-4 fill-warning text-warning" />
              {creator.rating.toFixed(1)}
            </span>
          ) : (
            <span className="shrink-0 text-small font-medium text-primary">
              {t("explore.newCreator")}
            </span>
          )}
          {/* Room for the save and invite buttons, which are placed over this spot. */}
          {!browseOnly && <span aria-hidden className={cn("h-9 shrink-0", active.length > 0 ? "w-[76px]" : "w-9")} />}
        </div>

        <PortfolioStrip samples={samples} name={name} />

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-2"
              aria-label={platforms
                .map((p) => t(`platforms.${p}`))
                .join(t("common.separator"))}
              role="img"
            >
              {platforms.map((p) => (
                <PlatformLogo key={p} platform={p} className="size-5" />
              ))}
            </span>
            {inCart && <Badge tone="brand">{t("cart.inCart")}</Badge>}
            {fromPrice(creator) !== undefined && (
              <span className="ms-auto text-small font-medium">
                {t("common.fromPrice", { price: f.money(priceForBrand(fromPrice(creator)!)) })}
              </span>
            )}
          </div>
          {/* The whole card is the link; this only shows where it goes. */}
          <span
            aria-hidden
            className={buttonClass("secondary", "w-full group-hover:bg-border")}
          >
            {t("explore.viewProfile")}
          </span>
        </div>
      </Card>
      {!browseOnly && <div className="absolute end-4 top-[26px] z-10 flex gap-1">
        <InviteToCampaignMenu variant="icon" creatorIds={[creator.id]} campaigns={active} label={t("invite.creatorToCampaign", { name })} />
        <SaveToListButton
          compact
          creatorId={creator.id}
          name={name}
          lists={lists.map((l) => ({ id: l.id, name: l.name, favorites: l.favorites, count: l.creatorIds.length, has: l.creatorIds.includes(creator.id) }))}
        />
      </div>}
    </div>
  );
}
