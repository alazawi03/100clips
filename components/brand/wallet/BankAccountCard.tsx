"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Landmark, Pencil, Trash2 } from "lucide-react";
import type { FormState } from "@/app/actions/brand";
import { removeBankAccount, saveBankAccount } from "@/app/actions/wallet";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input } from "@/components/ui/Form";

type Props = {
  /** The saved account: holder, and the IBAN grouped and masked for showing. */
  bank?: { holder: string; masked: string };
  /** A withdrawal is waiting: removing the account would hold it up, so say so. */
  withdrawalWaiting: boolean;
};

/**
 * Settings → the bank account withdrawals from the balance go to. Optional, like a creator's: it can be
 * changed or removed at any time, and 100clips reads it again when it sends each withdrawal.
 * Keyed by the saved account where it's used, so saving or removing one starts it afresh.
 */
export function BankAccountCard({ bank, withdrawalWaiting }: Props) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(!bank);
  const [removing, startRemoving] = useTransition();
  const [asking, setAsking] = useState(false);

  return (
    <Card id="bank" className="flex scroll-mt-24 flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 font-medium">{t("settings.bank.title")}</h2>
        <p className="text-small text-text-muted">{t("settings.bank.hint")}</p>
      </div>

      {bank && !editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-4">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface">
              <Landmark aria-hidden className="size-5 text-text-muted" />
            </span>
            <span className="min-w-0">
              <bdi dir="ltr" className="block truncate font-medium tabular-nums">
                {bank.masked}
              </bdi>
              <span className="block truncate text-small text-text-muted">{bank.holder}</span>
            </span>
          </span>
          <span className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)} className="h-9 md:h-9">
              <Pencil aria-hidden />
              {t("settings.bank.change")}
            </Button>
            <Button
              variant="destructive"
              aria-busy={removing}
              disabled={removing}
              onClick={() => setAsking(true)}
              className="h-9 md:h-9"
            >
              <Trash2 aria-hidden />
              {t("settings.bank.remove")}
            </Button>
          </span>
          <ConfirmDialog
            open={asking}
            title={t("settings.bank.removeConfirm.title")}
            body={t(withdrawalWaiting ? "settings.bank.removeConfirmWaiting" : "settings.bank.removeConfirm.body")}
            confirmLabel={t("settings.bank.remove")}
            icon={<Landmark className="size-6" />}
            onConfirm={() => startRemoving(() => removeBankAccount())}
            onClose={() => setAsking(false)}
          />
        </div>
      ) : (
        <BankForm holder={bank?.holder} onCancel={bank ? () => setEditing(false) : undefined} onSaved={() => setEditing(false)} />
      )}
    </Card>
  );
}

function BankForm({ holder, onCancel, onSaved }: { holder?: string; onCancel?: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(saveBankAccount, null);
  // Saved: back to showing the account.
  useEffect(() => {
    if (state && Object.keys(state.errors).length === 0) onSaved();
  }, [state, onSaved]);
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  return (
    <form action={action} noValidate className="flex max-w-xl flex-col gap-4">
      <Field label={t("settings.bank.holder")} htmlFor="bank-holder" error={err("holder")} required hint={t("settings.bank.holderHint")}>
        <Input id="bank-holder" name="holder" autoComplete="name" maxLength={80} defaultValue={state?.values.holder ?? holder} aria-invalid={!!err("holder")} />
      </Field>
      <Field label={t("settings.bank.iban")} htmlFor="bank-iban" error={err("iban")} required hint={t("settings.bank.ibanHint")}>
        <Input id="bank-iban" name="iban" dir="ltr" autoComplete="off" spellCheck={false} maxLength={42} placeholder="BH67 BMAG 0000 1299 1234 56" defaultValue={state?.values.iban} aria-invalid={!!err("iban")} className="uppercase" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" aria-busy={pending} disabled={pending}>
          {t("settings.bank.save")}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
