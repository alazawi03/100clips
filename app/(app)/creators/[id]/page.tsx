import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ExternalLink, MessageCircle, Star } from "lucide-react";
import { messageCreator } from "@/app/actions/messages";
import { InviteToCampaignMenu } from "@/components/brand/campaigns/InviteMenus";
import { campaigns } from "@/lib/data/campaigns";
import { Avatar } from "@/components/ui/Avatar";
import { OfferPicker } from "@/components/brand/cart/OfferPicker";
import { SaveToListButton } from "@/components/brand/creators/SaveToListButton";
import { allLists } from "@/lib/data/lists";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { PlayableClip } from "@/components/ui/PlayableClip";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { clipsByCreator } from "@/lib/data/clips";
import { getCreator } from "@/lib/data/creators";
import { platformOf, type Platform } from "@/lib/data/types";
import { cartOf } from "@/lib/data/store";
import { reviewsOf } from "@/lib/data/reviews";
import { getI18n } from "@/lib/i18n/server";

/** Profile URL per platform. Dummy data has one handle per creator, used on every platform. */
const profileUrl: Record<Platform, (handle: string) => string> = {
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  instagram: (h) => `https://www.instagram.com/${h}`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
};

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cn("size-4", n <= Math.round(rating) ? "fill-warning text-warning" : "text-border")} />
      ))}
    </span>
  );
}

