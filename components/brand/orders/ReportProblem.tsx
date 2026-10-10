"use client";

import { useActionState, useId, useState } from "react";
import { CircleCheck, Flag } from "lucide-react";
import type { FormState } from "@/app/actions/brand";
import { reportProblem } from "@/app/actions/wallet";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, FieldError, Textarea } from "@/components/ui/Form";
import { PROBLEM_REASONS } from "@/lib/data/types";

/** "Report a problem" on an order: a reason and what happened, sent to 100clips support. */
export function ReportProblem({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex w-fit items-center gap-1.5 text-small font-medium text-text-muted hover:text-text hover:underline">
        <Flag aria-hidden className="size-4" />
        {t("orderDetail.problem.button")}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("orderDetail.problem.title")}>
        {/* Remounted each time it opens, so a sent report starts fresh. */}
        {open && <ProblemForm orderId={orderId} onClose={() => setOpen(false)} />}
      </Drawer>
    </>
  );
}

function ProblemForm({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { t } = useI18n();
  const groupId = useId();
  const [state, action, pending] = useActionState<FormState, FormData>(reportProblem.bind(null, orderId), null);
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };

  if (state && Object.keys(state.errors).length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CircleCheck aria-hidden className="size-10 text-success" />
        <p className="text-h3 font-medium">{t("orderDetail.problem.sent")}</p>
        <p className="max-w-sm text-small text-text-muted">{t("orderDetail.problem.sentHint")}</p>
        <Button variant="secondary" onClick={onClose} className="mt-2">
          {t("nav.close")}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <p className="text-small text-text-muted">{t("orderDetail.problem.intro")}</p>
      <fieldset className="flex flex-col gap-2" aria-describedby={err("reason") ? `${groupId}-error` : undefined}>
        <legend id={groupId} className="mb-2 font-medium">
          {t("orderDetail.problem.reasonLabel")}
        </legend>
        {PROBLEM_REASONS.map((r) => (
          <label
            key={r}
            className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-border px-3 py-2.5 text-small has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
          >
            <input type="radio" name="reason" value={r} defaultChecked={state?.values.reason === r} className="size-4 accent-[var(--primary)]" />
            {t(`orderDetail.problem.reasons.${r}`)}
          </label>
        ))}
        {err("reason") && <FieldError id={`${groupId}-error`}>{err("reason")}</FieldError>}
      </fieldset>
      <Field label={t("orderDetail.problem.detailsLabel")} htmlFor={`${groupId}-details`} error={err("details")}>
        <Textarea
          id={`${groupId}-details`}
          name="details"
          maxLength={1000}
          defaultValue={state?.values.details}
          placeholder={t("orderDetail.problem.detailsPlaceholder")}
          aria-invalid={!!err("details")}
          className="min-h-28"
        />
      </Field>
      {err("form") && <FieldError>{err("form")}</FieldError>}
      <Button type="submit" variant="primary" aria-busy={pending} disabled={pending} className="w-full">
        <Flag aria-hidden />
        {t("orderDetail.problem.send")}
      </Button>
    </form>
  );
}
