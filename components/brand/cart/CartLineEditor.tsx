"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { updateCart } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { FormatLogo } from "@/components/ui/PlatformLogo";
import { cn } from "@/lib/cn";
import type { ContentFormat, FormatOffer } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";

type Props = {
  creatorId: string;
  creatorName: string;
  location: string;
  offers: FormatOffer[];
  quantities: Partial<Record<ContentFormat, number>>;
};

/**
 * One creator in the cart, on its own card: one video in one format (one order = one video).
 * Switching format or removing is saved straight away; the totals refresh from the server.
 */
export function CartLineEditor({ creatorId, creatorName, location, offers, quantities }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [format, setFormat] = useState<ContentFormat | undefined>(() => offers.find((o) => (quantities[o.format] ?? 0) > 0)?.format);
  const [pending, startTransition] = useTransition();
  const chosen = offers.filter((o) => o.format === format);
  const others = offers.filter((o) => o.format !== format);
  const subtotal = chosen[0]?.price ?? 0;

  /** Undefined removes the creator from the cart. */
  function save(next: ContentFormat | undefined) {
    setFormat(next);
    startTransition(() => updateCart(creatorId, next ? [{ format: next, quantity: 1 }] : []));
  }

  return (
    <li>
      <Card className={cn("overflow-hidden transition-opacity", pending && "opacity-70")}>
        <div className="flex items-center gap-3 p-4">
          <Link href={`/creators/${creatorId}`} className="rounded-full">
            <Avatar id={creatorId} name={creatorName} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/creators/${creatorId}`} className="block truncate font-medium hover:underline">
              {creatorName}
            </Link>
            <p className="flex items-center gap-1 truncate text-small text-text-muted">
              <MapPin aria-hidden className="size-3.5 shrink-0" />
              {location}
            </p>
          </div>
          <button
            type="button"
            onClick={() => save(undefined)}
            aria-label={t("cart.removeName", { name: creatorName })}
            className="grid size-10 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-error-soft hover:text-error"
          >
            <Trash2 aria-hidden className="size-[18px]" />
          </button>
        </div>

        <ul className="divide-y divide-border border-t border-border">
          {chosen.map((offer) => {
            const label = t(`formats.${offer.format}`);
            return (
              <li key={offer.format} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface">
                  <FormatLogo format={offer.format} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{label}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{f.money(offer.price)}</span>
              </li>
            );
          })}
        </ul>

        {/* The creator's other formats: one tap switches the video to that format. */}
        {others.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            <span className="text-small text-text-muted">{t("cart.alsoOffers")}</span>
            {others.map((offer) => {
              const label = t(`formats.${offer.format}`);
              return (
                <button
                  key={offer.format}
                  type="button"
                  onClick={() => save(offer.format)}
                  aria-label={t("cart.switchTo", { format: label })}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-border ps-2 pe-3 text-small transition-colors hover:border-primary hover:bg-primary-soft/60 hover:text-primary-on-soft"
                >
                  <FormatLogo format={offer.format} className="size-3.5" />
                  {label}
                  <span className="text-text-muted tabular-nums">{f.money(offer.price)}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 bg-surface/60 px-4 py-3">
          <span className="text-small text-text-muted">{t("cart.subtotal")}</span>
          <span className="font-medium tabular-nums">{f.money(subtotal)}</span>
        </div>
      </Card>
    </li>
  );
}
