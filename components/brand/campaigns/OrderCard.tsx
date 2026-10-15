"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Clapperboard, Clock, MapPin, MessageCircle, ScanSearch, Star, Truck } from "lucide-react";
import { markOrderReturned, markOrderSent, rateOrder } from "@/app/actions/brand";
import { messageCreator } from "@/app/actions/messages";
import { useI18n } from "@/components/i18n/I18nProvider";
import { AdCode } from "@/components/brand/orders/AdCode";
import { ClipVersions, OfferWaiting, OrderClosedNote } from "@/components/brand/orders/OrderOutcome";
import { ReviewActions } from "@/components/brand/orders/ReviewActions";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button, buttonClass, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { Field, Input } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import type { ShipTo } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";
import { isActiveOrder, orderBadgeStatus } from "@/lib/statuses";
import type { OrderCardView } from "./campaignView";

/**
 * One creator in the campaign: who, what, price and status with a step bar, plus the next thing to do.
 * Opens inline to show messages, shipping, the clip, payment, and rating once it's done.
 */
export function OrderCard({ order, productName }: { order: OrderCardView; productName: string }) {
  const { t, tp, locale } = useI18n();
  const f = createFormatters(locale);
  const [open, setOpen] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const panelId = `order-${order.id}`;
  const stepIndex = order.steps.indexOf(order.step);
  const next = order.status === "approved" ? undefined : order.steps[stepIndex + 1];
  // Declined and cancelled orders have no steps left.
  const cancelled = !isActiveOrder(order);

  // The banner's button ("Review now") opens this card and brings it into view.
  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== order.id) return;
      setOpen(true);
      // After the phone layout has switched to the orders tab.
      setTimeout(() => card.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    window.addEventListener(OPEN_ORDER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ORDER_EVENT, onOpen);
  }, [order.id]);

  return (
    <Card ref={card} className="relative scroll-mt-32 overflow-hidden">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)} className="flex w-full flex-col gap-3 p-4 text-start transition-colors hover:bg-surface/50 sm:p-5">
        <span className="flex w-full items-center gap-3">
          <Avatar id={order.creatorId} name={order.name} src={order.photo} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{order.name}</span>
            <span className="block truncate text-small text-text-muted">{order.itemsLabel}</span>
          </span>
          {/* The status; the line under the bar only counts steps, so it isn't said twice. */}
          <StatusBadge order={orderBadgeStatus(order)} />
          {/* Room for the messages button, which sits on top of the header (a button can't hold a form). */}
          {order.conversationId && <span aria-hidden className="size-10 shrink-0" />}
          <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-text-muted transition-transform", open && "rotate-180")} />
        </span>

        {!cancelled && (
          <span className="flex w-full flex-col gap-1.5">
            <span aria-hidden className="flex gap-1">
              {order.steps.map((s, i) => (
                <span key={s} className={cn("h-1.5 flex-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-border")} />
              ))}
            </span>
            <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-small">
              <span>
                <span className="font-medium">{t("flow.stepCount", { n: stepIndex + 1, total: order.steps.length })}</span>
                {next && (
                  <span className="text-text-muted">
                    {" · "}
                    {t("flow.next", { step: t(`flow.steps.${next}`) })}
                  </span>
                )}
              </span>
            </span>
          </span>
        )}
      </button>

      {/* Chat with this creator: opens once they've accepted an order from this brand. */}
      {order.conversationId && <form action={messageCreator.bind(null, order.creatorId, order.brandId)} className="absolute end-12 top-4 sm:end-[52px] sm:top-5">
        <button
          type="submit"
          aria-label={order.unread > 0 ? `${t("campaignDetail.messages")} · ${tp("chat.unread", order.unread)}` : t("campaignDetail.messages")}
          className="relative grid size-10 place-items-center rounded-full border border-border text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <MessageCircle aria-hidden className="size-[18px]" />
          {order.unread > 0 && (
            <span aria-hidden className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-caption font-medium text-on-accent tabular-nums">
              {order.unread}
            </span>
          )}
        </button>
      </form>}

      {/* The next step stays visible whether the card is open or not. */}
      {order.action && <OrderAction order={order} productName={productName} />}
      {order.hoursLeft !== undefined && <OfferWaiting orderId={order.id} name={order.name} hoursLeft={order.hoursLeft} refund={f.money(order.refund)} className="border-t border-border px-4 py-3 sm:px-5" />}
      {cancelled && (
        <OrderClosedNote
          status={order.status}
          reason={order.declineReason}
          note={order.declineNote}
          name={order.name}
          refund={f.money(order.refund)}
          className="border-t border-border px-4 py-3 sm:px-5"
        />
      )}

      <div id={panelId} hidden={!open} className="border-t border-border">
        <div className="flex flex-col gap-5 p-4 sm:p-5">
          {/* Every step in one row across the card: done ones checked, the current one outlined. */}
          {!cancelled && (
            <Section title={t("flow.stepsTitle")}>
              <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${order.steps.length}, minmax(0, 1fr))` }}>
                {order.steps.map((s, i) => {
                  const done = i < stepIndex || order.status === "approved";
                  const current = i === stepIndex && order.status !== "approved";
                  return (
                    <li key={s} aria-current={current ? "step" : undefined} className="relative flex flex-col items-center gap-1.5 text-center">
                      {/* The line to the next step, behind the circles. */}
                      {i < order.steps.length - 1 && (
                        <span aria-hidden className={cn("absolute top-3 h-0.5 w-full ltr:left-1/2 rtl:right-1/2", done ? "bg-primary" : "bg-border")} />
                      )}
                      <span
                        aria-hidden
                        className={cn(
                          "relative grid size-6 shrink-0 place-items-center rounded-full border-2 bg-card text-[11px] leading-none font-medium tabular-nums",
                          done && "border-primary bg-primary text-on-primary",
                          current && "border-primary",
                          !done && !current && "border-border text-text-muted",
                        )}
                      >
                        {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={cn("line-clamp-2 text-caption", current ? "font-medium" : done ? "" : "text-text-muted")}>{t(`flow.steps.${s}`)}</span>
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}

          <Section title={t("campaignDetail.clip")}>
            {order.clip && (order.status === "delivered" || order.status === "approved") ? (
              // The clip on one side; what to do with it beside it, so neither column sits empty.
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <ClipVersions versions={order.versions} title={order.name} className="w-full max-w-[220px] shrink-0 sm:w-[200px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  {order.status === "delivered" && <ReviewActions orderId={order.id} creatorName={order.name} revisionsLeft={order.revisionsLeft} />}
                  {order.status === "approved" && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-small font-medium text-text-muted">{order.rating ? t("campaignDetail.rated", { name: order.name }) : t("campaignDetail.rate", { name: order.name })}</h3>
                      <Stars orderId={order.id} value={order.rating} label={t("campaignDetail.rate", { name: order.name })} />
                    </div>
                  )}
                  {order.adPlatform && <AdCode orderId={order.id} platform={order.adPlatform} code={order.adCode} today={order.today} />}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {order.status === "approved" && (
                      <LinkButton href={`/creators/${order.creatorId}`} variant="secondary" className="h-9 w-fit md:h-9">
                        {t("campaignDetail.hireAgain")}
                      </LinkButton>
                    )}
                    <OpenOrderLink id={order.id} />
                  </div>
                </div>
              </div>
            ) : order.clip && order.revisionRequested ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full max-w-[200px] shrink-0">
                  <ClipPoster clip={order.clip} views={f.compact(order.clip.views)} duration={f.duration(order.clip.durationSec)} compact className="opacity-50" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-small font-medium shadow-soft">
                      <ScanSearch aria-hidden className="size-4" />
                      {t("brandHome.revisionRequested")}
                    </span>
                  </span>
                </div>
                <OpenOrderLink id={order.id} />
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-small text-text-muted">
                  <Clapperboard aria-hidden className="size-4" />
                  {t("campaignDetail.noClip")}
                </p>
                <OpenOrderLink id={order.id} />
              </div>
            )}
          </Section>
        </div>
      </div>
    </Card>
  );
}

function OpenOrderLink({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <Link href={`/orders/${id}`} className="w-fit text-small font-medium text-text-muted hover:text-text hover:underline">
      {t("campaignDetail.openOrder")}
    </Link>
  );
}

function Section({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h3 className="text-small font-medium text-text-muted">{title}</h3>
      {children}
    </section>
  );
}

/** The order's next step for the brand, as a bar under the card header. */
function OrderAction({ order, productName }: { order: OrderCardView; productName: string }) {
  const { t, tp } = useI18n();
  const title = t(`flow.action.${order.action!}`, { name: order.name, product: productName });

  return (
    <div className="flex flex-col gap-3 border-t border-warning/30 bg-warning-soft px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-start gap-2 text-small">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            <span className="block font-medium">{title}</span>
            {order.actionDays !== undefined && <span className="block text-caption text-text-muted">{tp("flow.waitingDays", order.actionDays)}</span>}
          </span>
        </span>
        {order.action === "review" && (
          <Link href={`/orders/${order.id}`} className={buttonClass("primary", "h-9 md:h-9")}>
            {t("flow.button.review")}
          </Link>
        )}
        {order.action === "collect" && (
          <form action={markOrderReturned.bind(null, order.id)}>
            <Button type="submit" variant="primary" className="h-9 md:h-9">
              {t("flow.button.collect")}
            </Button>
          </form>
        )}
        {order.action === "ship" && <ShipButton orderId={order.id} name={order.name} productName={productName} />}
      </div>
      {order.action === "ship" && order.shipTo && <ShipToLines to={order.shipTo} className="ps-6" />}
    </div>
  );
}

/** Where the creator asked for the product: the address they chose when accepting, with their phone. */
export function ShipToLines({ to, className }: { to: ShipTo; className?: string }) {
  const { t } = useI18n();
  const map = to.latitude !== undefined && to.longitude !== undefined ? `https://www.google.com/maps?q=${to.latitude},${to.longitude}` : undefined;
  return (
    <div className={cn("flex flex-col gap-0.5 text-small", className)}>
      <span className="flex items-center gap-1.5 font-medium">
        <MapPin aria-hidden className="size-4 shrink-0 text-text-muted" />
        {t("campaignDetail.shipTo")} · {to.label ?? t(`campaignDetail.addressTypes.${to.type}`)}
      </span>
      <span dir="auto" className="whitespace-pre-line">{to.address}</span>
      {to.phone && (
        <span className="text-text-muted">
          {t("campaignDetail.shipToPhone", { phone: "" })}
          <bdi dir="ltr">{to.phone}</bdi>
        </span>
      )}
      {map && (
        <a href={map} target="_blank" rel="noreferrer" className="w-fit font-medium text-primary hover:underline">
          {t("campaignDetail.openMap")}
        </a>
      )}
    </div>
  );
}

