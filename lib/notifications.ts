import type { Workspace } from "@/lib/data/live";
import type { Order } from "@/lib/data/types";
import { eventsOf, isLate } from "@/lib/orderFlow";

/*
 * The brand's notifications: what creators did on its orders, newest first. Built from each order's
 * activity history (lib/orderFlow.ts eventsOf), so nothing extra is stored but when they were last read.
 * Things the brand did itself (sending offers, approving, shipping) aren't notifications.
 */

/** What happened on an order. */
export type OrderNotificationKind = "accepted" | "declined" | "expired" | "received" | "clipReady" | "newVersion" | "adCode" | "late";
/** Plus a card payment of the brand's that didn't go through. */
export type NotificationKind = OrderNotificationKind | "paymentFailed";

export type BrandNotification = {
  key: string;
  kind: OrderNotificationKind;
  /** ISO date or date-time. */
  at: string;
  orderId: string;
  creatorId: string;
};

export function brandNotifications(orders: Order[], today: string, ws: Pick<Workspace, "campaign" | "creator">): BrandNotification[] {
  const out: BrandNotification[] = [];
  for (const order of orders) {
    const events = [...eventsOf(order)].reverse(); // oldest first, to tell a first upload from a new version
    let uploads = 0;
    for (const [i, e] of events.entries()) {
      const kind: OrderNotificationKind | undefined =
        e.type === "accepted"
          ? "accepted"
          : e.type === "declined"
            ? "declined"
            : e.type === "expired"
              ? "expired"
            : e.type === "received"
              ? "received"
              : e.type === "uploaded"
                ? uploads++ === 0
                  ? "clipReady"
                  : "newVersion"
                : undefined;
      if (kind) out.push({ key: `${order.id}-${i}`, kind, at: e.at, orderId: order.id, creatorId: order.creatorId });
    }
    // The ad code comes with the clip: no event of its own, so it takes the latest upload's time.
    const lastUpload = events.findLast((e) => e.type === "uploaded");
    if (order.adCode && lastUpload) out.push({ key: `${order.id}-ad`, kind: "adCode", at: lastUpload.at, orderId: order.id, creatorId: order.creatorId });
    // Past the deadline with no clip yet: dated the day after the deadline.
    const deadline = order.deadline ?? ws.campaign(order.campaignId)?.deadline;
    if (deadline && isLate(order, deadline, today)) out.push({ key: `${order.id}-late`, kind: "late", at: nextDay(deadline), orderId: order.id, creatorId: order.creatorId });
  }
  return out.filter((n) => ws.creator(n.creatorId)).sort((a, b) => b.at.localeCompare(a.at));
}

/** Notifications newer than the last time the brand marked them read. */
export const isUnread = (n: BrandNotification, seenAt: string) => n.at > seenAt;

function nextDay(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
