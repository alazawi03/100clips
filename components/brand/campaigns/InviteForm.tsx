"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import type { CheckoutState } from "@/app/actions/brand";
import { FeeTotal } from "@/components/brand/cart/FeeTotal";
import { PaymentTerms } from "@/components/brand/cart/PaymentTerms";
import { PaymentFields } from "@/components/brand/cart/PaymentFields";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { priceForBrand, withFee } from "@/lib/fees";
import { createFormatters } from "@/lib/i18n/format";
import { useCreatorPicker, type PickerOptions } from "./CreatorPicker";
import { CardRedirect } from "@/components/brand/payments/CardRedirect";
import { PaymentSuccess } from "./PaymentSuccess";

export type { InviteCreator } from "./CreatorPicker";

type Props = PickerOptions & {
  /** Pays and sends the offers: inviting to this campaign, or running it again as a new one. */
  action: (prev: CheckoutState, form: FormData) => Promise<CheckoutState>;
  /** Extra fields before payment, given the form's errors and submitted values. */
  details?: (form: { err: (name: string) => string | undefined; v: (name: string) => string | undefined }) => ReactNode;
  balance: number;
  /** Card parts are paid on Gate-E's page (true), or laqta sends a payment link. */
  cardOnline: boolean;
};

const REDIRECT_MS = 3000;

/**
 * Pick who to invite (the shared creator picker), choose each creator's platform (exactly one: one
 * video, one order), and pay up front. Then the success screen, then the campaign.
 */
export function InviteForm({ action: pay, details, balance, cardOnline, ...pickerOptions }: Props) {
  const { t, tp, locale } = useI18n();
  const f = createFormatters(locale);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(pay, null);
  const picker = useCreatorPicker(pickerOptions);
  const { chosen, invitees, missing, total } = picker;
  // Set when paying with a chosen creator who has no platform yet, so each of them says so.
  const [checked, setChecked] = useState(false);
  const [useBalance, setUseBalance] = useState(balance > 0);
  const ready = chosen.length > 0 && missing.length === 0;
  // Creators' prices plus the service fee.
  const toPay = withFee(total);
  const fromBalance = useBalance ? Math.min(balance, toPay) : 0;
  const byCard = toPay - fromBalance;
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  const paid = state?.paid;

  useEffect(() => {
    // With Gate-E, CardRedirect opens its page instead.
    if (!paid || paid.payUrl) return;
    window.scrollTo({ top: 0 });
    const timer = setTimeout(() => window.location.replace(paid.pending ? "/campaigns" : `/campaigns/${paid.campaignId}`), REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [paid]);

  if (paid?.payUrl) return <CardRedirect url={paid.payUrl} />;

  if (paid) {
    return (
      <PaymentSuccess t={t} tp={tp} pending={paid.pending} creators={paid.creators.map((c) => ({ id: c.id, name: f.pick(c.name) }))}>
        <p className="text-small text-text-muted">{t("checkout.redirecting")}</p>
        <span aria-hidden className="block h-1 w-40 overflow-hidden rounded-full bg-surface">
          <span className="block h-full origin-left bg-primary motion-safe:animate-[fill_3s_linear_both] rtl:origin-right" />
        </span>
        <Link href={paid.pending ? "/campaigns" : `/campaigns/${paid.campaignId}`} replace className={buttonClass("secondary")}>
          {paid.pending ? t("campaignsPage.title") : t("checkout.viewCampaign")}
        </Link>
      </PaymentSuccess>
    );
  }

  return (
    <form
      action={action}
      noValidate
      onSubmit={(e) => {
        if (missing.length === 0) return;
        e.preventDefault();
        setChecked(true);
        document.getElementById(`invitee-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
    >
      <div className="flex min-w-0 flex-col gap-6">
        {picker.render({ showMissing: checked, error: err("pick") })}

        {details?.({ err, v: (name) => state?.values[name] })}

        <Card inert={pending} className="flex flex-col gap-5 p-5 md:p-6">
          <h2 className="text-h2 font-medium">{t("checkout.payment")}</h2>
          <PaymentFields balance={balance} useBalance={useBalance} onUseBalance={setUseBalance} byCard={byCard} cardOnline={cardOnline} err={err} />
        </Card>
      </div>

      <Card className="flex flex-col gap-4 p-5 lg:sticky lg:top-24">
        <p className="font-medium">{tp("invite.selected", invitees)}</p>
        {chosen.length > 0 && (
          <ul className="flex flex-col gap-2 text-small">
            {chosen.map((p) => (
              <li key={`${p.creator.id}|${p.format}`} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  {p.creator.name} · {p.label}
                </span>
                <span className="shrink-0 tabular-nums">{f.money(priceForBrand(p.price))}</span>
              </li>
            ))}
          </ul>
        )}
        <dl className="flex flex-col gap-2 border-t border-border pt-3">
          <FeeTotal creatorsTotal={total} />
        </dl>
        {/* Looks inactive until every chosen creator has a platform; pressing it early points to who's missing one. */}
        <Button
          type="submit"
          variant="hero"
          aria-busy={pending}
          aria-disabled={!ready}
          disabled={pending || invitees === 0}
          className={cn("w-full disabled:opacity-40 disabled:shadow-none", !ready && !pending && "cursor-not-allowed opacity-40 shadow-none hover:brightness-100")}
        >
          {pending ? (
            t("checkout.paying")
          ) : byCard > 0 ? (
            t("checkout.pay", { amount: f.money(byCard) })
          ) : (
            t("checkout.payBalance")
          )}
        </Button>
        <PaymentTerms />
      </Card>
    </form>
  );
}
