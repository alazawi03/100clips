import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clapperboard, ExternalLink, MessageCircle, Star } from "lucide-react";
import { messageCreator } from "@/app/actions/messages";
import { InviteToCampaignMenu } from "@/components/brand/campaigns/InviteMenus";
import { OfferPicker } from "@/components/brand/cart/OfferPicker";
import { SaveToListButton } from "@/components/brand/creators/SaveToListButton";
import { Avatar } from "@/components/ui/Avatar";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { creatorProfile } from "@/lib/data/creatorsApi";
import { allLists } from "@/lib/data/lists";
import { workspace } from "@/lib/data/live";
import { isActiveMarket } from "@/lib/data/markets";
import { hasActiveBundle, platformOf, type Platform } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

/** Profile URL per platform, from the creator's own handle there. */
const profileUrl: Record<Platform, (handle: string) => string> = {
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  instagram: (h) => `https://www.instagram.com/${h}`,
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
  const [profile, ws, lists] = await Promise.all([creatorProfile(id), workspace(), allLists()]);
  // Brands only see creators where 100clips runs; the rest are on the waitlist.
  if (!profile || !isActiveMarket(profile.creator.country)) notFound();
  const { creator, reviews } = profile;
  const i18n = await getI18n();
  const { t, f } = i18n;
  // No active bundle: hidden from brands, unless this brand already worked with them (their orders link here).
  if (!hasActiveBundle(creator) && !ws.orders.some((o) => o.creatorId === creator.id)) notFound();
  const name = f.pick(creator.name);
  const line = ws.cart.find((l) => l.creatorId === creator.id);
  const inCart = line ? Object.fromEntries(line.items.map((i) => [i.format, i.quantity])) : undefined;
  const live = ws.campaigns.filter((c) => c.status === "in_progress").map((c) => ({ id: c.id, title: f.pick(c.title) }));
  const portfolio = creator.portfolio ?? [];
  // The accounts the creator added in the app; older profiles fall back to one handle on each platform they sell.
  const handles: Partial<Record<Platform, string>> =
    creator.instagram || creator.tiktok
      ? { ...(creator.instagram && { instagram: creator.instagram }), ...(creator.tiktok && { tiktok: creator.tiktok }) }
      : Object.fromEntries([...new Set(creator.formats.map((o) => platformOf[o.format]))].map((p) => [p, creator.handle]));
  const socials = (Object.entries(handles) as [Platform, string][]).map(([platform, handle]) => ({ platform, handle }));

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
        <Avatar id={creator.id} name={name} src={creator.photo} size="xl" ring={creator.hasNewClips ? "new" : undefined} className="self-start" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Name, with icon-only actions at the far end of the same line; each says what it does on hover. */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 flex-1 text-h1 font-medium text-balance">{name}</h1>
            <div className="flex shrink-0 items-center gap-2">
              {live.length > 0 && (
                <Tooltip label={t("invite.toCampaign")}>
                  <InviteToCampaignMenu variant="icon" label={t("invite.toCampaign")} creatorIds={[creator.id]} campaigns={live} />
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
                  lists={lists.map((l) => ({ id: l.id, name: l.name, favorites: l.favorites, count: l.creatorIds.length, has: l.creatorIds.includes(creator.id) }))}
                />
              </Tooltip>
            </div>
          </div>
          <ul aria-label={t("profile.socials")} className="flex flex-wrap gap-2">
            {socials.map(({ platform, handle }) => (
              <li key={platform}>
                <a
                  href={profileUrl[platform](handle)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("profile.openSocial", { platform: t(`platforms.${platform}`), handle })}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-small font-medium hover:bg-surface"
                >
                  <PlatformLogo platform={platform} className="size-4" />
                  <bdi dir="ltr">@{handle}</bdi>
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
        <OfferPicker variant="compact" creatorId={creator.id} creatorName={name} offers={creator.formats} inCart={inCart} />
      </section>

      {/* The samples the creator chose in the app (up to 3), or a note that there are none yet. */}
      <section aria-labelledby="work-title">
        <SectionHeader id="work-title" title={t("profile.portfolio")} />
        {portfolio.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {portfolio.map((clip, i) => (
              <li key={clip.id}>
                <video
                  dir="ltr"
                  src={clip.videoSrc}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={t("profile.play", { title: t("profile.sample", { n: i + 1 }) })}
                  className="aspect-[9/16] w-full rounded-[var(--radius-lg)] bg-black object-cover"
                />
              </li>
            ))}
          </ul>
        ) : (
          // Empty slots the size of the three samples, so the page keeps its shape until they upload.
          <div className="relative">
            <ul aria-hidden className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((n) => (
                <li key={n} className={cn("aspect-[9/16] rounded-[var(--radius-lg)] border border-dashed border-border bg-surface/60", n === 2 && "hidden sm:block")} />
              ))}
            </ul>
            <div className="absolute inset-0 grid place-items-center p-4">
              <div className="flex max-w-xs flex-col items-center gap-2 rounded-[var(--radius-lg)] bg-card px-5 py-4 text-center shadow-sm">
                <Clapperboard aria-hidden className="size-6 text-text-muted" strokeWidth={1.75} />
                <p className="font-medium">{t("profile.noVideos")}</p>
                <p className="text-small text-text-muted">{t("profile.noVideosHint")}</p>
              </div>
            </div>
          </div>
        )}
      </section>

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
          <Card className="flex items-center gap-3 p-5 text-text-muted">
            <Star aria-hidden className="size-5 shrink-0" />
            {t("profile.noReviews")}
          </Card>
        )}
      </section>
      </div>
      {/* The aside itself is sticky: a sticky child of a content-height aside would have no room to move. */}
      <aside aria-labelledby="offers-title" className="hidden md:block md:sticky md:top-24 md:order-2 md:self-start">
        <h2 id="offers-title" className="mb-3 hidden text-h3 font-medium md:block">{t("profile.offers")}</h2>
        <OfferPicker creatorId={creator.id} creatorName={name} offers={creator.formats} inCart={inCart} />
      </aside>
      </div>
    </div>
  );
}
