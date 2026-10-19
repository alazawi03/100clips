"use client";

import { CreditCard, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { FieldError } from "@/components/ui/Form";
import { createFormatters } from "@/lib/i18n/format";

type Props = {
  balance: number;
  useBalance: boolean;
  onUseBalance: (on: boolean) => void;
  /** What's left to pay by card after the balance. */
  byCard: number;
  /** Card parts are paid on Gate-E's page straight after; otherwise laqta sends a payment link. */
  cardOnline: boolean;
  /** Topping up the balance rather than paying for offers. */
  topUp?: boolean;
  err: (name: string) => string | undefined;
};

/**
 * Pay from the balance and/or by card, plus the refund promise. Used by both checkouts and the top-up.
 * No card fields: the card is entered on Gate-E's page, so card numbers never reach laqta.
 */
export function PaymentFields({ balance, useBalance, onUseBalance, byCard, cardOnline, topUp, err }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const cardNote = cardOnline ? t("checkout.cardOnline") : topUp ? t("walletPage.topUpByLink") : t("checkout.cardByLink");
  return (
    <>
      {balance > 0 && (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-surface px-4 py-3">
          <span className="font-medium">{t("checkout.useBalance", { amount: f.money(balance) })}</span>
          <input type="checkbox" name="useBalance" checked={useBalance} onChange={(e) => onUseBalance(e.target.checked)} className="size-5 accent-[var(--primary)]" />
        </label>
      )}
      {byCard > 0 && (
        <p className="flex gap-3 rounded-[var(--radius-lg)] bg-surface px-4 py-3 text-small">
          <CreditCard aria-hidden className="mt-0.5 size-5 shrink-0 text-text-muted" strokeWidth={1.75} />
          {cardNote}
        </p>
      )}
      {!topUp && (
        <p className="flex gap-3 rounded-[var(--radius-lg)] bg-surface px-4 py-3 text-small">
          <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={1.75} />
          {t("checkout.refundNote")}
        </p>
      )}
      {/* Paying was refused (a creator no longer available, the account suspended, card payments down...). */}
      {err("pay") && <FieldError id="pay-error">{err("pay")}</FieldError>}
    </>
  );
}
