"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Plus } from "lucide-react";
import { topUpBalance, type FormState } from "@/app/actions/brand";
import { PaymentFields } from "@/components/brand/cart/PaymentFields";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input } from "@/components/ui/Form";
import { createFormatters } from "@/lib/i18n/format";

/** "Top up wallet": an amount and the card. The balance grows once 100clips confirms the card payment. */
export function TopUpButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("walletPage.topUp")}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("walletPage.topUp")}>
        <TopUpForm onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

function TopUpForm({ onDone }: { onDone: () => void }) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const formId = useId();
  const [state, run, pending] = useActionState<FormState, FormData>(topUpBalance, null);
  const [amount, setAmount] = useState(() => state?.values.amount ?? "");
  useEffect(() => {
    if (state && Object.keys(state.errors).length === 0) onDone();
  }, [state, onDone]);
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  const v = (name: string) => state?.values[name];
  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 1;
  return (
    <form id={formId} action={run} noValidate className="flex flex-col gap-5">
      <Field label={t("walletPage.topUpAmount")} htmlFor={`${formId}-amount`} error={err("amount")}>
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
      <PaymentFields balance={0} useBalance={false} onUseBalance={() => {}} byCard={1} err={err} v={v} />
      <Button type="submit" variant="primary" aria-busy={pending} disabled={pending} className="w-full">
        {valid ? t("walletPage.topUpPay", { amount: f.money(value) }) : t("walletPage.topUp")}
      </Button>
    </form>
  );
}
