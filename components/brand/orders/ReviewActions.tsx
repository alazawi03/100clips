"use client";

import { Check, PencilLine, Star } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { approveOrder, requestRevision, type FormState } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Form";
import { cn } from "@/lib/cn";

type Props = {
  orderId: string;
  creatorName: string;
  /** The brand is watching copies with laqta's watermark: the confirmation says approving gives it the clip without. */
  watermarked?: boolean;
};

/**
 * Approve the delivered clip (green, then a confirmation with stars and an optional comment),
 * or ask for a revision (as often as needed, until approving).
 */
export function ReviewActions({ orderId, creatorName, watermarked }: Props) {
  const { t } = useI18n();
  const [revising, setRevising] = useState(false);
  const [state, sendRevision, pending] = useActionState<FormState, FormData>(requestRevision.bind(null, orderId), null);
  const error = state?.errors.note ? t(state.errors.note) : undefined;
  const dialog = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(0);

  if (revising) {
    return (
      <form action={sendRevision} noValidate className="flex flex-col gap-3">
        <Field label={t("orderDetail.revisionLabel")} htmlFor="note" error={error} required>
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" className="flex-1" onClick={() => dialog.current?.showModal()}>
          <Check aria-hidden />
          {t("orderDetail.approve")}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setRevising(true)}>
          <PencilLine aria-hidden />
          {t("orderDetail.requestRevision")}
        </Button>
      </div>

      {/* Confirm approval: rate the creator and leave a comment (both optional), then release the payment. */}
      <dialog
        ref={dialog}
        aria-labelledby={`approve-${orderId}`}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-border bg-card p-0 text-text backdrop:bg-[var(--overlay)]"
      >
        <form action={approveOrder.bind(null, orderId)} className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 id={`approve-${orderId}`} className="text-h3 font-medium">
              {t("orderDetail.approveTitle", { name: creatorName })}
            </h2>
            <p className="text-small text-text-muted">
              {t("orderDetail.approveHint", { name: creatorName })}
              {watermarked && ` ${t("orderDetail.approveClean")}`}
            </p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-medium">{t("orderDetail.rateLabel", { name: creatorName })}</legend>
            <input type="hidden" name="rating" value={rating || ""} />
            <div role="radiogroup" aria-label={t("orderDetail.rateLabel", { name: creatorName })} className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={String(n)}
                  onClick={() => setRating(n)}
                  className="grid size-10 place-items-center rounded-full hover:bg-surface"
                >
                  <Star aria-hidden className={cn("size-7", n <= rating ? "fill-warning text-warning" : "text-border")} />
                </button>
              ))}
            </div>
          </fieldset>

          <Field label={t("orderDetail.reviewLabel")} htmlFor={`review-${orderId}`}>
            <Textarea id={`review-${orderId}`} name="review" maxLength={500} className="min-h-24" placeholder={t("orderDetail.reviewPlaceholder")} />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => dialog.current?.close()}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              <Check aria-hidden />
              {t("orderDetail.approveConfirm")}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
