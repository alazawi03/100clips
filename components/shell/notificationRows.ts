import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { workspace } from "@/lib/data/live";
import { myWithdrawals } from "@/lib/data/wallet";
import { maskIban } from "@/lib/iban";
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
  /** The creator in the icon's corner; none for the brand's own payments. */
  creatorId?: string;
  creatorName?: string;
};

type Payment = components["schemas"]["Payment"];

function sectionOf(at: string, day: string): NotificationSection {
  const days = -daysUntil(at.slice(0, 10), day);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 7 ? "thisWeek" : "earlier";
}

/** The brand's notifications as rows, newest first (all of them, or the latest `limit`). */
export async function notificationRows({ t, f }: I18n, limit?: number): Promise<{ rows: NotificationRow[]; unread: number }> {
  const [ws, me, failed, withdrawals] = await Promise.all([
    workspace(),
    getMe(),
    api<Payment[]>("/me/payments?status=failed&limit=50").catch(() => []),
    myWithdrawals().catch(() => []),
  ]);
  const day = today();
  // "Mark all as read" sets this; a new account has seen nothing yet.
  const seenAt = me?.account.notifications_seen_at ?? "";
  const orderNotes = brandNotifications(ws.orders, day, ws);
  // A checkout's card payment that didn't go through: offers that never went out. Not top-ups: one not paid just
  // ends (Balance doesn't list it either), and a refused card already showed on Gate-E's page.
  const paymentNotes = failed
    .filter((p) => p.failed_at && p.kind !== "top_up")
    .map((p): NotificationRow & { at: string } => {
      const at = p.failed_at!;
      const campaign = ws.campaign(p.campaign_id ?? undefined);
      const amount = f.money(p.by_card);
      return {
        key: `payment-${p.id}`,
        kind: "paymentFailed",
        title: t("notifications.paymentFailed.title"),
        detail: t("notifications.paymentFailed.checkout", { amount, campaign: campaign ? f.pick(campaign.title) || t("newCampaign.untitled") : "" }),
        time: f.messageTime(at, day),
        section: sectionOf(at, day),
        href: !campaign ? "/balance" : campaign.status === "draft" ? `/campaigns/new?draft=${campaign.id}` : `/campaigns/${campaign.id}`,
        unread: at > seenAt,
        at,
      };
    });
  // A withdrawal 100clips sent to the bank, or turned down (the money came back).
  const withdrawalNotes = withdrawals.flatMap((w): (NotificationRow & { at: string })[] => {
    const at = w.status === "sent" ? w.sentAt : w.status === "rejected" ? w.rejectedAt : undefined;
    if (!at) return [];
    const amount = f.money(w.amount);
    const sent = w.status === "sent";
    return [{
      key: `withdrawal-${w.id}`,
      kind: sent ? "withdrawalSent" : "withdrawalRejected",
      title: t(sent ? "notifications.withdrawalSent.title" : "notifications.withdrawalRejected.title"),
      detail: sent
        ? t("notifications.withdrawalSent.detail", { amount, iban: maskIban(w.iban ?? "") })
        : t("notifications.withdrawalRejected.detail", { amount, note: w.note ?? "" }),
      time: f.messageTime(at, day),
      section: sectionOf(at, day),
      href: "/balance",
      unread: at > seenAt,
      at,
    }];
  });
  const orderRows = orderNotes.map((n): NotificationRow & { at: string } => {
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
      at: n.at,
    };
  });
  const all = [...orderRows, ...paymentNotes, ...withdrawalNotes].sort((a, b) => b.at.localeCompare(a.at));
  const rows: NotificationRow[] = all.slice(0, limit ?? all.length);
  const unreadOwn = [...paymentNotes, ...withdrawalNotes].filter((n) => n.unread).length;
  return { rows, unread: orderNotes.filter((n) => isUnread(n, seenAt)).length + unreadOwn };
}
