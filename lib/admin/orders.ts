import { account, brands as accountBrands, DEMO_NOW, products } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { getCreator } from "@/lib/data/creators";
import type { Order } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import { eventsOf, isLate, isOfferExpired } from "@/lib/orderFlow";
import { deadlineOf, deadlineOverrides, logAction, otherBalances, payouts, platformOrders } from "./data";
import { platformBrand, stuckOrders, type StuckOrder } from "./money";

/*
 * Orders as the admin sees them: across every brand, with who has to act next. 100clips never reviews
 * clips (no 100clips review in the MVP); the admin only unblocks: extends a deadline, or cancels and
 * refunds the brand's balance.
 */

export function getPlatformOrder(id: string): Order | undefined {
  return platformOrders().find((o) => o.id === id);
}

/** Physical product: from the campaign's product, or because something was shipped. */
function isPhysical(o: Order): boolean {
  const campaign = o.campaignId ? getCampaign(o.campaignId) : undefined;
  const product = campaign ? products.find((p) => p.id === campaign.productIds?.[0]) : undefined;
  return product?.details.type === "physical" || !!o.shipping?.sentAt;
}

function returnsProduct(o: Order): boolean {
  const campaign = o.campaignId ? getCampaign(o.campaignId) : undefined;
  const id = campaign?.productIds?.[0];
  const logistics = id ? campaign?.logistics?.[id] : undefined;
  return logistics?.type === "physical" && logistics.after === "return";
}

export type WaitingOn =
  | { who: "creator"; what: "accept" | "receive" | "film" | "revise" }
  | { who: "brand"; what: "ship" | "review" | "collect" }
  | { who: "admin"; what: "refundExpired" | "transfer" }
  | { who: "nobody"; what: "done" | "closed" };

/** Who has to act next on this order, and what. */
export function waitingOn(o: Order, paidOrderIds: Set<string>): WaitingOn {
  switch (o.status) {
    case "pending":
      // Past the offer window (OFFER_HOURS) with no answer: the brand is owed its money back.
      return isOfferExpired(o, DEMO_NOW) ? { who: "admin", what: "refundExpired" } : { who: "creator", what: "accept" };
    case "in_progress":
      if (isPhysical(o) && !o.shipping?.sentAt) return { who: "brand", what: "ship" };
      if (isPhysical(o) && !o.shipping?.receivedAt) return { who: "creator", what: "receive" };
      return { who: "creator", what: o.revisionRequested ? "revise" : "film" };
    case "delivered":
      return { who: "brand", what: "review" };
    case "approved":
      if (!paidOrderIds.has(o.id)) return { who: "admin", what: "transfer" };
      if (returnsProduct(o) && !o.shipping?.returnedAt) return { who: "brand", what: "collect" };
      return { who: "nobody", what: "done" };
    default:
      return { who: "nobody", what: "closed" };
  }
}

export const ORDER_FILTERS = ["all", "late", "brandReview", "stuck", "running", "done", "closed"] as const;
export type OrderFilter = (typeof ORDER_FILTERS)[number];
export const isOrderFilter = (v: unknown): v is OrderFilter => ORDER_FILTERS.includes(v as OrderFilter);

export type AdminOrderRow = { order: Order; deadline?: string; late: boolean; waiting: WaitingOn; stuck?: StuckOrder };

/** Every order with what the list shows, newest first. */
export function adminOrderRows(today: string): AdminOrderRow[] {
  const paid = new Set(payouts.flatMap((p) => p.orderIds));
  const stuck = new Map(stuckOrders(today).map((s) => [s.order.id, s]));
  return platformOrders()
    .map((order) => {
      const deadline = deadlineOf(order);
      return { order, deadline, late: isLate(order, deadline, today), waiting: waitingOn(order, paid), stuck: stuck.get(order.id) };
    })
    .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt) || b.order.id.localeCompare(a.order.id));
}

const running = (o: Order) => o.status === "pending" || o.status === "in_progress" || o.status === "delivered";

export function matchesFilter(row: AdminOrderRow, filter: OrderFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "late":
      return row.late;
    case "brandReview":
      return row.order.status === "delivered";
    case "stuck":
      return !!row.stuck;
    case "running":
      return running(row.order);
    case "done":
      return row.order.status === "approved";
    case "closed":
      return row.order.status === "declined" || row.order.status === "cancelled";
  }
}

/** Search by order number, title, campaign, brand or creator, in either language. */
export function matchesSearch(row: AdminOrderRow, q: string): boolean {
  if (!q) return true;
  const o = row.order;
  const campaign = o.campaignId ? getCampaign(o.campaignId) : undefined;
  const brand = platformBrand(o.brandId);
  const creator = getCreator(o.creatorId);
  const haystack = [o.id, o.title.ar, o.title.en, campaign?.title.ar, campaign?.title.en, brand?.name.ar, brand?.name.en, creator?.name.ar, creator?.name.en, creator?.handle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

/* ---------- Admin actions on an order ---------- */

/** Not approved, declined or cancelled yet: something can still be changed. */
export const canChange = (o: Order) => running(o);

/** The brand's balance gets the full amount back, service fee included. */
function refundToBalance(o: Order) {
  if (accountBrands.some((b) => b.id === o.brandId)) account.balance += brandPaid(o);
  else otherBalances[o.brandId] = (otherBalances[o.brandId] ?? 0) + brandPaid(o);
}

/** Cancels the order and refunds the brand's balance in full. Returns false if it can't be cancelled. */
export function cancelAndRefund(orderId: string, note: string): boolean {
  const o = getPlatformOrder(orderId);
  if (!o || !canChange(o)) return false;
  o.events ??= eventsOf(o);
  o.status = "cancelled";
  o.revisionRequested = false;
  o.events.push({ type: "cancelled", at: new Date().toISOString() });
  refundToBalance(o);
  logAction("orderCancelled", { kind: "order", id: o.id }, { note, detail: String(brandPaid(o)) });
  return true;
}

/** Moves this order's deadline later (never earlier). Returns false if it can't. */
export function extendOrderDeadline(orderId: string, to: string, today: string, note: string): boolean {
  const o = getPlatformOrder(orderId);
  const from = o ? deadlineOf(o) : undefined;
  if (!o || !canChange(o) || to <= today || (from && to <= from)) return false;
  deadlineOverrides[o.id] = { from, to };
  logAction("deadlineExtended", { kind: "order", id: o.id }, { note, detail: `${from ?? ""}|${to}` });
  return true;
}
