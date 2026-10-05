"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, ChevronDown, CircleAlert, Clapperboard, Clock, MessageCircle, Star } from "lucide-react";
import { markOrderReturned, markOrderSent, rateOrder } from "@/app/actions/brand";
import { messageCreator } from "@/app/actions/messages";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ReviewActions } from "@/components/brand/orders/ReviewActions";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, orderTone } from "@/components/ui/Badge";
import { Button, buttonClass, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { Input } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import { createFormatters } from "@/lib/i18n/format";
import type { OrderCardView } from "./campaignView";

/**
 * One creator in the campaign: who, what, price and status with a step bar, plus the next thing to do.
 * Opens inline to show messages, shipping, the clip, payment, and rating once it's done.
 */
export function OrderCard({ order, productName }: { order: OrderCardView; productName: string }) {
  const { t, tp, locale } = useI18n();
  const f = createFormatters(locale);
  const [open, setOpen] = useState(false);
  const panelId = `order-${order.id}`;
  const stepIndex = order.steps.indexOf(order.step);
  const next = order.status === "approved" ? undefined : order.steps[stepIndex + 1];
  const cancelled = order.status === "cancelled";

  return (
    <Card className={cn("relative overflow-hidden", order.late && "border-error/40")}>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)} className="flex w-full flex-col gap-3 p-4 text-start transition-colors hover:bg-surface/50 sm:p-5">
        <span className="flex w-full items-center gap-3">
          <Avatar id={order.creatorId} name={order.name} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{order.name}</span>
            <span className="block truncate text-small text-text-muted">{order.itemsLabel}</span>
          </span>
          <Badge tone={orderTone[order.status]} className="shrink-0">
            {t(`status.order.${order.status}`)}
          </Badge>
          {/* Room for the messages button, which sits on top of the header (a button can't hold a form). */}
          <span aria-hidden className="size-10 shrink-0" />
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
                <span className="font-medium">{t("flow.stepLabel", { n: stepIndex + 1, total: order.steps.length, step: t(`flow.steps.${order.step}`) })}</span>
                {next && (
                  <span className="text-text-muted">
                    {" · "}
                    {t("flow.next", { step: t(`flow.steps.${next}`) })}
                  </span>
                )}
              </span>
              {order.late && (
                <span className="flex items-center gap-1 font-medium text-error">
                  <CircleAlert aria-hidden className="size-4" />
                  {t("flow.late")}
                </span>
              )}
            </span>
          </span>
        )}
      </button>

      {/* Chat with this creator: opens the existing conversation, or starts one. */}
      <form action={messageCreator.bind(null, order.creatorId, order.brandId)} className="absolute end-12 top-4 sm:end-[52px] sm:top-5">
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
      </form>

      {/* The next step stays visible whether the card is open or not. */}
      {order.action && <OrderAction order={order} productName={productName} />}

      <div id={panelId} hidden={!open} className="border-t border-border">
        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
          {!cancelled && (
            <Section title={t("flow.stepsTitle")}>
              <ol className="flex flex-col gap-1.5 text-small">
                {order.steps.map((s, i) => {
                  const done = i < stepIndex || order.status === "approved";
                  const current = i === stepIndex && order.status !== "approved";
                  return (
                    <li key={s} aria-current={current ? "step" : undefined} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-medium",
                          done && "border-primary bg-primary text-on-primary",
                          current && "border-primary",
                          !done && !current && "border-border text-text-muted",
                        )}
                      >
                        {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={current ? "font-medium" : done ? "" : "text-text-muted"}>{t(`flow.steps.${s}`)}</span>
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}
          <Section title={t("campaignDetail.clip")}>
            {order.clip && (order.status === "delivered" || order.status === "approved" || order.status === "submitted" || order.revisionRequested) ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-end gap-3">
                  <Link href={`/orders/${order.id}`} className="block w-28 shrink-0" aria-label={t("campaignDetail.openOrder")}>
                    <ClipPoster clip={order.clip} views={f.compact(order.clip.views)} duration={f.duration(order.clip.durationSec)} compact />
                  </Link>
                  <div className="flex min-w-0 flex-col gap-1.5 text-small">
                    <span className="font-medium">{t("campaignDetail.version", { n: order.revisionRequested && order.status !== "in_progress" ? 2 : 1 })}</span>
                    {order.revisionRequested && order.status === "in_progress" && <Badge tone="warning">{t("brandHome.revisionRequested")}</Badge>}
                    <Link href={`/orders/${order.id}`} className={buttonClass("secondary", "h-9 w-fit md:h-9")}>
                      {t("campaignDetail.openOrder")}
                    </Link>
                  </div>
                </div>
                {order.status === "delivered" && <ReviewActions orderId={order.id} />}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-small text-text-muted">
                <Clapperboard aria-hidden className="size-4" />
                {t("campaignDetail.noClip")}
              </p>
            )}
          </Section>

          {order.status === "approved" && (
            <Section className="sm:col-span-2" title={order.rating ? t("campaignDetail.rated", { name: order.name }) : t("campaignDetail.rate", { name: order.name })}>
              <Stars orderId={order.id} value={order.rating} label={t("campaignDetail.rate", { name: order.name })} />
              <LinkButton href={`/creators/${order.creatorId}`} variant="secondary" className="w-fit">
                {t("campaignDetail.hireAgain")}
              </LinkButton>
            </Section>
          )}
        </div>
      </div>
    </Card>
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
  const [noting, setNoting] = useState(false);
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
        {order.action === "ship" && !noting && (
          <Button variant="primary" onClick={() => setNoting(true)} className="h-9 md:h-9">
            {t("flow.button.ship")}
          </Button>
        )}
      </div>
      {order.action === "ship" && noting && (
        <form action={markOrderSent.bind(null, order.id)} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input name="note" maxLength={200} aria-label={t("campaignDetail.sendNote")} placeholder={t("campaignDetail.sendNotePlaceholder")} className="flex-1 bg-card" />
          <Button type="submit" variant="primary" className="shrink-0">
            {t("flow.button.ship")}
          </Button>
        </form>
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

/** The one-tap version of an order's next step, for the banner at the top of the campaign. */
export function NextActionButton({ orderId, action }: { orderId: string; action: NonNullable<OrderCardView["action"]> }) {
  const { t } = useI18n();
  if (action === "review")
    return (
      <Link href={`/orders/${orderId}`} className={buttonClass("primary", "h-9 shrink-0 md:h-9")}>
        {t("flow.button.review")}
      </Link>
    );
  return (
    <form action={action === "ship" ? markOrderSent.bind(null, orderId) : markOrderReturned.bind(null, orderId)} className="shrink-0">
      <Button type="submit" variant="primary" className="h-9 md:h-9">
        {t(`flow.button.${action}`)}
      </Button>
    </form>
  );
}
