import type { Workspace } from "@/lib/data/live";
import type { Campaign, Order } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import { actionWaitingDays, nextAction } from "@/lib/orderFlow";
import { campaignProgress } from "@/lib/statuses";

/*
 * What the dashboard shows: how the brand's clips are doing, and what needs the brand now.
 * Uses the same rules as the order and campaign pages (lib/orderFlow.ts).
 */

/** Whether the order's product is physical, and whether it comes back after filming. */
export function productFlow(order: Order, ws: Pick<Workspace, "campaign" | "product">) {
  const campaign = ws.campaign(order.campaignId);
  const product = campaign ? ws.product(campaign.productIds?.[0]) : undefined;
  const logistics = product && campaign ? campaign.logistics?.[product.id] : undefined;
  return {
    physical: product?.details.type === "physical",
    returns: logistics?.type === "physical" && logistics.after === "return",
  };
}

export type Attention =
  /** Clips delivered and waiting for the brand. `waitingDays` is the oldest one's wait. */
  | { kind: "review"; orders: Order[]; waitingDays: number }
  | { kind: "ship"; orders: Order[]; waitingDays: number }
  | { kind: "collect"; orders: Order[]; waitingDays: number }
  /** Creators who said no on a campaign that's still running: invite someone else. */
  | { kind: "declined"; orders: Order[]; campaign: Campaign };

/** One entry per kind of thing the brand has to do, most urgent first. */
export function needsYou(orders: Order[], today: string, ws: Pick<Workspace, "campaign" | "product">): Attention[] {
  const out: Attention[] = [];
  for (const kind of ["review", "ship", "collect"] as const) {
    const these = orders
      .filter((o) => nextAction(o, productFlow(o, ws)) === kind)
      .map((o) => ({ order: o, days: actionWaitingDays(o, kind, today) }))
      .sort((a, b) => b.days - a.days);
    if (these.length > 0) out.push({ kind, orders: these.map((t) => t.order), waitingDays: these[0].days });
  }

  // Declines on campaigns that are still running (a cancelled or finished campaign needs nothing).
  const byCampaign = new Map<string, Order[]>();
  for (const o of orders) {
    if (o.status !== "declined" || !o.campaignId) continue;
    byCampaign.set(o.campaignId, [...(byCampaign.get(o.campaignId) ?? []), o]);
  }
  for (const [id, declined] of byCampaign) {
    const campaign = ws.campaign(id);
    if (!campaign) continue;
    const status = campaignProgress(campaign, orders).status;
    if (status === "pending" || status === "in_progress") out.push({ kind: "declined", orders: declined, campaign });
  }
  return out;
}

export type Results = {
  approvedClips: number;
  /** Different creators behind the approved clips. */
  creators: number;
  /** Paid for but not approved yet: offers waiting, clips being made or waiting for review. */
  onTheWay: number;
  /** Of those, clips delivered and waiting for the brand. */
  toReview: number;
  /** In BHD, service fee included: what approved clips cost, and what's held for the ones on the way. */
  spent: number;
  held: number;
  /**
   * In BHD, service fee included: paid this calendar month (and last month, to compare) for offers that
   * are still going or done. Withdrawn, declined and expired ones don't count: that money came back.
   */
  spentThisMonth: number;
  spentLastMonth: number;
};

/** "2026-10-03" → "2026-09". */
function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function results(orders: Order[], today: string): Results {
  const approved = orders.filter((o) => o.status === "approved");
  const onTheWay = orders.filter((o) => o.status === "pending" || o.status === "in_progress" || o.status === "delivered");
  const kept = orders.filter((o) => o.status !== "declined" && o.status !== "cancelled");
  const paidIn = (month: string) => kept.filter((o) => o.createdAt.startsWith(month)).reduce((sum, o) => sum + brandPaid(o), 0);
  const thisMonth = today.slice(0, 7);
  return {
    approvedClips: approved.length,
    creators: new Set(approved.map((o) => o.creatorId)).size,
    onTheWay: onTheWay.length,
    toReview: onTheWay.filter((o) => o.status === "delivered").length,
    spent: approved.reduce((sum, o) => sum + brandPaid(o), 0),
    held: onTheWay.reduce((sum, o) => sum + brandPaid(o), 0),
    spentThisMonth: paidIn(thisMonth),
    spentLastMonth: paidIn(previousMonth(thisMonth)),
  };
}
