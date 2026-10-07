import type { Order, OrderEvent, OrderEventType } from "@/lib/data/types";

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
  if (order.status === "cancelled") return "cancelled";
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

/** Whole days from `today` to `date` (negative when it has passed). */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * The order's history, newest first. Demo orders made before the activity log existed get a
 * plausible history derived from their status and dates.
 */
export function eventsOf(order: Order): OrderEvent[] {
  if (order.events) return [...order.events].sort((a, b) => b.at.localeCompare(a.at));
  const at = order.createdAt;
  const derived: Array<[OrderEventType, string] | false> = [
    ["offered", at],
    order.status === "cancelled" && ["cancelled", addDays(at, 1)],
    order.status !== "pending" && order.status !== "cancelled" && ["accepted", addDays(at, 1)],
    !!order.shipping?.sentAt && ["sent", order.shipping.sentAt],
    !!order.shipping?.receivedAt && ["received", order.shipping.receivedAt],
    (order.status === "delivered" || order.status === "approved" || order.revisionRequested === true) && ["uploaded", addDays(at, 5)],
    order.revisionRequested === true && ["revisionRequested", addDays(at, 6)],
    order.status === "approved" && ["approved", addDays(at, 8)],
    order.status === "approved" && ["released", addDays(at, 8)],
    !!order.shipping?.returnedAt && ["returned", order.shipping.returnedAt],
  ];
  return derived
    .filter((e): e is [OrderEventType, string] => !!e)
    .map(([type, when]) => ({ type, at: when }))
    .sort((a, b) => b.at.localeCompare(a.at));
}
