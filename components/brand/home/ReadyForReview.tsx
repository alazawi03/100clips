import Link from "next/link";
import { SectionHeader } from "@/components/ui/Card";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { getClip } from "@/lib/data/clips";
import { getCreator } from "@/lib/data/creators";
import type { Order } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

/** Delivered clips waiting for the brand: the main job of the home screen. */
export function ReadyForReview({ orders, i18n }: { orders: Order[]; i18n: I18n }) {
  const { t, f } = i18n;
  const ready = orders.filter((o) => o.status === "delivered" && o.clipId);
  if (ready.length === 0) return null;

  return (
    <section aria-labelledby="ready-title">
      <SectionHeader
        id="ready-title"
        title={t("brandHome.readyTitle")}
        hint={t("brandHome.readyHint")}
        action={{ href: "/orders?status=delivered", label: t("common.seeAll") }}
      />
      <ul className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {ready.map((order) => {
          const clip = getClip(order.clipId!)!;
          const creator = getCreator(order.creatorId)!;
          return (
            <li key={order.id} className="w-40 shrink-0 snap-start sm:w-44">
              <Link href={`/orders/${order.id}`} className="group flex flex-col gap-2 rounded-[var(--radius-md)]">
                <ClipPoster
                  clip={clip}
                  views={f.compact(clip.views)}
                  duration={f.duration(clip.durationSec)}
                  className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
                />
                <div className="flex flex-col">
                  <span className="line-clamp-1 font-medium">{f.pick(clip.title)}</span>
                  <span className="line-clamp-1 text-small text-text-muted">{f.pick(creator.name)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
