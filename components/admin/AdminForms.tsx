"use client";

import { useActionState, useState } from "react";
import { CalendarClock, Check, CircleCheck, KeyRound, LoaderCircle, OctagonX, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { cancelOrder, extendDeadline, rejectBrandWithdrawal, resetLogin, resolveProblem, sendBrandWithdrawal, setSuspended, type AdminFormState } from "@/app/actions/admin";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Notice } from "@/components/ui/Notice";
import type { SuspendedKind } from "@/lib/data/moderation";
import type { MessageKey } from "@/lib/i18n/messages";

/** A button that opens a drawer with a form; the drawer says what happened once the action succeeds. */
function ActionDrawer({
  label,
  title,
  icon: Icon,
  variant = "secondary",
  children,
}: {
  label: string;
  title: string;
  icon: typeof CalendarClock;
  variant?: "secondary" | "destructive" | "primary";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Icon aria-hidden />
        {label}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title}>
        {children(() => setOpen(false))}
      </Drawer>
    </>
  );
}

function Done({ text, onClose }: { text: string; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-start gap-4">
      <Notice>{text}</Notice>
      <Button variant="secondary" onClick={onClose}>
        {t("admin.forms.close")}
      </Button>
    </div>
  );
}

function Submit({ pending, label, variant = "primary" }: { pending: boolean; label: string; variant?: "primary" | "destructive" }) {
  return (
    // Destructive: red text on a soft red fill (the "destructive" button has no fill of its own).
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending} className={variant === "destructive" ? "bg-error-soft" : undefined}>
      {pending && <LoaderCircle aria-hidden className="animate-spin" />}
      {label}
    </Button>
  );
}

const useErr = (state: AdminFormState) => {
  const { t } = useI18n();
  return (name: string) => {
    const key = state?.errors?.[name];
    return key ? t(key as MessageKey) : undefined;
  };
};

/* ---------- Users ---------- */

/** Suspend (with a reason, kept in the log) or lift a suspension. */
export function SuspendControl({ kind, id, name, suspended }: { kind: SuspendedKind; id: string; name: string; suspended: boolean }) {
  const { t } = useI18n();
  return (
    <ActionDrawer
      label={t(suspended ? "admin.users.unsuspend" : "admin.users.suspend")}
      title={t(suspended ? "admin.users.unsuspendTitle" : "admin.users.suspendTitle", { name })}
      icon={suspended ? ShieldCheck : ShieldAlert}
      variant={suspended ? "secondary" : "destructive"}
    >
      {(close) => <SuspendForm kind={kind} id={id} on={!suspended} onClose={close} />}
    </ActionDrawer>
  );
}

function SuspendForm({ kind, id, on, onClose }: { kind: SuspendedKind; id: string; on: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(setSuspended.bind(null, kind, id, on), null);
  const err = useErr(state);
  if (state?.done) return <Done text={t(on ? "admin.users.suspendedDone" : "admin.users.unsuspendedDone")} onClose={onClose} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-text-muted">{t(on ? `admin.users.suspendWhat.${kind}` : `admin.users.unsuspendWhat.${kind}`)}</p>
      <Field label={t(on ? "admin.users.reason" : "admin.users.reasonOptional")} htmlFor="reason" error={err("reason")}>
        <Textarea id="reason" name="reason" maxLength={500} aria-invalid={!!err("reason")} />
      </Field>
      <Submit pending={pending} label={t(on ? "admin.users.suspendConfirm" : "admin.users.unsuspendConfirm")} variant={on ? "destructive" : "primary"} />
    </form>
  );
}

/** Mock reset: brands get a password-reset email, creators are signed out everywhere. */
export function ResetLoginButton({ kind, id }: { kind: SuspendedKind; id: string }) {
  const { t } = useI18n();
  return (
    <ActionDrawer label={t("admin.users.reset")} title={t("admin.users.resetTitle")} icon={KeyRound}>
      {(close) => <ResetForm kind={kind} id={id} onClose={close} />}
    </ActionDrawer>
  );
}

function ResetForm({ kind, id, onClose }: { kind: SuspendedKind; id: string; onClose: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(() => resetLogin(kind, id), null);
  if (state?.done) return <Done text={t(`admin.users.resetDone.${kind}`)} onClose={onClose} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-text-muted">{t(`admin.users.resetWhat.${kind}`)}</p>
      <Submit pending={pending} label={t("admin.users.resetConfirm")} />
    </form>
  );
}

/* ---------- Orders ---------- */

/** `reference`: the order as people know it (#1043). */
export function ExtendDeadlineButton({ orderId, reference, current, min }: { orderId: string; reference: string; current?: string; min: string }) {
  const { t } = useI18n();
  return (
    <ActionDrawer label={t("admin.orders.extend")} title={t("admin.orders.extendTitle", { id: reference })} icon={CalendarClock}>
      {(close) => <ExtendForm orderId={orderId} current={current} min={min} onClose={close} />}
    </ActionDrawer>
  );
}

function ExtendForm({ orderId, current, min, onClose }: { orderId: string; current?: string; min: string; onClose: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(extendDeadline.bind(null, orderId, current), null);
  const err = useErr(state);
  if (state?.done) return <Done text={t("admin.orders.extendDone")} onClose={onClose} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-text-muted">{t("admin.orders.extendWhat")}</p>
      <Field label={t("admin.orders.newDeadline")} htmlFor="deadline" error={err("deadline")}>
        <Input id="deadline" name="deadline" type="date" min={current && current > min ? current : min} required aria-invalid={!!err("deadline")} />
      </Field>
      <Field label={t("admin.orders.noteOptional")} htmlFor="note">
        <Textarea id="note" name="note" maxLength={500} />
      </Field>
      <Submit pending={pending} label={t("admin.orders.extendConfirm")} />
    </form>
  );
}

