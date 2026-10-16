"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronDown, CircleCheck, ShoppingBag } from "lucide-react";
import { updateCart } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormatLogo } from "@/components/ui/PlatformLogo";
import { cn } from "@/lib/cn";
import type { ContentFormat, FormatOffer } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";
import { priceForBrand } from "@/lib/fees";

type Props = {
  creatorId: string;
  creatorName: string;
  offers: FormatOffer[];
  /** What's already in the cart for this creator (one format, one video). */
  inCart?: Partial<Record<ContentFormat, number>>;
  /** "card": full list (desktop side column). "compact": a box that opens to show the choices (phones). */
  variant?: "card" | "compact";
};

/** The creator's price list: choose one platform (one order = one video) and add it to the cart. */
export function OfferPicker({ creatorId, creatorName, offers, inCart, variant = "card" }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [chosen, setChosen] = useState<ContentFormat | undefined>(() => offers.find((o) => (inCart?.[o.format] ?? 0) > 0)?.format);
  const [justAdded, setJustAdded] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const total = offers.find((o) => o.format === chosen)?.price ?? 0;
  const count = chosen ? 1 : 0;

  function add() {
    startTransition(async () => {
      await updateCart(creatorId, chosen ? [{ format: chosen, quantity: 1 }] : []);
      setJustAdded(true);
    });
  }

  /** One choice: tap a platform to pick it, tap it again to clear. */
  const rows = (
    <ul role="radiogroup" aria-label={t("profile.choosePlatforms")} className="divide-y divide-border">
      {offers.map((offer) => {
        const label = t(`formats.${offer.format}`);
        const selected = chosen === offer.format;
        return (
          <li key={offer.format}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setChosen(selected ? undefined : offer.format);
                setJustAdded(false);
              }}
              className={cn("flex w-full items-center justify-between gap-3 px-4 py-3 text-start transition-colors duration-[120ms] hover:bg-surface/60 sm:px-5", selected && "bg-surface/50")}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface">
                  <FormatLogo format={offer.format} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-small text-text-muted">
                    {f.money(priceForBrand(offer.price))} {t("profile.perClip")}
                  </span>
                </span>
              </span>
              <span
                aria-hidden
                className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", selected ? "border-primary bg-primary text-on-primary" : "border-border")}
              >
                {selected && <span className="size-2.5 rounded-full bg-on-primary" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const status = justAdded ? (
    <p className="flex flex-wrap items-center gap-x-2 text-small font-medium" role="status">
      <CircleCheck aria-hidden className="size-5 text-success" />
      {t("cart.added", { name: creatorName })}
      <Link href="/cart" className="text-primary hover:underline">
        {t("cart.viewCart")}
      </Link>
    </p>
  ) : (
    <p className="text-small text-text-muted">
      {count > 0 ? (
        <>
          <span className="font-medium text-text tabular-nums">{f.money(priceForBrand(total))}</span>
          {t("common.separator")}
          {t("cart.pickHint")}
        </>
      ) : (
        t("cart.pickHint")
      )}
    </p>
  );

  const addButton = (className?: string) => (
    <Button variant="hero" onClick={add} aria-busy={pending} disabled={count === 0 && !inCart} className={cn("shrink-0 disabled:cursor-not-allowed disabled:opacity-50", className)}>
      <ShoppingBag aria-hidden />
      {inCart ? t("cart.updateCart") : t("cart.addToCart")}
    </Button>
  );

  if (variant === "card") {
    return (
      <Card>
        {rows}
        <div className="flex flex-col gap-3 border-t border-border p-4">
          {status}
          {addButton("w-full")}
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="rounded-[var(--radius-lg)] border border-border">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`offers-${creatorId}`}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-start"
        >
          <span className="min-w-0">
            <span className="block text-small text-text-muted">{t("profile.choosePlatforms")}</span>
            <span className="block truncate font-medium">{chosen ? t(`formats.${chosen}`) : t("profile.nothingChosen")}</span>
          </span>
          <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-text-muted transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div id={`offers-${creatorId}`} className="border-t border-border">
            {rows}
          </div>
        )}
      </div>
      {status}
      {addButton("w-full")}
    </Card>
  );
}
