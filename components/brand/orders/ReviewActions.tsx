"use client";

import { Check, PencilLine } from "lucide-react";
import { useActionState, useState } from "react";
import { approveOrder, requestRevision, type FormState } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Form";

/** Approve the delivered clip, or open a short form to ask for a revision. */
export function ReviewActions({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const [revising, setRevising] = useState(false);
  const [state, sendRevision, pending] = useActionState<FormState, FormData>(requestRevision.bind(null, orderId), null);
  const error = state?.errors.note ? t(state.errors.note) : undefined;

  if (revising) {
    return (
      <form action={sendRevision} noValidate className="flex flex-col gap-3">
        <Field label={t("orderDetail.revisionLabel")} htmlFor="note" error={error}>
          <Textarea id="note" name="note" defaultValue={state?.values.note} autoFocus placeholder={t("orderDetail.revisionPlaceholder")} aria-invalid={!!error} aria-describedby={error ? "note-error" : undefined} />
        </Field>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setRevising(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="primary" aria-busy={pending}>
            {t("orderDetail.sendRevision")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form action={approveOrder.bind(null, orderId)} className="flex-1">
        <Button type="submit" variant="primary" className="w-full">
          <Check aria-hidden />
          {t("orderDetail.approve")}
        </Button>
      </form>
      <Button variant="secondary" className="flex-1" onClick={() => setRevising(true)}>
        <PencilLine aria-hidden />
        {t("orderDetail.requestRevision")}
      </Button>
    </div>
  );
}
