import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clapperboard, ExternalLink, Star } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { cn } from "@/lib/cn";
import { creatorProfile } from "@/lib/data/creatorsApi";
import { isActiveMarket } from "@/lib/data/markets";
import { platformOf, type FormatOffer, type Platform } from "@/lib/data/types";
import { priceForBrand } from "@/lib/fees";
import { getI18n, type I18n } from "@/lib/i18n/server";

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

/**
 * The creator's prices as brands pay them. Read-only for now: adding to the cart, messaging, lists
 * and invites join real creators with the checkout slice.
 */
function Prices({ offers, i18n }: { offers: FormatOffer[]; i18n: I18n }) {
  const { t, f } = i18n;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <ul className="flex flex-col divide-y divide-border">
        {offers.map((o) => (
          <li key={o.format} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <PlatformLogo platform={platformOf[o.format]} className="size-5" />
            <span className="flex-1">{t(`formats.${o.format}`)}</span>
            <span className="font-medium tabular-nums">{f.money(priceForBrand(o.price))}</span>
          </li>
        ))}
      </ul>
      <Notice tone="info">{t("profile.bookingSoon")}</Notice>
    </Card>
  );
}

export default async function CreatorProfilePage({ params }: PageProps<"/creators/[id]">) {
  const { id } = await params;
  const profile = await creatorProfile(id);
  // Brands only see creators where 100clips runs; the rest are on the waitlist.
  if (!profile || !isActiveMarket(profile.creator.country)) notFound();
  const { creator, reviews } = profile;
  const i18n = await getI18n();
  const { t, f } = i18n;
  const name = f.pick(creator.name);
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
        <Prices offers={creator.formats} i18n={i18n} />
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
          <Card className="flex items-center gap-3 p-5 text-text-muted">
            <Clapperboard aria-hidden className="size-5 shrink-0" />
            {t("profile.noVideos")}
          </Card>
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
        <Prices offers={creator.formats} i18n={i18n} />
      </aside>
      </div>
    </div>
  );
}
