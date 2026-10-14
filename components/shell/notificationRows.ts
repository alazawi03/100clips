import { workspace } from "@/lib/data/live";
import type { I18n } from "@/lib/i18n/server";
import { brandNotifications, isUnread, type NotificationKind } from "@/lib/notifications";
import { brandPaid } from "@/lib/fees";
import { daysUntil } from "@/lib/orderFlow";
import { getMe } from "@/lib/session";
import { today } from "@/lib/today";

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

function sectionOf(at: string, day: string): NotificationSection {
  const days = -daysUntil(at.slice(0, 10), day);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 7 ? "thisWeek" : "earlier";
}

/** The brand's notifications as rows, newest first (all of them, or the latest `limit`). */
export async function notificationRows({ t, f }: I18n, limit?: number): Promise<{ rows: NotificationRow[]; unread: number }> {
  const [ws, me] = await Promise.all([workspace(), getMe()]);
  const day = today();
  // "Mark all as read" sets this; a new account has seen nothing yet.
  const seenAt = me?.account.notifications_seen_at ?? "";
  const all = brandNotifications(ws.orders, day, ws);
  const rows = all.slice(0, limit ?? all.length).map((n) => {
    const creator = ws.creator(n.creatorId)!;
    const order = ws.order(n.orderId)!;
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
      late: t("notifications.details.late", { campaign, date: f.date(order.deadline ?? ws.campaign(order.campaignId)?.deadline ?? n.at.slice(0, 10)) }),
    }[n.kind];
    return {
      key: n.key,
      kind: n.kind,
      title: t(`notifications.titles.${n.kind}.${creator.gender}`, { name }),
      detail,
      time: n.at.length > 10 ? f.messageTime(n.at, day) : f.date(n.at),
      section: sectionOf(n.at, day),
      href: `/orders/${n.orderId}`,
      unread: isUnread(n, seenAt),
      creatorId: creator.id,
      creatorName: name,
    };
  });
  return { rows, unread: all.filter((n) => isUnread(n, seenAt)).length };
}
