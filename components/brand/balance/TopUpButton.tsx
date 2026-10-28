"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Plus } from "lucide-react";
import { topUpBalance, type TopUpState } from "@/app/actions/brand";
import { PaymentFields } from "@/components/brand/cart/PaymentFields";
import { CardPanel } from "@/components/brand/payments/CardPanel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input } from "@/components/ui/Form";
import { currencySign } from "@/lib/data/markets";
import { createFormatters } from "@/lib/i18n/format";

/**
 * "Top up wallet": an amount, then the card on Gate-E's page (`cardOnline`), or a payment link from
 * laqta. The balance grows once the card payment is paid.
 */
export function TopUpButton({ cardOnline }: { cardOnline: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("walletPage.topUp")}
      </Button>
      {/* Wide: Gate-E's page in the payment panel (CardPanel) needs more than 520px for its centred card. */}
      <Drawer wide open={open} onClose={() => setOpen(false)} title={t("walletPage.topUp")}>
        <TopUpForm cardOnline={cardOnline} onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

function TopUpForm({ cardOnline, onDone }: { cardOnline: boolean; onDone: () => void }) {
  const { t, locale, currency } = useI18n();
  const f = createFormatters(locale, currency);
  const formId = useId();
  const [state, run, pending] = useActionState<TopUpState, FormData>(topUpBalance, null);
  const [amount, setAmount] = useState(() => state?.values.amount ?? "");
  useEffect(() => {
    // With Gate-E the drawer stays open: its page shows inside (CardPanel).
    if (state && Object.keys(state.errors).length === 0 && !state.payUrl) onDone();
  }, [state, onDone]);
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 1;
  // Cancelled on Gate-E's page: nothing to show (unpaid top-ups aren't listed), so the drawer just closes.
  if (state?.payUrl && state.paymentId) return <CardPanel url={state.payUrl} paymentId={state.paymentId} onCancelled={onDone} />;
  return (
    <form id={formId} action={run} noValidate className="flex flex-col gap-5">
      <Field label={t("walletPage.topUpAmount", { currency: currencySign(currency, locale) })} htmlFor={`${formId}-amount`} error={err("amount")}>
        <Input
          id={`${formId}-amount`}
          name="amount"
          dir="ltr"
          inputMode="decimal"
          placeholder="50"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!err("amount")}
        />
      </Field>
      <PaymentFields balance={0} useBalance={false} onUseBalance={() => {}} byCard={1} cardOnline={cardOnline} topUp err={err} />
      <Button type="submit" variant="primary" aria-busy={pending} disabled={pending} className="w-full">
        {valid ? t("walletPage.topUpPay", { amount: f.money(value) }) : t("walletPage.topUp")}
      </Button>
    </form>
  );
}
