import type { Campaign, Localized, Order, OrderStatus } from "@/lib/data/types";

/*
 * Every status a brand sees, in one place: the label in both languages and its colour.
 * Two levels: one status per creator order, and one per campaign, worked out from its orders.
 * Shown with <StatusBadge>. Colours are tokens (app/globals.css), so they follow the theme.
 */

export type StatusTone = "gray" | "amber" | "green" | "red" | "brand";
export type StatusDef = { label: Localized; tone: StatusTone };

/* ---------- Creator order ---------- */

export type OrderBadgeStatus = "pending" | "in_progress" | "ready" | "revision" | "approved" | "declined" | "expired" | "cancelled";

export const ORDER_STATUS: Record<OrderBadgeStatus, StatusDef> = {
  // Offer sent, waiting for the creator to accept.
  pending: { label: { en: "Pending", ar: "بانتظار القبول" }, tone: "amber" },
  // Accepted, product received, filming.
  in_progress: { label: { en: "In progress", ar: "قيد التنفيذ" }, tone: "green" },
  // The clip is in and the brand reviews it. (No 100clips check in the MVP.)
  ready: { label: { en: "Ready for review", ar: "جاهز لمراجعتك" }, tone: "amber" },
  revision: { label: { en: "Revision requested", ar: "مطلوب تعديل" }, tone: "amber" },
  approved: { label: { en: "Approved", ar: "معتمد" }, tone: "green" },
  declined: { label: { en: "Declined", ar: "مرفوض" }, tone: "red" },
  // Nobody answered within 96 hours; the money came back. Same words as the creator app.
  expired: { label: { en: "Expired", ar: "انتهى العرض" }, tone: "gray" },
  cancelled: { label: { en: "Cancelled", ar: "ملغي" }, tone: "gray" },
};

export function orderBadgeStatus(order: Pick<Order, "status" | "revisionRequested" | "declineReason">): OrderBadgeStatus {
  switch (order.status) {
    case "declined":
      return order.declineReason === "expired" ? "expired" : "declined";
    case "in_progress":
      return order.revisionRequested ? "revision" : "in_progress";
    case "delivered":
      return "ready";
    default:
      return order.status;
  }
}

/** The badge for a stored order status, e.g. a filter tab ("delivered" reads "Ready for review"). */
export const statusOfOrderStatus = (status: OrderStatus): OrderBadgeStatus => orderBadgeStatus({ status });

/** Declined and cancelled orders no longer count towards a campaign. */
export const isActiveOrder = (order: Pick<Order, "status">) => order.status !== "declined" && order.status !== "cancelled";

/* ---------- Campaign ---------- */

/** "draft": saved from New campaign, not paid or sent yet. */
export type CampaignBadgeStatus = "draft" | "pending" | "in_progress" | "completed" | "cancelled";
export const CAMPAIGN_STATUSES: CampaignBadgeStatus[] = ["draft", "pending", "in_progress", "completed", "cancelled"];

export const CAMPAIGN_STATUS: Record<CampaignBadgeStatus, StatusDef> = {
  draft: { label: { en: "Draft", ar: "مسودة" }, tone: "gray" },
  pending: { label: { en: "Pending", ar: "بانتظار القبول" }, tone: "amber" },
  in_progress: { label: { en: "In progress", ar: "قيد التنفيذ" }, tone: "green" },
  completed: { label: { en: "Completed", ar: "مكتمل" }, tone: "brand" },
  cancelled: { label: { en: "Cancelled", ar: "ملغي" }, tone: "gray" },
};

export type CampaignProgress = {
  status: CampaignBadgeStatus;
  /** Approved clips, out of `active` (orders that aren't declined or cancelled). */
  approved: number;
  active: number;
  /** Orders whose clip is ready for the brand to review. */
  toReview: number;
};

/**
 * A campaign's status comes from its orders and is never set by hand (only cancelling is).
 * Declined and cancelled orders are ignored, unless every order is one of them.
 */
export function campaignProgress(campaign: Pick<Campaign, "id" | "status">, orders: Order[]): CampaignProgress {
  const its = orders.filter((o) => o.campaignId === campaign.id);
  const active = its.filter(isActiveOrder);
  const approved = active.filter((o) => o.status === "approved").length;
  const toReview = active.filter((o) => o.status === "delivered").length;
  const status: CampaignBadgeStatus =
    campaign.status === "draft"
      ? "draft"
      : campaign.status === "cancelled" || (its.length > 0 && active.length === 0)
      ? "cancelled"
      : active.length > 0 && approved === active.length
        ? "completed"
        : active.every((o) => o.status === "pending")
          ? "pending"
          : "in_progress";
  return { status, approved, active: active.length, toReview };
}
