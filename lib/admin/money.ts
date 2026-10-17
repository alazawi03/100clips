import { brands as accountBrands } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { getCreator } from "@/lib/data/creators";
import { platformOf, type Brand, type Niche, type Order, type Platform } from "@/lib/data/types";
import { brandPaid, feeOf } from "@/lib/fees";
import { daysUntil, eventsOf, isOfferExpired } from "@/lib/orderFlow";
import { DEMO_NOW } from "@/lib/data/account";
import { approvedOn, BANK_CHANGE_WARN_DAYS, bankHistory, currentBank, deadlineOf, otherBrands, payouts, platformOrders, type BankChange } from "./data";

/*
 * The admin's money view, worked out from the orders and transfers (nothing stored twice):
 * - held:     brands paid, the clip isn't approved yet (pending, in progress, delivered). Still the brand's.
 * - owed:     approved, so the creator earned it, but 100clips hasn't transferred it yet.
 * - revenue:  the service fee on approved orders, counted on the day of approval.
 * Refunded orders (declined, cancelled) bring back the fee too, so they never count as revenue.
 */

export function platformBrands(): Brand[] {
  return [...accountBrands, ...otherBrands];
}

export function platformBrand(id: string): Brand | undefined {
  return platformBrands().find((b) => b.id === id);
}

const isRunning = (o: Order) => o.status === "pending" || o.status === "in_progress" || o.status === "delivered";
const sum = (list: Order[], of: (o: Order) => number) => Math.round(list.reduce((n, o) => n + of(o), 0) * 1000) / 1000;
const inRange = (day: string | undefined, from: string, to: string) => !!day && day >= from && day <= to;

/* ---------- Ranges ---------- */

export const RANGES = ["30d", "90d", "year", "all"] as const;
export type Range = (typeof RANGES)[number];
export const isRange = (v: unknown): v is Range => RANGES.includes(v as Range);

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The days a range covers (inclusive), and how its chart groups them. */
export function periodOf(range: Range, today: string): { from: string; to: string; unit: "week" | "month" } {
  switch (range) {
    case "30d":
      return { from: addDays(today, -29), to: today, unit: "week" };
    case "90d":
      return { from: addDays(today, -89), to: today, unit: "week" };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today, unit: "month" };
    case "all":
      return { from: platformOrders().reduce((min, o) => (o.createdAt < min ? o.createdAt : min), today), to: today, unit: "month" };
  }
}

/* ---------- Held and owed ---------- */

/** Paid by brands for clips not approved yet: the creators' part and the fee, both refundable. */
export function heldNow() {
  const running = platformOrders().filter(isRunning);
  return { orders: running.length, creatorPay: sum(running, (o) => o.amount), fees: sum(running, feeOf), total: sum(running, brandPaid) };
}

/** `bankChangedDays`: set when the creator changed their bank details recently, so the transfer gets a second look. */
export type OwedRow = { creatorId: string; orders: Order[]; amount: number; oldest: string; waitingDays: number; bank?: BankChange; bankChangedDays?: number };

/** Days since the creator changed (not first added) their bank details, if within the warning window. */
export function recentBankChange(creatorId: string, today: string): number | undefined {
  const history = bankHistory[creatorId] ?? [];
  if (history.length < 2) return undefined;
  const days = Math.max(0, -daysUntil(history.at(-1)!.at.slice(0, 10), today));
  return days <= BANK_CHANGE_WARN_DAYS ? days : undefined;
}

/** Per creator: approved orders not covered by a transfer yet. Longest wait first. */
export function owedToCreators(today: string): OwedRow[] {
  const paid = new Set(payouts.flatMap((p) => p.orderIds));
  const byCreator = new Map<string, Order[]>();
  for (const o of platformOrders()) {
    if (o.status !== "approved" || paid.has(o.id)) continue;
    byCreator.set(o.creatorId, [...(byCreator.get(o.creatorId) ?? []), o]);
  }
  return [...byCreator.entries()]
    .map(([creatorId, list]) => {
      const oldest = list.map((o) => approvedOn(o) ?? o.createdAt).sort()[0];
      return { creatorId, orders: list, amount: sum(list, (o) => o.amount), oldest, waitingDays: Math.max(0, -daysUntil(oldest, today)), bank: currentBank(creatorId), bankChangedDays: recentBankChange(creatorId, today) };
    })
    .sort((a, b) => a.oldest.localeCompare(b.oldest));
}

export function owedTotal(today: string) {
  const rows = owedToCreators(today);
  return { creators: rows.length, amount: Math.round(rows.reduce((n, r) => n + r.amount, 0) * 1000) / 1000 };
}

/* ---------- Revenue ---------- */

const approvedIn = (from: string, to: string) => platformOrders().filter((o) => o.status === "approved" && inRange(approvedOn(o), from, to));

/** The day a refunded order's money went back to the brand. */
function refundedOn(o: Order): string | undefined {
  if (o.status !== "declined" && o.status !== "cancelled") return undefined;
  return eventsOf(o).find((e) => e.type === o.status)?.at.slice(0, 10);
}

/** Totals for a period. `paid` is everything brands paid for orders made in it; `refunded` what went back. */
export function totals(from: string, to: string) {
  const approved = approvedIn(from, to);
  const all = platformOrders();
  const paid = sum(all.filter((o) => inRange(o.createdAt, from, to)), brandPaid);
  const refunded = sum(all.filter((o) => inRange(refundedOn(o), from, to)), brandPaid);
  return { revenue: sum(approved, feeOf), clips: approved.length, creatorPay: sum(approved, (o) => o.amount), paid, refunded, netPaid: Math.round((paid - refunded) * 1000) / 1000 };
}