export default async function CreatorProfilePage({ params }: PageProps<"/creators/[id]">) {
  const { id } = await params;
  const creator = getCreator(id);
  if (!creator) notFound();
  const { t, f } = await getI18n();
  const name = f.pick(creator.name);
  const works = clipsByCreator(creator.id);
  const reviews = reviewsOf(creator.id);
  const line = cartOf().find((l) => l.creatorId === creator.id);
  const socials = [...new Set(creator.formats.map((o) => platformOf[o.format]))];

  return (
    <div className="flex flex-col gap-8">
      <Link href="/explore" className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] text-small text-text-muted hover:text-text">
        <ChevronRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" />
        {t("nav.explore")}
      </Link>

      {/* Prices and quantities stay in view: a sticky side column on desktop, a bar above the tab bar on phones. */}
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:items-start md:gap-8">
      <div className="flex min-w-0 flex-col gap-8 md:order-1">
      <Card className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-start">
        <Avatar id={creator.id} name={name} size="xl" ring={creator.hasNewClips ? "new" : undefined} className="self-start" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Name, with icon-only actions at the far end of the same line; each says what it does on hover. */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 flex-1 text-h1 font-medium text-balance">{name}</h1>
            <div className="flex shrink-0 items-center gap-2">
              {campaigns.some((c) => c.status === "in_progress") && (
                <Tooltip label={t("invite.toCampaign")}>
                  <InviteToCampaignMenu
                    variant="icon"
                    label={t("invite.toCampaign")}
                    creatorIds={[creator.id]}
                    campaigns={campaigns.filter((c) => c.status === "in_progress").map((c) => ({ id: c.id, title: f.pick(c.title) }))}
                  />
                </Tooltip>
              )}
              <Tooltip label={t("profile.message")}>
                <form action={messageCreator.bind(null, creator.id, undefined)}>
                  <button
                    type="submit"
                    aria-label={t("profile.messageName", { name })}
                    className="grid size-9 place-items-center rounded-full border border-border bg-card transition-colors duration-[120ms] hover:bg-surface"
                  >
                    <MessageCircle aria-hidden className="size-4" />
                  </button>
                </form>
              </Tooltip>
              <Tooltip label={t("lists.save")}>
                <SaveToListButton
                  compact
                  creatorId={creator.id}
                  name={name}
                  lists={allLists().map((l) => ({ id: l.id, name: l.name, favorites: l.favorites, count: l.creatorIds.length, has: l.creatorIds.includes(creator.id) }))}
                />
              </Tooltip>
            </div>
          </div>
          <ul aria-label={t("profile.socials")} className="flex flex-wrap gap-2">
            {socials.map((platform) => (
              <li key={platform}>
                <a
                  href={profileUrl[platform](creator.handle)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("profile.openSocial", { platform: t(`platforms.${platform}`), handle: creator.handle })}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-small font-medium hover:bg-surface"
                >
                  <PlatformLogo platform={platform} className="size-4" />
                  {t(`platforms.${platform}`)}
                  <ExternalLink aria-hidden className="size-3.5 text-text-muted" />
                </a>
              </li>
            ))}
          </ul>
          <p className="text-text-muted">
            <bdi dir="ltr">@{creator.handle}</bdi>
            {t("common.separator")}
            {f.pick(creator.city)}
          </p>
          <p className="max-w-prose">{f.pick(creator.bio)}</p>
          <dl className="mt-1 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4">
            <div className="flex flex-col gap-0.5">
              <dt className="text-small text-text-muted">{t("profile.rating")}</dt>
              <dd className="inline-flex items-center gap-1 text-h3 font-medium">
                {creator.rating ? (
                  <>
                    <Star aria-hidden className="size-4 fill-warning text-warning" />
                    {creator.rating.toFixed(1)}
                  </>
                ) : (
                  <span className="text-primary">{t("explore.newCreator")}</span>
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-small text-text-muted">{t("profile.completed")}</dt>
              <dd className="text-h3 font-medium tabular-nums">{f.number(creator.completedOrders)}</dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* Phones: the picker sits in the page right under the profile; desktop uses the sticky side column. */}
      <section aria-label={t("profile.offers")} className="md:hidden">
        <OfferPicker
          variant="compact"
          creatorId={creator.id}
          creatorName={name}
          offers={creator.formats}
          inCart={line ? Object.fromEntries(line.items.map((i) => [i.format, i.quantity])) : undefined}
        />
      </section>

      {works.length > 0 && (
        <section aria-labelledby="work-title">
          <SectionHeader id="work-title" title={t("profile.latestWork")} />
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {works.map((clip) => (
              <li key={clip.id} className="flex flex-col gap-2">
                <PlayableClip
                  clip={clip}
                  views={f.compact(clip.views)}
                  duration={f.duration(clip.durationSec)}
                  label={t("profile.play", { title: f.pick(clip.title) })}
                />
                <div>
                  <p className="line-clamp-2 font-medium">{f.pick(clip.title)}</p>
                  <p className="text-small text-text-muted">{t("profile.forBrand", { brand: f.pick(clip.brand) })}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="reviews-title">
        <SectionHeader id="reviews-title" title={t("profile.reviews")} />
        {reviews.length > 0 ? (
          <Card>
            <ul className="divide-y divide-border">
              {reviews.map((review) => (
                <li key={review.id} className="flex flex-col gap-2 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{f.pick(review.brand)}</span>
                    <span className="flex items-center gap-3">
                      <Stars rating={review.rating} label={t("common.rating", { rating: review.rating })} />
                      <span className="text-small text-text-muted">{f.date(review.date)}</span>
                    </span>
                  </div>
                  <p className="text-text-muted">{f.pick(review.comment)}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card className="p-5 text-text-muted">{t("profile.noReviews", { name })}</Card>
        )}
      </section>
      </div>
      {/* The aside itself is sticky: a sticky child of a content-height aside would have no room to move. */}
      <aside aria-labelledby="offers-title" className="hidden md:block md:sticky md:top-24 md:order-2 md:self-start">
        <h2 id="offers-title" className="mb-3 hidden text-h3 font-medium md:block">{t("profile.offers")}</h2>
        <OfferPicker
          creatorId={creator.id}
          creatorName={name}
          offers={creator.formats}
          inCart={line ? Object.fromEntries(line.items.map((i) => [i.format, i.quantity])) : undefined}
        />
      </aside>
      </div>
    </div>
  );
}
