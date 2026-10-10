"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, LinkButton, type ButtonVariant } from "@/components/ui/Button";

/** Where the brand wizard sends you once the brand is saved: on with the new campaign, or the cart's order. */
export type AfterBrand = "campaign" | "checkout";

/**
 * A campaign (or the cart's order, which becomes one) is always for a brand and its product, so an
 * account without one is told so first: what's needed, in order, and one way forward.
 */
export function NeedBrandDialog({ open, then, onClose }: { open: boolean; then: AfterBrand; onClose: () => void }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Esc, a click outside and "Not now" each count as "Not now" (called directly, not from the
  // dialog's "close" event, which some browsers deliver late or not at all).
  const dismiss = () => {
    dialog.current?.close();
    onClose();
  };

  const order = then === "checkout";
  const steps = [t("newCampaign.needBrand.step1"), t("newCampaign.needBrand.step2"), order ? t("newCampaign.needBrand.step3Order") : t("newCampaign.needBrand.step3")];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="need-brand-title"
      aria-describedby="need-brand-body"
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClick={(e) => e.target === dialog.current && dismiss()}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-[var(--radius-xl)] border border-border bg-card p-0 text-text shadow-lift backdrop:bg-[var(--overlay)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary-on-soft">
          <Store className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 id="need-brand-title" className="text-h2 font-medium">
            {t("newCampaign.needBrand.title")}
          </h2>
          <p id="need-brand-body" className="text-small text-text-muted">
            {order ? t("newCampaign.needBrand.bodyOrder") : t("newCampaign.needBrand.body")}
          </p>
        </div>
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 rounded-[var(--radius-md)] bg-surface p-3 text-small">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-card text-caption font-medium tabular-nums">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={dismiss}>
            {t("newCampaign.needBrand.later")}
          </Button>
          <LinkButton href={`/brands/new?next=${then}`} variant="primary">
            {t("newCampaign.needBrand.create")}
            <ArrowRight aria-hidden className="rtl:-scale-x-100" />
          </LinkButton>
        </div>
      </div>
    </dialog>
  );
}

/**
 * A way into a campaign ("New campaign", the cart's "Continue order"): straight to `href`, or the
 * "create your brand first" dialog when there's no brand yet.
 */
export function NeedBrandButton({
  hasBrand,
  href,
  then,
  variant,
  className,
  children,
}: {
  hasBrand: boolean;
  href: string;
  then: AfterBrand;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (hasBrand) {
    return (
      <LinkButton href={href} variant={variant} className={className}>
        {children}
      </LinkButton>
    );
  }
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        {children}
      </Button>
      <NeedBrandDialog open={open} then={then} onClose={() => setOpen(false)} />
    </>
  );
}

/** A campaign page opened without a brand (a link or the address bar): the dialog straight away; "Not now" goes back. */
export function NeedBrandOnArrival({ then, back }: { then: AfterBrand; back: string }) {
  const router = useRouter();
  return <NeedBrandDialog open then={then} onClose={() => router.replace(back)} />;
}
