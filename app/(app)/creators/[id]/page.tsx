import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { OfferPicker } from "@/components/brand/cart/OfferPicker";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlayableClip } from "@/components/ui/PlayableClip";
import { cn } from "@/lib/cn";
import { clipsByCreator } from "@/lib/data/clips";
import { getCurrentBrand } from "@/lib/currentBrand";
import { getCreator } from "@/lib/data/creators";
import { cartOf } from "@/lib/data/store";
import { reviewsOf } from "@/lib/data/reviews";
import { getI18n } from "@/lib/i18n/server";

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
  const line = cartOf((await getCurrentBrand()).id).find((l) => l.creatorId === creator.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={name} back={{ href: "/explore", label: t("nav.explore") }} />

      <Card className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:p-6">
        <Avatar id={creator.id} name={name} size="xl" ring={creator.hasNewClips ? "new" : undefined} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
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

      <section aria-labelledby="offers-title">
        <SectionHeader id="offers-title" title={t("profile.offers")} />
        <OfferPicker
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
  );
}