/** Start of the week (Sunday) or month a day falls in. */
function bucketOf(day: string, unit: "week" | "month") {
  if (unit === "month") return `${day.slice(0, 7)}-01`;
  const d = new Date(`${day}T12:00:00Z`);
  return addDays(day, -d.getUTCDay());
}

/** Revenue per week or month across the period, empty buckets included so gaps show. */
export function revenueBuckets(from: string, to: string, unit: "week" | "month") {
  const buckets = new Map<string, { start: string; revenue: number; clips: number }>();
  for (let day = bucketOf(from, unit); day <= to; day = unit === "week" ? addDays(day, 7) : bucketOf(addDays(day, 32), "month")) {
    buckets.set(day, { start: day, revenue: 0, clips: 0 });
  }
  for (const o of approvedIn(from, to)) {
    const b = buckets.get(bucketOf(approvedOn(o)!, unit));
    if (!b) continue;
    b.revenue = Math.round((b.revenue + feeOf(o)) * 1000) / 1000;
    b.clips += 1;
  }
  return [...buckets.values()];
}

export const BREAKDOWNS = ["time", "brand", "creator", "platform", "niche"] as const;
export type Breakdown = (typeof BREAKDOWNS)[number];
export const isBreakdown = (v: unknown): v is Breakdown => BREAKDOWNS.includes(v as Breakdown);

/** A campaign order counts under the campaign's niche; a direct offer under the creator's first niche. */
export function nicheOf(o: Order): Niche {
  return (o.campaignId && getCampaign(o.campaignId)?.niche) || getCreator(o.creatorId)?.niches[0] || "general";
}

export type BreakdownRow = { key: string; clips: number; spend: number; creatorPay: number; fee: number };

/** Approved orders in the period grouped by brand, creator, platform or niche. Most revenue first. */
export function breakdown(by: Exclude<Breakdown, "time">, from: string, to: string): BreakdownRow[] {
  const keyOf: Record<typeof by, (o: Order) => string> = {
    brand: (o) => o.brandId,
    creator: (o) => o.creatorId,
    platform: (o): Platform => platformOf[o.items[0].format],
    niche: nicheOf,
  };
  const groups = new Map<string, Order[]>();
  for (const o of approvedIn(from, to)) groups.set(keyOf[by](o), [...(groups.get(keyOf[by](o)) ?? []), o]);
  return [...groups.entries()]
    .map(([key, list]) => ({ key, clips: list.length, spend: sum(list, brandPaid), creatorPay: sum(list, (o) => o.amount), fee: sum(list, feeOf) }))
    .sort((a, b) => b.fee - a.fee || a.key.localeCompare(b.key));
}

/* ---------- Transactions ---------- */

export type LedgerEntry =
  | { id: string; day: string; type: "payment" | "refund"; amount: number; order: Order }
  | { id: string; day: string; type: "payout"; amount: number; creatorId: string; bankRef: string; orders: number };

/** Money in from brands, refunds back to them, and transfers out to creators. Newest first. */
export function ledger(from: string, to: string): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  for (const o of platformOrders()) {
    if (inRange(o.createdAt, from, to)) entries.push({ id: `pay-${o.id}`, day: o.createdAt, type: "payment", amount: brandPaid(o), order: o });
    const refund = refundedOn(o);
    if (refund && inRange(refund, from, to)) entries.push({ id: `ref-${o.id}`, day: refund, type: "refund", amount: -brandPaid(o), order: o });
  }
  for (const p of payouts) {
    const day = p.paidAt.slice(0, 10);
    if (inRange(day, from, to)) entries.push({ id: p.id, day, type: "payout", amount: -p.amount, creatorId: p.creatorId, bankRef: p.bankRef, orders: p.orderIds.length });
  }
  return entries.sort((a, b) => b.day.localeCompare(a.day) || a.id.localeCompare(b.id));
}

/* ---------- Stuck orders ---------- */

/** Days something waits before the admin is told about it. */
export const STUCK_DAYS = 3;

export type StuckReason = "offerExpired" | "reviewWaiting" | "notReceived" | "late";
export type StuckOrder = { order: Order; reason: StuckReason; days: number };

/**
 * Orders nobody is moving: an offer past its 72 hours (the brand should get a refund), a clip the brand
 * hasn't reviewed, a product sent but not received, or a clip 3+ days past the campaign's deadline.
 */
export function stuckOrders(today: string): StuckOrder[] {
  const since = (o: Order, type: string) => {
    const at = eventsOf(o).find((e) => e.type === type)?.at;
    return at ? Math.max(0, -daysUntil(at.slice(0, 10), today)) : 0;
  };
  const stuck: StuckOrder[] = [];
  for (const o of platformOrders()) {
    const deadline = deadlineOf(o);
    if (isOfferExpired(o, DEMO_NOW)) stuck.push({ order: o, reason: "offerExpired", days: since(o, "offered") });
    else if (o.status === "delivered" && since(o, "uploaded") >= STUCK_DAYS) stuck.push({ order: o, reason: "reviewWaiting", days: since(o, "uploaded") });
    else if (o.status === "in_progress" && o.shipping?.sentAt && !o.shipping.receivedAt && since(o, "sent") >= STUCK_DAYS) stuck.push({ order: o, reason: "notReceived", days: since(o, "sent") });
    else if ((o.status === "pending" || o.status === "in_progress") && deadline && -daysUntil(deadline, today) >= STUCK_DAYS) stuck.push({ order: o, reason: "late", days: -daysUntil(deadline, today) });
  }
  return stuck.sort((a, b) => b.days - a.days);
}
