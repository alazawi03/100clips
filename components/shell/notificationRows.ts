import { DEMO_TODAY } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { getCreator } from "@/lib/data/creators";
import { getOrder, orders } from "@/lib/data/orders";
import { getNotificationsSeenAt } from "@/lib/data/store";
import type { I18n } from "@/lib/i18n/server";
import { brandNotifications, isUnread, type NotificationKind } from "@/lib/notifications";
import { brandPaid } from "@/lib/fees";
import { daysUntil } from "@/lib/orderFlow";

export type NotificationSection = "today" | "yesterday" | "thisWeek" | "earlier";

/**
 * A notification ready to show, laid out like the creator app's: what happened (title), on which
 * campaign and with what (detail), when, its section, where it leads, and whether it's new.
 */
export type NotificationRow = {
  key: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string;
  section: NotificationSection;
  href: string;
  unread: boolean;
  creatorId: string;
  creatorName: string;
};

function sectionOf(at: string): NotificationSection {
  const days = -daysUntil(at.slice(0, 10), DEMO_TODAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 7 ? "thisWeek" : "earlier";
}

/** The brand's notifications as rows, newest first (all of them, or the latest `limit`). */
export function notificationRows({ t, f }: I18n, limit?: number): { rows: NotificationRow[]; unread: number } {
  const seenAt = getNotificationsSeenAt();
  const all = brandNotifications(orders, DEMO_TODAY);
  const rows = all.slice(0, limit ?? all.length).map((n) => {
    const creator = getCreator(n.creatorId)!;
    const order = getOrder(n.orderId)!;
    const name = f.pick(creator.name);
    const campaign = f.pick(order.title);
    const format = t(`formats.${order.items[0].format}`);
    const detail = {
      accepted: `${campaign} · ${format} · ${f.money(brandPaid(order))}`,
      declined: t("notifications.details.declined", { campaign, amount: f.money(brandPaid(order)) }),
      expired: t("notifications.details.expired", { campaign, amount: f.money(brandPaid(order)) }),
      received: campaign,
      clipReady: `${campaign} · ${format}`,
      newVersion: t("notifications.details.newVersion", { campaign }),
      adCode: order.adCode ? `${campaign} · ${t(`adCode.title.${order.adCode.platform}`)}` : campaign,
      late: t("notifications.details.late", { campaign, date: f.date(getCampaign(order.campaignId!)?.deadline ?? n.at.slice(0, 10)) }),
    }[n.kind];
    return {
      key: n.key,
      kind: n.kind,
      title: t(`notifications.titles.${n.kind}.${creator.gender}`, { name }),
      detail,
      time: n.at.length > 10 ? f.messageTime(n.at, DEMO_TODAY) : f.date(n.at),
      section: sectionOf(n.at),
      href: `/orders/${n.orderId}`,
      unread: isUnread(n, seenAt),
      creatorId: creator.id,
      creatorName: name,
    };
  });
  return { rows, unread: all.filter((n) => isUnread(n, seenAt)).length };
}
