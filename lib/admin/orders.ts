import { cache } from "react";
import { apiOrNothing } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { everything, toOrder } from "@/lib/data/live";
import { publicUrl } from "@/lib/data/storage";
import type { Localized, Order } from "@/lib/data/types";
import { isLate } from "@/lib/orderFlow";
import { platformOrders } from "./data";

/*
 * Orders as the admin sees them: across every brand (GET /orders gives admins all of them), with who
 * has to act next. 100clips never reviews clips (no 100clips review in the MVP); the admin only
 * unblocks: moves a deadline, or cancels and refunds the brand's balance (app/actions/admin.ts).
 */

type OrderRow = components["schemas"]["Order"];

/** An order with the names the admin pages show. */
export type AdminOrder = {
  order: Order;
  brand: { name: Localized; logo?: string };
  creator: { name: Localized; handle: string; photo?: string };
  campaignTitle: Localized;
  /** A physical product: shipped to the creator. */
  physical: boolean;
  /** The creator sends the product back after the clip. */
  returns: boolean;
  /** The deadline before an admin last moved it ("" when there was none). */
  movedFrom?: string;
};

const names = (ar: string | null | undefined, en: string | null | undefined): Localized => ({ ar: ar || en || "", en: en || ar || "" });

function toAdminOrder(row: OrderRow): AdminOrder {
  const moved = row.events.findLast((e) => e.type === "deadline_moved");
  const from = (moved?.data as { from?: string | null } | undefined)?.from;
  return {
    order: toOrder(row),
    brand: { name: names(row.brand.name_ar, row.brand.name_en), logo: publicUrl(row.brand.logo_path) },
    // A deleted creator has no row any more.
    creator: { name: names(row.creator?.name_ar, row.creator?.name_en), handle: row.creator?.handle ?? "", photo: publicUrl(row.creator?.photo_path) },
    campaignTitle: names(row.campaign.title, row.campaign.title),
    physical: row.campaign.product_type === "physical",
    returns: row.campaign.product_returns,
    movedFrom: moved ? (from ?? "") : undefined,
  };
}

/** Every order, newest first. Once per request. */
export const adminOrders = cache(async (): Promise<AdminOrder[]> => (await everything<OrderRow>("/orders")).map(toAdminOrder));

export async function adminOrder(id: string): Promise<AdminOrder | undefined> {
  const row = await apiOrNothing<OrderRow>(`/orders/${encodeURIComponent(id)}`);
  return row && toAdminOrder(row);
}

/** A demo order, for the pages still on demo data (problem reports). */
export function getPlatformOrder(id: string): Order | undefined {
  return platformOrders().find((o) => o.id === id);
}

export type WaitingOn =
  | { who: "creator"; what: "accept" | "receive" | "film" | "revise" }
  | { who: "brand"; what: "ship" | "review" | "collect" }
  | { who: "admin"; what: "refundExpired" | "transfer" }
  | { who: "nobody"; what: "done" | "closed" };

/**
 * Who has to act next on this order, and what. Offers nobody answers run out on their own (the API's
 * timed jobs refund the brand). Transfers to creators aren't on the API yet: an approved order is done.
 */
export function waitingOn({ order: o, physical, returns }: Pick<AdminOrder, "order" | "physical" | "returns">): WaitingOn {
  switch (o.status) {
    case "pending":
      return { who: "creator", what: "accept" };
    case "in_progress":
      if (physical && !o.shipping?.sentAt) return { who: "brand", what: "ship" };
      if (physical && !o.shipping?.receivedAt) return { who: "creator", what: "receive" };
      return { who: "creator", what: o.revisionRequested ? "revise" : "film" };
    case "delivered":
      return { who: "brand", what: "review" };
    case "approved":
      if (returns && !o.shipping?.returnedAt) return { who: "brand", what: "collect" };
      return { who: "nobody", what: "done" };
    default:
      return { who: "nobody", what: "closed" };
  }
}

export const ORDER_FILTERS = ["all", "late", "brandReview", "running", "done", "closed"] as const;
export type OrderFilter = (typeof ORDER_FILTERS)[number];
export const isOrderFilter = (v: unknown): v is OrderFilter => ORDER_FILTERS.includes(v as OrderFilter);

export type AdminOrderRow = AdminOrder & { deadline?: string; late: boolean; waiting: WaitingOn };

/** Every order with what the list shows, newest first. */
export async function adminOrderRows(today: string): Promise<AdminOrderRow[]> {
  return (await adminOrders()).map((a) => ({ ...a, deadline: a.order.deadline, late: isLate(a.order, a.order.deadline, today), waiting: waitingOn(a) }));
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
    case "running":
      return running(row.order);
    case "done":
      return row.order.status === "approved";
    case "closed":
      return row.order.status === "declined" || row.order.status === "cancelled";
  }
}

/** Search by order number, campaign, brand or creator, in either language. */
export function matchesSearch(row: AdminOrderRow, q: string): boolean {
  if (!q) return true;
  const o = row.order;
  const haystack = [o.id, o.number && `#${o.number}`, o.number, row.campaignTitle.ar, row.campaignTitle.en, row.brand.name.ar, row.brand.name.en, row.creator.name.ar, row.creator.name.en, row.creator.handle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

/** Not approved, declined or cancelled yet: it can still be cancelled. */
export const canCancel = (o: Order) => running(o);

/** The clip is still owed: the deadline can move. */
export const canMoveDeadline = (o: Order) => o.status === "pending" || o.status === "in_progress";

/** "#1043", or the id for an order without a number. */
export const orderRef = (o: Order) => (o.number ? `#${o.number}` : o.id);
