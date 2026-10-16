"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, type ButtonVariant } from "@/components/ui/Button";

type Props = {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  /** "destructive" for deleting or removing something; "primary" otherwise. */
  variant?: Extract<ButtonVariant, "destructive" | "primary">;
  icon?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * "Are you sure?" in the app's own modal, in place of the browser's confirm(). Cancel has focus first,
 * so Enter never deletes by accident; Esc and a click outside cancel too.
 */
export function ConfirmDialog({ open, title, body, confirmLabel, variant = "destructive", icon, onConfirm, onClose }: Props) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      cancel.current?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  // Called directly rather than from the dialog's "close" event, which some browsers deliver late or not at all.
  const dismiss = () => {
    dialog.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={body ? `${id}-body` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClick={(e) => e.target === dialog.current && dismiss()}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-border bg-card p-0 text-text backdrop:bg-[var(--overlay)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {icon && (
          <span aria-hidden className={variant === "destructive" ? "grid size-12 place-items-center rounded-full bg-error-soft text-error" : "grid size-12 place-items-center rounded-full bg-surface text-text"}>
            {icon}
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          <h2 id={`${id}-title`} className="text-h2 font-medium text-balance">{title}</h2>
          {body && <p id={`${id}-body`} className="text-small text-text-muted">{body}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancel} variant="ghost" onClick={dismiss}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              dismiss();
              onConfirm();
            }}
            // DESIGN.md Destructive: error text on error-soft. Filled here, as it's the dialog's one action.
            className={variant === "destructive" ? "bg-error-soft" : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
