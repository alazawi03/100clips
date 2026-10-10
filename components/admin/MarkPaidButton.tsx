"use client";

import { useActionState, useState } from "react";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { markCreatorPaid, type PayoutState } from "@/app/actions/admin";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input } from "@/components/ui/Form";

type Props = {
  creatorId: string;
  creatorName: string;
  amount: string;
  bank: { iban: string; accountName: string; bank: string };
  /** Set when the creator changed their bank details recently: confirm with them before sending. */
  bankChangedDays?: number;
  orders: Array<{ id: string; title: string; approvedOn: string; amount: string }>;
};

/** "Mark paid": shows where to send the money and what it covers, then takes the bank reference. */
export function MarkPaidButton(props: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {t("admin.payouts.markPaid")}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("admin.payouts.drawerTitle", { name: props.creatorName })}>
        <MarkPaidForm {...props} />
      </Drawer>
    </>
  );
}

function MarkPaidForm({ creatorId, amount, bank, bankChangedDays, orders }: Props) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<PayoutState, FormData>(
    markCreatorPaid.bind(null, creatorId, orders.map((o) => o.id)),
    null,
  );
  return (
    <form action={action} className="flex flex-col gap-6">
      {bankChangedDays !== undefined && (
        <p className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warning-soft p-3 text-small">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
          {t("admin.payouts.bankChanged", { days: String(bankChangedDays) })}
        </p>
      )}
      <section className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-surface p-4">
        <span className="text-small text-text-muted">{t("admin.payouts.sendTo")}</span>
        <span className="font-medium">{bank.accountName}</span>
        <span className="font-medium tracking-wide tabular-nums">
          <bdi dir="ltr">{bank.iban.replace(/(.{4})/g, "$1 ").trim()}</bdi>
        </span>
        <span className="text-small text-text-muted">{bank.bank}</span>
        <span className="mt-2 text-h2 font-medium tabular-nums">{amount}</span>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium">{t("admin.payouts.covers")}</h3>
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2 text-small">
              <span className="min-w-0">
                <span className="block truncate">{o.title}</span>
                <span className="block text-text-muted">
                  <bdi dir="ltr">{o.id}</bdi> · {t("admin.payouts.approvedOn", { date: o.approvedOn })}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{o.amount}</span>
            </li>
          ))}
        </ul>
      </section>

      <Field label={t("admin.payouts.bankRef")} htmlFor="bankRef" error={state?.error ? t(state.error) : undefined} hint={t("admin.payouts.bankRefHint")}>
        <Input id="bankRef" name="bankRef" autoComplete="off" dir="ltr" maxLength={40} required aria-invalid={!!state?.error} />
      </Field>

      <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
        {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : <Check aria-hidden />}
        {t("admin.payouts.confirm", { amount })}
      </Button>
    </form>
  );
}
