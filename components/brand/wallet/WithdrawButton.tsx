"use client";

import { useActionState, useState } from "react";
import { ArrowUpFromLine, CircleCheck, Landmark } from "lucide-react";
import type { FormState } from "@/app/actions/brand";
import { requestWithdrawal } from "@/app/actions/wallet";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input } from "@/components/ui/Form";
import { createFormatters } from "@/lib/i18n/format";

type Props = {
  balance: number;
  /** The bank account withdrawals go to, masked; none means it has to be added in Settings first. */
  bank?: { holder: string; iban: string };
  /** Working days it takes, for the hint. */
  days: { from: number; to: number };
};

/** "Withdraw" on the balance: how much, to the saved bank account, arriving in 5–7 working days. */
export function WithdrawButton(props: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // Only an empty balance blocks the button, and it says why in plain sight.
  const empty = props.balance <= 0;
  return (
    <>
      <Button variant="secondary" disabled={empty} onClick={() => setOpen(true)} aria-describedby={empty ? "withdraw-empty" : undefined} className="w-full disabled:cursor-not-allowed disabled:opacity-50">
        <ArrowUpFromLine aria-hidden />
        {t("walletPage.withdraw.button")}
      </Button>
      {empty && (
        <p id="withdraw-empty" className="text-center text-caption text-text-muted">
          {t("walletPage.withdraw.empty")}
        </p>
      )}
      <Drawer open={open} onClose={() => setOpen(false)} title={t("walletPage.withdraw.title")}>
        {open && <WithdrawForm {...props} onClose={() => setOpen(false)} />}
      </Drawer>
    </>
  );
}

function WithdrawForm({ balance, bank, days, onClose }: Props & { onClose: () => void }) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [state, action, pending] = useActionState<FormState, FormData>(requestWithdrawal, null);
  const error = state?.errors.amount ? t(state.errors.amount) : undefined;
  const sent = state && Object.keys(state.errors).length === 0;

  if (!bank) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-surface">
          <Landmark aria-hidden className="size-6 text-text-muted" />
        </span>
        <p className="text-h3 font-medium">{t("walletPage.withdraw.noBankTitle")}</p>
        <p className="max-w-sm text-small text-text-muted">{t("walletPage.withdraw.noBankHint")}</p>
        <LinkButton href="/settings#bank" variant="primary" className="mt-2">
          {t("walletPage.withdraw.addBank")}
        </LinkButton>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CircleCheck aria-hidden className="size-10 text-success" />
        <p className="text-h3 font-medium">{t("walletPage.withdraw.sentTitle")}</p>
        <p className="max-w-sm text-small text-text-muted">{t("walletPage.withdraw.sentHint", { from: days.from, to: days.to })}</p>
        <Button variant="secondary" onClick={onClose} className="mt-2">
          {t("nav.close")}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <Field label={t("walletPage.withdraw.amount")} htmlFor="withdraw-amount" error={error} required hint={t("walletPage.withdraw.available", { amount: f.money(balance) })}>
        <Input
          id="withdraw-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.001"
          min={1}
          max={balance}
          defaultValue={state?.values.amount ?? String(balance)}
          aria-invalid={!!error}
          dir="ltr"
          className="tabular-nums"
        />
      </Field>
      <div className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-surface p-4 text-small">
        <span className="text-text-muted">{t("walletPage.withdraw.to")}</span>
        <span className="flex items-center gap-2 font-medium">
          <Landmark aria-hidden className="size-4 shrink-0 text-text-muted" />
          <bdi dir="ltr">{bank.iban}</bdi>
        </span>
        <span className="text-text-muted">{bank.holder}</span>
      </div>
      <p className="text-small text-text-muted">{t("walletPage.withdraw.timing", { from: days.from, to: days.to })}</p>
      <Button type="submit" variant="primary" aria-busy={pending} disabled={pending} className="w-full">
        <ArrowUpFromLine aria-hidden />
        {t("walletPage.withdraw.submit")}
      </Button>
    </form>
  );
}
