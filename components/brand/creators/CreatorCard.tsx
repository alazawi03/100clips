import Link from "next/link";
import { Star } from "lucide-react";
import { SaveToListButton } from "./SaveToListButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { clipsByCreator } from "@/lib/data/clips";
import { fromPrice } from "@/lib/data/creators";
import { allLists } from "@/lib/data/lists";
import { platformOf, type Creator } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

/**
 * Links to the creator profile, where brands pick platforms and add to cart.
 * The save button sits on top of the link (a button can't live inside one), beside the rating.
 */
export function CreatorCard({
  creator,
  inCart,
  i18n,
}: {
  creator: Creator;
  inCart: boolean;
  i18n: I18n;
}) {
  const { t, f } = i18n;
  const works = clipsByCreator(creator.id).slice(0, 3);
  const name = f.pick(creator.name);
  const platforms = [
    ...new Set(creator.formats.map((o) => platformOf[o.format])),
  ];

  return (
    // Lifted while its save menu is open, so the menu isn't covered by the next card's button.
    <div className="relative h-full has-[[aria-expanded=true]]:z-20">
      <Link
        href={`/creators/${creator.id}`}
        className="group block h-full rounded-[var(--radius-xl)]"
      >
        <Card className="flex h-full flex-col gap-4 p-4 transition-shadow duration-200 group-hover:shadow-lift">
          <div className="flex items-center gap-3">
            <Avatar
              id={creator.id}
              name={name}
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
            {/* Room for the save button, which is placed over this spot. */}
            <span aria-hidden className="size-9 shrink-0" />
          </div>

          {works.length > 0 && (
            <div className="grid grid-cols-3 gap-2" aria-hidden>
              {works.map((clip) => (
                <ClipPoster
                  key={clip.id}
                  clip={clip}
                  views={f.compact(clip.views)}
                  duration={f.duration(clip.durationSec)}
                  compact
                />
              ))}
            </div>
          )}

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
              <span className="ms-auto text-small font-medium">
                {t("common.fromPrice", { price: f.money(fromPrice(creator)) })}
              </span>
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
      </Link>
      <div className="absolute end-4 top-[26px] z-10">
        <SaveToListButton
          compact
          creatorId={creator.id}
          name={name}
          lists={allLists().map((l) => ({ id: l.id, name: l.name, favorites: l.favorites, count: l.creatorIds.length, has: l.creatorIds.includes(creator.id) }))}
        />
      </div>
    </div>
  );
}