/** 1–5 stars; saved straight away. */
export function Stars({ orderId, value, label }: { orderId: string; value?: number; label: string }) {
  const [rating, setRating] = useState(value ?? 0);
  const [, startTransition] = useTransition();
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={rating === n}
          aria-label={String(n)}
          onClick={() => {
            setRating(n);
            startTransition(() => rateOrder(orderId, n));
          }}
          className="grid size-9 place-items-center rounded-full hover:bg-surface"
        >
          <Star aria-hidden className={cn("size-6", n <= rating ? "fill-warning text-warning" : "text-border")} />
        </button>
      ))}
    </div>
  );
}

/** Window event that opens an order card on the campaign page and scrolls to it. */
export const OPEN_ORDER_EVENT = "campaign:open-order";

/** The banner's button: opens the first order that needs this action (on phones, on the orders tab). */
export function OpenOrderButton({ orderId, label }: { orderId: string; label: string }) {
  return (
    <Button variant="primary" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_ORDER_EVENT, { detail: orderId }))} className="h-9 shrink-0 md:h-9">
      {label}
    </Button>
  );
}

/**
 * "I sent the product": a confirmation dialog, with an optional line on how it's being delivered
 * (no tracking number needed). The creator then confirms they received it.
 */
export function ShipButton({ orderId, name, productName }: { orderId: string; name: string; productName: string }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const titleId = `ship-${orderId}`;
  return (
    <>
      <Button variant="primary" onClick={() => dialog.current?.showModal()} className="h-9 shrink-0 md:h-9">
        {t("flow.button.ship")}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-xl)] border border-border bg-card p-0 text-text shadow-lift backdrop:bg-[var(--overlay)]"
      >
        <form
          action={(data) =>
            startTransition(async () => {
              await markOrderSent(orderId, data);
              dialog.current?.close();
            })
          }
          className="flex flex-col gap-5 p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-surface">
              <Truck className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-h3 font-medium">
                {t("flow.shipDialog.title", { name })}
              </h2>
              <p className="text-small text-text-muted">{t("flow.shipDialog.hint", { name, product: productName })}</p>
            </div>
          </div>
          <Field label={t("flow.shipDialog.note")} htmlFor={`${titleId}-note`}>
            <Input id={`${titleId}-note`} name="note" maxLength={200} placeholder={t("campaignDetail.sendNotePlaceholder")} />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => dialog.current?.close()}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" aria-busy={pending}>
              <Truck aria-hidden />
              {t("flow.shipDialog.confirm")}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
