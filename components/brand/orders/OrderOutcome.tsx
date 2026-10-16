"use client";

import { useRef, useState, useTransition } from "react";
import { CircleSlash, Hourglass, Undo2 } from "lucide-react";
import { withdrawOffer } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { ClipVersion, DeclineReason, OrderStatus } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";
import { OFFER_HOURS, OFFER_URGENT_HOURS } from "@/lib/orderFlow";

/*
 * What an order shows while it waits for the creator to answer (the countdown and "Withdraw offer"),
 * once it ended without work (why, and that the money is back), and the clip's versions.
 * Shared by the campaign page's order cards and the order page.
 */

/** Waiting for the creator: how long the offer has left, and taking it back (after a confirmation dialog). */
export function OfferWaiting({
  orderId,
  name,
  hoursLeft,
  refund,
  className,
}: {
  orderId: string;
  name: string;
  hoursLeft: number;
  /** Formatted: what comes back to the balance, fee included. */
  refund: string;
  className?: string;
}) {
  const { t, tp } = useI18n();
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = `withdraw-${orderId}`;
  const urgent = hoursLeft <= OFFER_URGENT_HOURS;
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <span className="flex items-start gap-2 text-small">
        <Hourglass aria-hidden className={cn("mt-0.5 size-4 shrink-0", urgent ? "text-warning" : "text-text-muted")} />
        <span>
          <span className="block font-medium">{t("offer.waiting", { name })}</span>
          <span className={cn("block text-caption", urgent ? "font-medium text-warning" : "text-text-muted")}>{tp("offer.hoursLeft", hoursLeft)}</span>
        </span>
      </span>
      <Button variant="secondary" onClick={() => dialog.current?.showModal()} className="h-9 shrink-0 md:h-9">
        <Undo2 aria-hidden />
        {t("offer.withdraw")}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(e) => e.target === dialog.current && !pending && dialog.current?.close()}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-border bg-card p-0 text-text backdrop:bg-[var(--overlay)]"
      >
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-error-soft text-error">
              <Undo2 className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-h3 font-medium">
                {t("offer.withdrawDialog.title", { name })}
              </h2>
              <p className="text-small text-text-muted">{t("offer.withdrawDialog.body", { name })}</p>
            </div>
          </div>
          <p className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-4 py-3 text-small">
            <span className="text-text-muted">{t("offer.withdrawDialog.refund")}</span>
            <span className="font-medium tabular-nums">{refund}</span>
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" disabled={pending} onClick={() => dialog.current?.close()}>
              {t("offer.withdrawDialog.keep")}
            </Button>
            <Button
              variant="destructive"
              aria-busy={pending}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await withdrawOffer(orderId);
                  dialog.current?.close();
                })
              }
              className="disabled:opacity-70"
            >
              <Undo2 aria-hidden />
              {t("offer.withdrawDialog.confirm")}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

/** An order that ended without work: who ended it and why, and that the money is back in the balance. */
export function OrderClosedNote({
  status,
  reason,
  note,
  name,
  refund,
  className,
}: {
  status: OrderStatus;
  reason?: DeclineReason;
  note?: string;
  name: string;
  /** Formatted: everything the brand paid for this order, fee included. */
  refund: string;
  className?: string;
}) {
  const { t } = useI18n();
  if (status !== "declined" && status !== "cancelled") return null;
  const title =
    status === "cancelled"
      ? t("offer.closed.cancelled")
      : reason === "expired"
        ? t("offer.closed.expired", { name, hours: OFFER_HOURS })
        : t("offer.closed.declined", { name });
  return (
    <div className={cn("flex items-start gap-2 text-small", className)}>
      <CircleSlash aria-hidden className="mt-0.5 size-4 shrink-0 text-text-muted" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        {status === "declined" && reason && reason !== "expired" && <span>{t("offer.reason", { reason: t(`offer.reasons.${reason}`) })}</span>}
        {note && <q dir="auto" className="w-fit text-text-muted">{note}</q>}
        <span className="text-text-muted">{t("offer.refunded", { amount: refund })}</span>
      </span>
    </div>
  );
}

/** The clip, with a switch between versions once there's more than one (the latest first). */
export function ClipVersions({ versions, title, className }: { versions: ClipVersion[]; title: string; className?: string }) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [shown, setShown] = useState(versions.length - 1);
  const version = versions[shown] ?? versions.at(-1);
  if (!version) return null;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {versions.length > 1 && (
        <div role="tablist" aria-label={t("versions.label")} className="flex flex-wrap gap-1.5">
          {versions.map((v, i) => (
            <button
              key={v.uploadedAt}
              type="button"
              role="tab"
              aria-selected={i === shown}
              onClick={() => setShown(i)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full border px-3 text-small transition-colors",
                i === shown ? "border-brand-soft bg-brand-soft font-medium text-brand-on-soft" : "border-border text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              {t("versions.tab", { n: i + 1 })}
              <span className="text-caption opacity-80">{f.date(v.uploadedAt.slice(0, 10))}</span>
            </button>
          ))}
        </div>
      )}
      <video
        key={version.videoSrc + shown}
        dir="ltr"
        src={version.videoSrc}
        controls
        playsInline
        preload="metadata"
        aria-label={t("profile.play", { title })}
        className="aspect-[9/16] w-full rounded-[var(--radius-md)] bg-black object-cover"
      />
      <p className="text-caption text-text-muted">
        {shown === versions.length - 1
          ? versions.length > 1
            ? t("versions.latest", { n: shown + 1 })
            : t("versions.only")
          : t("versions.older", { n: shown + 1, latest: versions.length })}
      </p>
    </div>
  );
}
