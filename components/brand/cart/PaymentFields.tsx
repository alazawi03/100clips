"use client";

import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Field, FieldError, Input } from "@/components/ui/Form";
import { createFormatters } from "@/lib/i18n/format";

/** "1228" → "12/28". While typing (`adding`), the slash appears right after the month. */
function maskExpiry(raw: string, adding: boolean) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 || (adding && d.length === 2) ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

type Props = {
  balance: number;
  useBalance: boolean;
  onUseBalance: (on: boolean) => void;
  /** What's left to pay by card after the balance. */
  byCard: number;
  err: (name: string) => string | undefined;
  /** Submitted value of a field, to show again after a failed submit. */
  v: (name: string) => string | undefined;
};

/** Pay from the balance and/or by card, plus the refund promise. Used by both checkouts. */
export function PaymentFields({ balance, useBalance, onUseBalance, byCard, err, v }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const described = (name: string) => (err(name) ? `${name}-error` : undefined);
  const setUseBalance = onUseBalance;
  return (
    <>
        {balance > 0 && (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-surface px-4 py-3">
            <span className="font-medium">{t("checkout.useBalance", { amount: f.money(balance) })}</span>
            <input type="checkbox" name="useBalance" checked={useBalance} onChange={(e) => setUseBalance(e.target.checked)} className="size-5 accent-[var(--primary)]" />
          </label>
        )}
        {byCard > 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label={t("checkout.cardNumber")} htmlFor="cardNumber" error={err("cardNumber")}>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    defaultValue={v("cardNumber")}
                    aria-invalid={!!err("cardNumber")}
                    aria-describedby={described("cardNumber")}
                  />
                </Field>
              </div>
              <Field label={t("checkout.cardExpiry")} htmlFor="cardExpiry" error={err("cardExpiry")}>
                <Input
                  id="cardExpiry"
                  name="cardExpiry"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  maxLength={5}
                  placeholder={t("checkout.cardExpiryPlaceholder")}
                  defaultValue={v("cardExpiry")}
                  onChange={(e) => {
                    const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith("delete");
                    e.currentTarget.value = maskExpiry(e.currentTarget.value, !deleting);
                  }}
                  aria-invalid={!!err("cardExpiry")}
                  aria-describedby={described("cardExpiry")}
                />
              </Field>
              <Field label={t("checkout.cardCvc")} htmlFor="cardCvc" error={err("cardCvc")}>
                <Input
                  id="cardCvc"
                  name="cardCvc"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="000"
                  defaultValue={v("cardCvc")}
                  aria-invalid={!!err("cardCvc")}
                  aria-describedby={described("cardCvc")}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("checkout.cardName")} htmlFor="cardName" error={err("cardName")}>
                  <Input id="cardName" name="cardName" autoComplete="cc-name" defaultValue={v("cardName")} aria-invalid={!!err("cardName")} aria-describedby={described("cardName")} />
                </Field>
              </div>
            </div>
            <p className="text-small text-text-muted">{t("checkout.demoCard")}</p>
          </div>
        )}
        <p className="flex gap-3 rounded-[var(--radius-lg)] bg-surface px-4 py-3 text-small">
          <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={1.75} />
          {t("checkout.refundNote")}
        </p>
        {/* Paying was refused (a creator no longer available, the account suspended...). */}
        {err("pay") && <FieldError id="pay-error">{err("pay")}</FieldError>}
    </>
  );
}
