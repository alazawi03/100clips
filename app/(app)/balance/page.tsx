import { ArrowDownLeft, ArrowUpRight, CreditCard, Hourglass, Plus, Undo2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { cn } from "@/lib/cn";
import { workspace } from "@/lib/data/live";
import type { Order } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import { eventsOf } from "@/lib/orderFlow";
import { getI18n } from "@/lib/i18n/server";
import { dayOf } from "@/lib/today";

type LedgerEntry = components["schemas"]["LedgerEntry"];
type Payment = components["schemas"]["Payment"];

/**
 * One line in the history. Money in: top-ups, card payments at checkout, and refunds of orders that
 * ended without work (declined, expired, withdrawn). Money out: held for running orders, paid for
 * approved ones. (Withdrawals to the bank come with the wallet slice.)
 */
type EntryType = "topUp" | "card" | "hold" | "payment" | "refund";
type Entry = { id: string; date: string; label: string; detail?: string; type: EntryType; amount: number; creatorId?: string; badge: { tone: BadgeTone; label: string } };

const typeIcon = { topUp: ArrowDownLeft, card: CreditCard, hold: Hourglass, payment: ArrowUpRight, refund: Undo2 };

export default async function WalletPage() {
  const { t, f } = await getI18n();
  const [ws, ledger, pending] = await Promise.all([
    workspace(),
    api<LedgerEntry[]>("/me/ledger?limit=200"),
    api<Payment[]>("/me/payments?status=pending"),
  ]);
  const { orders } = ws;
  const held = orders.filter((o) => o.status === "pending" || o.status === "in_progress" || o.status === "delivered").reduce((sum, o) => sum + brandPaid(o), 0);
  const netSpent = orders.filter((o) => o.status === "approved").reduce((sum, o) => sum + brandPaid(o), 0);
  const moneyIn = ledger.filter((e) => e.type === "top_up" || e.type === "card_payment");
  const netCharged = moneyIn.reduce((sum, e) => sum + e.amount, 0);
  // Card payments not confirmed yet: nothing has moved, so they're a note rather than a line.
  const waitingByCard = pending.reduce((sum, p) => sum + p.by_card, 0);

  const orderEntry = (o: Order): Entry => {
    const creator = ws.creator(o.creatorId)!;
    const name = f.pick(creator.name);
    const title = f.pick(o.title);
    const day = dayOf(o.createdAt);
    if (o.status === "approved") return { id: o.id, date: day, label: t("walletPage.paymentLabel", { name }), detail: title, type: "payment", amount: -brandPaid(o), creatorId: o.creatorId, badge: { tone: "success", label: t("walletPage.typePayment") } };
    if (o.status === "declined" || o.status === "cancelled") {
      // Dated when the money came back: when the order ended.
      const ended = eventsOf(o).find((e) => e.type === "declined" || e.type === "expired" || e.type === "cancelled")?.at ?? o.createdAt;
      const why = o.status === "cancelled" ? t("walletPage.refundWhy.cancelled") : o.declineReason === "expired" ? t("walletPage.refundWhy.expired") : t("walletPage.refundWhy.declined", { name });
      return { id: o.id, date: dayOf(ended), label: t("walletPage.refundLabel", { title }), detail: why, type: "refund", amount: brandPaid(o), creatorId: o.creatorId, badge: { tone: "brand", label: t("walletPage.typeRefund") } };
    }
    return { id: o.id, date: day, label: t("walletPage.holdLabel", { title }), detail: name, type: "hold", amount: -brandPaid(o), creatorId: o.creatorId, badge: { tone: "warning", label: t("walletPage.typeHold") } };
  };

  const entries: Entry[] = [
    ...moneyIn.map((e): Entry => ({
      id: e.id,
      date: dayOf(e.created_at),
      label: e.type === "top_up" ? t("walletPage.topUpLabel") : t("walletPage.cardPaymentLabel"),
      type: e.type === "top_up" ? "topUp" : "card",
      amount: e.amount,
      badge: { tone: "brand", label: t("walletPage.typeTopUp") },
    })),
    ...orders.map(orderEntry),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("nav.balance")} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-4 p-5 md:col-span-1">
          <span className="text-small text-text-muted">{t("walletPage.available")}</span>
          <span className="text-display font-medium tabular-nums">{f.money(ws.balance)}</span>
          {waitingByCard > 0 && <p className="text-small text-text-muted">{t("walletPage.cardPending", { amount: f.money(waitingByCard) })}</p>}
          <div className="mt-auto flex flex-col gap-2">
            <Button variant="primary" className="w-full">
              <Plus aria-hidden />
              {t("walletPage.topUp")}
            </Button>
          </div>
        </Card>
        <Card className="flex flex-col gap-2 p-5">
          <span className="text-small text-text-muted">{t("walletPage.reserved")}</span>
          <span className="text-h1 font-medium tabular-nums">{f.money(held)}</span>
          <p className="text-small text-text-muted">{t("walletPage.reservedHint")}</p>
        </Card>
        <Card className="grid grid-cols-2 divide-x divide-border p-0 rtl:divide-x-reverse md:grid-cols-1 md:divide-x-0 md:divide-y">
          <div className="flex flex-col gap-2 p-5">
            <span className="text-small text-text-muted">{t("walletPage.netCharged")}</span>
            <span className="text-h1 font-medium tabular-nums">{f.money(netCharged)}</span>
          </div>
          <div className="flex flex-col gap-2 p-5">
            <span className="text-small text-text-muted">{t("walletPage.netSpent")}</span>
            <span className="text-h1 font-medium tabular-nums">{f.money(netSpent)}</span>
          </div>
        </Card>
      </div>

      <section aria-labelledby="transactions-title">
        <SectionHeader id="transactions-title" title={t("walletPage.transactions")} />
        {entries.length === 0 ? (
          <EmptyState title={t("walletPage.emptyTitle")} hint={t("walletPage.emptyHint")} />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {entries.map((entry) => {
                const Icon = typeIcon[entry.type];
                const creator = entry.creatorId ? ws.creator(entry.creatorId) : undefined;
                return (
                  <li key={`${entry.type}-${entry.id}`} className="flex items-center gap-4 p-4 sm:px-5">
                    {creator ? (
                      <Avatar id={creator.id} name={f.pick(creator.name)} src={creator.photo} size="md" />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-text">
                        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.label}</p>
                      <p className="truncate text-small text-text-muted">
                        {f.date(entry.date)}
                        {entry.detail && ` · ${entry.detail}`}
                      </p>
                    </div>
                    <Badge tone={entry.badge.tone} className="hidden sm:inline-flex">
                      {entry.badge.label}
                    </Badge>
                    <span className={cn("min-w-24 text-end font-medium tabular-nums", entry.amount > 0 && "text-success")}>{f.signedMoney(entry.amount)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
