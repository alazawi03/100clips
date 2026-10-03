"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";
import { checkout, type FormState } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ContentRules } from "@/components/ui/ContentRules";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { createFormatters } from "@/lib/i18n/format";

type Props = {
  creators: Array<{ id: string; name: string; subtotal: number; summary: string }>;
  products: Array<{ id: string; name: string }>;
  total: number;
  balance: number;
};

export function CheckoutForm({ creators, products, total, balance }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [state, action, pending] = useActionState<FormState, FormData>(checkout, null);
  const [useBalance, setUseBalance] = useState(balance > 0 && (state ? state.values.useBalance === "on" : true));
  const fromBalance = useBalance ? Math.min(balance, total) : 0;
  const byCard = total - fromBalance;
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  const described = (name: string) => (err(name) ? `${name}-error` : undefined);
  const v = (name: string) => state?.values[name];

  return (
    <form action={action} noValidate className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <Card className="flex flex-col gap-5 p-5 md:p-6">
          <h2 className="text-h3 font-medium">{t("checkout.campaign")}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("checkout.titleLabel")} htmlFor="title" error={err("title")}>
              <Input id="title" name="title" defaultValue={v("title")} placeholder={t("checkout.titlePlaceholder")} aria-invalid={!!err("title")} aria-describedby={described("title")} />
            </Field>
            <Field label={t("checkout.productLabel")} htmlFor="productId" error={err("productId")}>
              <Select id="productId" name="productId" defaultValue={v("productId") ?? ""} aria-invalid={!!err("productId")} aria-describedby={described("productId")}>
                <option value="" disabled>
                  {t("checkout.productPlaceholder")}
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t("checkout.briefLabel")} htmlFor="brief" error={err("brief")}>
            <Textarea id="brief" name="brief" defaultValue={v("brief")} placeholder={t("checkout.briefPlaceholder")} aria-invalid={!!err("brief")} aria-describedby={described("brief")} />
          </Field>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-medium">{t("checkout.notes")}</legend>
            {creators.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <Avatar id={c.id} name={c.name} size="sm" className="mt-1.5" />
                <Textarea
                  name={`note-${c.id}`}
                  aria-label={`${t("checkout.notes")}: ${c.name}`}
                  defaultValue={v(`note-${c.id}`)}
                  placeholder={t("checkout.notePlaceholder")}
                  className="min-h-16"
                />
              </div>
            ))}
          </fieldset>
          <ContentRules t={t} error={err("rules")} defaultChecked={v("rules") === "on"} />
        </Card>

        <Card className="flex flex-col gap-5 p-5 md:p-6">
          <h2 className="text-h3 font-medium">{t("checkout.payment")}</h2>
          {balance > 0 && (
            <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-surface px-4 py-3">
              <span className="font-medium">{t("checkout.useBalance", { amount: f.money(balance) })}</span>
              <input type="checkbox" name="useBalance" checked={useBalance} onChange={(e) => setUseBalance(e.target.checked)} className="size-5 accent-[var(--primary)]" />
            </label>
          )}
          {byCard > 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("checkout.cardName")} htmlFor="cardName" error={err("cardName")}>
                  <Input id="cardName" name="cardName" autoComplete="cc-name" defaultValue={v("cardName")} aria-invalid={!!err("cardName")} aria-describedby={described("cardName")} />
                </Field>
                <Field label={t("checkout.cardNumber")} htmlFor="cardNumber" error={err("cardNumber")}>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    defaultValue={v("cardNumber")}
                    aria-invalid={!!err("cardNumber")}
                    aria-describedby={described("cardNumber")}
                  />
                </Field>
                <Field label={t("checkout.cardExpiry")} htmlFor="cardExpiry" error={err("cardExpiry")}>
                  <Input
                    id="cardExpiry"
                    name="cardExpiry"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder={t("checkout.cardExpiryPlaceholder")}
                    defaultValue={v("cardExpiry")}
                    aria-invalid={!!err("cardExpiry")}
                    aria-describedby={described("cardExpiry")}
                  />
                </Field>
                <Field label={t("checkout.cardCvc")} htmlFor="cardCvc" error={err("cardCvc")}>
                  <Input id="cardCvc" name="cardCvc" dir="ltr" inputMode="numeric" autoComplete="cc-csc" placeholder="123" defaultValue={v("cardCvc")} aria-invalid={!!err("cardCvc")} aria-describedby={described("cardCvc")} />
                </Field>
              </div>
              <p className="text-small text-text-muted">{t("checkout.demoCard")}</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4 p-5 md:sticky md:top-24">
        <p className="font-medium">{t("checkout.summary")}</p>
        <ul className="flex flex-col gap-3">
          {creators.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 text-small">
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block text-text-muted">{c.summary}</span>
              </span>
              <span className="tabular-nums">{f.money(c.subtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-border pt-3 text-small">
          <div className="flex justify-between gap-2 text-body">
            <dt className="font-medium">{t("cart.total")}</dt>
            <dd className="font-medium tabular-nums">{f.money(total)}</dd>
          </div>
          {fromBalance > 0 && (
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t("checkout.fromBalance")}</dt>
              <dd className="tabular-nums">{f.signedMoney(-fromBalance)}</dd>
            </div>
          )}
          {fromBalance > 0 && byCard > 0 && (
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t("checkout.byCard")}</dt>
              <dd className="tabular-nums">{f.money(byCard)}</dd>
            </div>
          )}
        </dl>
        <p className="flex gap-2 text-small text-text-muted">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("checkout.heldNote")}
        </p>
        <Button type="submit" variant="hero" className="w-full" aria-busy={pending}>
          {byCard > 0 ? t("checkout.pay", { amount: f.money(byCard) }) : t("checkout.payBalance")}
        </Button>
      </Card>
    </form>
  );
}
