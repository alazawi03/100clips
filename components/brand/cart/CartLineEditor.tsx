"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateCart } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { FormatLogo } from "@/components/ui/PlatformLogo";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
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

/** One creator in the cart. Every change is saved straight away; the totals refresh from the server. */
export function CartLineEditor({ creatorId, creatorName, location, offers, quantities }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(offers.map((o) => [o.format, quantities[o.format] ?? 0])));
  const [pending, startTransition] = useTransition();
  const subtotal = offers.reduce((sum, o) => sum + o.price * qty[o.format], 0);

  function save(next: Record<string, number>) {
    setQty(next);
    startTransition(() => updateCart(creatorId, offers.map((o) => ({ format: o.format, quantity: next[o.format] }))));
  }

  return (
    <li className={cn("flex flex-col gap-3 p-4 transition-opacity sm:p-5", pending && "opacity-70")}>
      <div className="flex items-center gap-3">
        <Link href={`/creators/${creatorId}`} className="rounded-full">
          <Avatar id={creatorId} name={creatorName} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/creators/${creatorId}`} className="block truncate font-medium hover:underline">
            {creatorName}
          </Link>
          <p className="truncate text-small text-text-muted">{location}</p>
        </div>
        <span className="font-medium tabular-nums">{f.money(subtotal)}</span>
        <button
          type="button"
          onClick={() => save(Object.fromEntries(offers.map((o) => [o.format, 0])))}
          aria-label={t("cart.removeName", { name: creatorName })}
          className="grid size-11 place-items-center rounded-full text-error hover:bg-error-soft"
        >
          <Trash2 aria-hidden className="size-5" />
        </button>
      </div>
      <ul className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-surface p-2">
        {offers.map((offer) => {
          const label = t(`formats.${offer.format}`);
          return (
            <li key={offer.format} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-card px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <FormatLogo format={offer.format} className="size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-small font-medium">{label}</span>
                  <span className="block text-caption text-text-muted">{f.money(offer.price)}</span>
                </span>
              </span>
              <QuantityStepper
                value={qty[offer.format]}
                onChange={(n) => save({ ...qty, [offer.format]: n })}
                label={label}
                decreaseLabel={t("cart.decrease", { format: label })}
                increaseLabel={t("cart.increase", { format: label })}
              />
            </li>
          );
        })}
      </ul>
    </li>
  );
}
