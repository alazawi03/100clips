import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
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
  const [ws, me, failed] = await Promise.all([workspace(), getMe(), api<Payment[]>("/me/payments?status=failed&limit=50").catch(() => [])]);
  const day = today();
  // "Mark all as read" sets this; a new account has seen nothing yet.
  const seenAt = me?.account.notifications_seen_at ?? "";
  const orderNotes = brandNotifications(ws.orders, day, ws);
  // A card payment that didn't go through: a top-up, or offers that never went out.
  const paymentNotes = failed
    .filter((p) => p.failed_at)
    .map((p): NotificationRow & { at: string } => {
      const at = p.failed_at!;
      const campaign = ws.campaign(p.campaign_id ?? undefined);
      const amount = f.money(p.by_card);
      return {
        key: `payment-${p.id}`,
        kind: "paymentFailed",
        title: t("notifications.paymentFailed.title"),
        detail:
          p.kind === "top_up"
            ? t("notifications.paymentFailed.topUp", { amount })
            : t("notifications.paymentFailed.checkout", { amount, campaign: campaign ? f.pick(campaign.title) || t("newCampaign.untitled") : "" }),
        time: f.messageTime(at, day),
        section: sectionOf(at, day),
        href: !campaign ? "/balance" : campaign.status === "draft" ? `/campaigns/new?draft=${campaign.id}` : `/campaigns/${campaign.id}`,
        unread: at > seenAt,
        at,
      };
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
  const all = [...orderRows, ...paymentNotes].sort((a, b) => b.at.localeCompare(a.at));
  const rows: NotificationRow[] = all.slice(0, limit ?? all.length);
  return { rows, unread: orderNotes.filter((n) => isUnread(n, seenAt)).length + paymentNotes.filter((n) => n.unread).length };
}