export function CancelOrderButton({ orderId, reference, amount }: { orderId: string; reference: string; amount: string }) {
  const { t } = useI18n();
  return (
    <ActionDrawer label={t("admin.orders.cancel")} title={t("admin.orders.cancelTitle", { id: reference })} icon={OctagonX} variant="destructive">
      {(close) => <CancelForm orderId={orderId} amount={amount} onClose={close} />}
    </ActionDrawer>
  );
}

function CancelForm({ orderId, amount, onClose }: { orderId: string; amount: string; onClose: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(cancelOrder.bind(null, orderId), null);
  const err = useErr(state);
  if (state?.done) return <Done text={t("admin.orders.cancelDone", { amount })} onClose={onClose} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-text-muted">{t("admin.orders.cancelWhat", { amount })}</p>
      <Field label={t("admin.orders.reason")} htmlFor="note" error={err("note")} hint={t("admin.orders.reasonHint")}>
        <Textarea id="note" name="note" maxLength={500} required aria-invalid={!!err("note")} />
      </Field>
      <Submit pending={pending} label={t("admin.orders.cancelConfirm", { amount })} variant="destructive" />
    </form>
  );
}

/* ---------- Withdrawals from brands ---------- */

/** "Mark as sent": shows the account's bank details as they are now, then takes the transfer reference. */
export function SendWithdrawalButton({ id, amount, bank }: { id: string; amount: string; bank?: { holder: string; iban: string } }) {
  const { t } = useI18n();
  return (
    <ActionDrawer label={t("admin.withdrawals.markSent")} title={t("admin.withdrawals.sendTitle", { amount })} icon={Check} variant="primary">
      {(close) => <SendWithdrawalForm id={id} amount={amount} bank={bank} onClose={close} />}
    </ActionDrawer>
  );
}

function SendWithdrawalForm({ id, amount, bank, onClose }: { id: string; amount: string; bank?: { holder: string; iban: string }; onClose: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(sendBrandWithdrawal.bind(null, id), null);
  const err = useErr(state);
  if (state?.done) return <Done text={t("admin.withdrawals.sentDone", { amount })} onClose={onClose} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-surface p-4">
        <span className="text-small text-text-muted">{t("admin.payouts.sendTo")}</span>
        {bank ? (
          <>
            <span className="font-medium">
              <bdi dir="ltr">{bank.holder}</bdi>
            </span>
            <span className="font-medium tracking-wide tabular-nums">
              <bdi dir="ltr">{bank.iban.replace(/(.{4})/g, "$1 ").trim()}</bdi>
            </span>
          </>
        ) : (
          <span className="font-medium text-warning">{t("admin.withdrawals.noBank")}</span>
        )}
        <span className="mt-2 text-h2 font-medium tabular-nums">{amount}</span>
      </section>
      <Field label={t("admin.payouts.bankRef")} htmlFor="bankRef" error={err("bankRef")} hint={t("admin.payouts.bankRefHint")}>
        <Input id="bankRef" name="bankRef" dir="ltr" autoComplete="off" maxLength={40} required aria-invalid={!!err("bankRef")} />
      </Field>
      <Submit pending={pending} label={t("admin.withdrawals.sendConfirm", { amount })} />
    </form>
  );
}

export function RejectWithdrawalButton({ id, amount }: { id: string; amount: string }) {
  const { t } = useI18n();
  return (
    <ActionDrawer label={t("admin.withdrawals.reject")} title={t("admin.withdrawals.rejectTitle", { amount })} icon={X} variant="destructive">
      {(close) => <RejectWithdrawalForm id={id} amount={amount} onClose={close} />}
    </ActionDrawer>
  );
}

function RejectWithdrawalForm({ id, amount, onClose }: { id: string; amount: string; onClose: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(rejectBrandWithdrawal.bind(null, id), null);
  const err = useErr(state);
  if (state?.done) return <Done text={t("admin.withdrawals.rejectedDone", { amount })} onClose={onClose} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-text-muted">{t("admin.withdrawals.rejectWhat", { amount })}</p>
      <Field label={t("admin.withdrawals.noteToBrand")} htmlFor="note" error={err("note")}>
        <Textarea id="note" name="note" maxLength={500} required aria-invalid={!!err("note")} />
      </Field>
      <Submit pending={pending} label={t("admin.withdrawals.rejectConfirm")} variant="destructive" />
    </form>
  );
}

/* ---------- Problem reports ---------- */

/** Resolve a brand's report with a reply they see on the order. */
export function ResolveProblemButton({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <ActionDrawer label={t("admin.reports.resolve")} title={t("admin.reports.resolveTitle")} icon={CircleCheck} variant="primary">
      {(close) => <ResolveForm id={id} onClose={close} />}
    </ActionDrawer>
  );
}

function ResolveForm({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(resolveProblem.bind(null, id), null);
  const err = useErr(state);
  if (state?.done) return <Done text={t("admin.reports.resolvedDone")} onClose={onClose} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label={t("admin.reports.reply")} htmlFor="resolution" error={err("resolution")} hint={t("admin.reports.replyHint")}>
        <Textarea id="resolution" name="resolution" maxLength={1000} required aria-invalid={!!err("resolution")} />
      </Field>
      <Submit pending={pending} label={t("admin.reports.resolveConfirm")} />
    </form>
  );
}
