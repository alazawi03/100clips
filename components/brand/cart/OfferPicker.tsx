"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CircleCheck, ShoppingBag } from "lucide-react";
import { updateCart } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormatLogo } from "@/components/ui/PlatformLogo";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { ContentFormat, FormatOffer } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";

type Props = {
  creatorId: string;
  creatorName: string;
  offers: FormatOffer[];
  /** Quantities already in the cart, if this creator is in it. */
  inCart?: Partial<Record<ContentFormat, number>>;
};

/** The creator's price list, shop style: pick quantities per platform and add them to the cart. */
export function OfferPicker({ creatorId, creatorName, offers, inCart }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(offers.map((o, i) => [o.format, inCart ? (inCart[o.format] ?? 0) : i === 0 ? 1 : 0])),
  );
  const [justAdded, setJustAdded] = useState(false);
  const [pending, startTransition] = useTransition();
  const total = offers.reduce((sum, o) => sum + o.price * qty[o.format], 0);
  const count = offers.reduce((n, o) => n + qty[o.format], 0);

  function add() {
    startTransition(async () => {
      await updateCart(creatorId, offers.map((o) => ({ format: o.format, quantity: qty[o.format] })));
      setJustAdded(true);
    });
  }

  return (
    <Card>
      <ul className="divide-y divide-border">
        {offers.map((offer) => {
          const label = t(`formats.${offer.format}`);
          return (
            <li key={offer.format} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface">
                  <FormatLogo format={offer.format} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-small text-text-muted">
                    {f.money(offer.price)} {t("profile.perClip")}
                  </span>
                </span>
              </span>
              <QuantityStepper
                value={qty[offer.format]}
                onChange={(n) => {
                  setQty((q) => ({ ...q, [offer.format]: n }));
                  setJustAdded(false);
                }}
                label={label}
                decreaseLabel={t("cart.decrease", { format: label })}
                increaseLabel={t("cart.increase", { format: label })}
              />
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        {justAdded ? (
          <p className="flex items-center gap-2 text-small font-medium" role="status">
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
                <span className="font-medium text-text tabular-nums">{f.money(total)}</span>
                {t("common.separator")}
                {t("cart.pickHint")}
              </>
            ) : (
              t("cart.pickHint")
            )}
          </p>
        )}
        <Button variant="hero" onClick={add} aria-busy={pending} className="shrink-0">
          <ShoppingBag aria-hidden />
          {inCart ? t("cart.updateCart") : t("cart.addToCart")}
        </Button>
      </div>
    </Card>
  );
}
