import type { Clip, ClipVersion, Order, OrderEvent, OrderEventType } from "@/lib/data/types";

/*
 * How an order moves, shared by the campaign page, the order page and the orders list.
 * Steps a brand sees: offer sent → accepted → product received (physical only) → filming →
 * ready for you → approved. (No 100clips check in the MVP: an upload goes straight to the brand.)
 */

export type OrderStep = "offered" | "accepted" | "received" | "filming" | "ready" | "approved";

export function stepsFor(physical: boolean): OrderStep[] {
  return physical ? ["offered", "accepted", "received", "filming", "ready", "approved"] : ["offered", "accepted", "filming", "ready", "approved"];
}

/** Where the order is now. A physical product has to be received before filming starts. */
export function currentStep(order: Order, physical: boolean): OrderStep {
  switch (order.status) {
    case "pending":
    case "declined":
    case "cancelled":
      return "offered";
    case "in_progress":
      return physical && !order.shipping?.receivedAt ? "accepted" : "filming";
    case "delivered":
      return "ready";
    case "approved":
      return "approved";
  }
}

/** Something only the brand can do to move this order on. */
export type NextAction = "review" | "ship" | "collect";

/**
 * The brand's next step on this order, if any: review a ready clip, ship the product once the creator
 * has accepted, or collect it back after approval when the creator returns it.
 */
export function nextAction(order: Order, { physical, returns }: { physical: boolean; returns: boolean }): NextAction | undefined {
  if (order.status === "delivered") return "review";
  if (physical && order.status === "in_progress" && !order.shipping?.sentAt) return "ship";
  if (physical && returns && order.status === "approved" && !order.shipping?.returnedAt) return "collect";
}

/** What started each brand action, to say how long it's been waiting. */
const ACTION_SINCE: Record<NextAction, OrderEventType> = { review: "uploaded", ship: "accepted", collect: "approved" };

/** Whole days the brand's next action has been waiting (0 = since today). */
export function actionWaitingDays(order: Order, action: NextAction, today: string): number {
  const since = eventsOf(order).find((e) => e.type === ACTION_SINCE[action])?.at ?? order.createdAt;
  return Math.max(0, -daysUntil(since.slice(0, 10), today));
}

/** What the order is waiting on when the brand has nothing to do. */
export type Waiting = "accept" | "receive" | "filming" | "revision" | "done" | "cancelled";

export function waitingFor(order: Order, physical: boolean): Waiting {
  if (order.status === "cancelled" || order.status === "declined") return "cancelled";
  if (order.status === "pending") return "accept";
  if (order.status === "in_progress") {
    if (physical && order.shipping?.sentAt && !order.shipping.receivedAt) return "receive";
    return order.revisionRequested ? "revision" : "filming";
  }
  return "done";
}

/** Past the deadline while the creator still owes the clip. */
export function isLate(order: Order, deadline: string | undefined, today: string): boolean {
  return !!deadline && today > deadline && (order.status === "pending" || order.status === "in_progress");
}

/* ---------- Offers run out ---------- */

/** Creators have this long to accept an offer (the creator app uses the same window). After it, the money comes back. */
export const OFFER_HOURS = 96;
const HOUR = 3_600_000;

/** When the offer runs out, in ms. */
const offerExpiresAt = (order: Pick<Order, "createdAt">) => Date.parse(order.createdAt) + OFFER_HOURS * HOUR;

/** Whole hours left to accept (rounded up, 0 once it has run out). */
export const offerHoursLeft = (order: Pick<Order, "createdAt">, now: string) => Math.max(0, Math.ceil((offerExpiresAt(order) - Date.parse(now)) / HOUR));

/** Show the countdown as urgent from this many hours left. */
export const OFFER_URGENT_HOURS = 24;

/* ---------- Clip versions ---------- */

/** Every version of the clip, oldest first: the stored ones, or just the current clip. */
export function clipVersions(order: Order, clip: Clip | undefined): ClipVersion[] {
  if (order.versions?.length) return order.versions;
  if (!clip) return [];
  const uploaded = eventsOf(order).find((e) => e.type === "uploaded")?.at ?? order.createdAt;
  return [{ videoSrc: clip.videoSrc, uploadedAt: uploaded }];
}

/** One revision is included; it's used once asked for (or once a second version exists). */
export const revisionUsed = (order: Order) => !!order.revisionRequested || (order.versions?.length ?? 0) > 1 || eventsOf(order).some((e) => e.type === "revisionRequested");

/* ---------- Dates ---------- */

/** `days` working days after `iso` (a date or date-time), skipping the Gulf weekend (Friday and Saturday). yyyy-mm-dd. */
export function addBusinessDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  for (let left = days; left > 0; ) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 5 && d.getUTCDay() !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

/** Whole days from `today` to `date` (negative when it has passed). */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** The order's history, newest first. */
export function eventsOf(order: Order): OrderEvent[] {
  return [...order.events].sort((a, b) => b.at.localeCompare(a.at));
}
