import { ArrowDownLeft, ArrowUpFromLine, ArrowUpRight, Hourglass, Plus, Undo2 } from "lucide-react";
import { WithdrawButton } from "@/components/brand/wallet/WithdrawButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { account, walletTopUps } from "@/lib/data/account";
import { heldAmount } from "@/lib/data/store";
import { getCreator } from "@/lib/data/creators";
import { orders } from "@/lib/data/orders";
import { expectedArrival, openWithdrawals, WITHDRAWAL_DAYS, withdrawals } from "@/lib/data/wallet";
import type { Order, Withdrawal } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import { maskIban } from "@/lib/iban";
import { eventsOf } from "@/lib/orderFlow";
import { getI18n } from "@/lib/i18n/server";

/**
 * One line in the history. Money in: top-ups, and refunds of orders that ended without work (declined,
 * expired, withdrawn). Money out: held for running orders, paid for approved ones, withdrawn to the bank.
 */
type EntryType = "topUp" | "hold" | "payment" | "refund" | "withdrawal";
type Entry = { id: string; date: string; label: string; detail?: string; type: EntryType; amount: number; creatorId?: string; badge: { tone: BadgeTone; label: string }; struck?: boolean };

const typeIcon = { topUp: ArrowDownLeft, hold: Hourglass, payment: ArrowUpRight, refund: Undo2, withdrawal: ArrowUpFromLine };

export default async function WalletPage() {
  const { t, f } = await getI18n();
  const netSpent = orders.filter((o) => o.status === "approved").reduce((sum, o) => sum + brandPaid(o), 0);
  const netCharged = walletTopUps.reduce((sum, top) => sum + top.amount, 0);
  // Everything on its way to the bank: the total, from the earliest to the latest expected arrival.
  const onItsWay = openWithdrawals();
  const pendingOut = onItsWay.length > 0 && {
    amount: onItsWay.reduce((sum, w) => sum + w.amount, 0),
    from: onItsWay.map((w) => expectedArrival(w).from).sort()[0],
    to: onItsWay.map((w) => expectedArrival(w).to).sort().at(-1)!,
  };

  const orderEntry = (o: Order): Entry => {
    const creator = getCreator(o.creatorId)!;
    const name = f.pick(creator.name);
    const title = f.pick(o.title);
    if (o.status === "approved") return { id: o.id, date: o.createdAt, label: t("walletPage.paymentLabel", { name }), detail: title, type: "payment", amount: -brandPaid(o), creatorId: o.creatorId, badge: { tone: "success", label: t("walletPage.typePayment") } };
    if (o.status === "declined" || o.status === "cancelled") {
      // Dated when the money came back: when the order ended.
      const ended = eventsOf(o).find((e) => e.type === "declined" || e.type === "expired" || e.type === "cancelled")?.at ?? o.createdAt;
      const why = o.status === "cancelled" ? t("walletPage.refundWhy.cancelled") : o.declineReason === "expired" ? t("walletPage.refundWhy.expired") : t("walletPage.refundWhy.declined", { name });
      return { id: o.id, date: ended.slice(0, 10), label: t("walletPage.refundLabel", { title }), detail: why, type: "refund", amount: brandPaid(o), creatorId: o.creatorId, badge: { tone: "brand", label: t("walletPage.typeRefund") } };
    }
    return { id: o.id, date: o.createdAt, label: t("walletPage.holdLabel", { title }), detail: name, type: "hold", amount: -brandPaid(o), creatorId: o.creatorId, badge: { tone: "warning", label: t("walletPage.typeHold") } };
  };

  const withdrawalEntry = (w: Withdrawal): Entry => {
    const { from, to } = expectedArrival(w);
    const detail =
      w.status === "sent"
        ? t("walletPage.withdrawal.sentDetail", { iban: maskIban(w.iban ?? ""), date: f.date(w.sentAt!.slice(0, 10)) })
        : w.status === "rejected"
          ? t("walletPage.withdrawal.rejectedDetail", { note: w.note ?? "" })
          : t("walletPage.withdrawal.requestedDetail", { from: f.date(from), to: f.date(to) });
    const badge = { requested: { tone: "warning" as const, label: t("walletPage.withdrawal.requested") }, sent: { tone: "success" as const, label: t("walletPage.withdrawal.sent") }, rejected: { tone: "neutral" as const, label: t("walletPage.withdrawal.rejected") } }[w.status];
    return { id: w.id, date: w.requestedAt.slice(0, 10), label: t("walletPage.withdrawal.label"), detail, type: "withdrawal", amount: -w.amount, badge, struck: w.status === "rejected" };
  };

  const entries: Entry[] = [
    ...walletTopUps.map((top) => ({ id: top.id, date: top.date, label: t("walletPage.topUpLabel"), type: "topUp" as const, amount: top.amount, badge: { tone: "brand" as const, label: t("walletPage.typeTopUp") } })),
    ...orders.map(orderEntry),
    ...withdrawals.map(withdrawalEntry),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("nav.balance")} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-4 p-5 md:col-span-1">
          <span className="text-small text-text-muted">{t("walletPage.available")}</span>
          <span className="text-display font-medium tabular-nums">{f.money(account.balance)}</span>
          {pendingOut && (
            <p className="text-small text-text-muted">
              {t("walletPage.withdrawal.pending", { amount: f.money(pendingOut.amount), from: f.date(pendingOut.from), to: f.date(pendingOut.to) })}
            </p>
          )}
          <div className="mt-auto flex flex-col gap-2">
            <Button variant="primary" className="w-full">
              <Plus aria-hidden />
              {t("walletPage.topUp")}
            </Button>
            <WithdrawButton
              balance={account.balance}
              bank={account.bankAccount && { holder: account.bankAccount.holder, iban: maskIban(account.bankAccount.iban) }}
              days={WITHDRAWAL_DAYS}
            />
          </div>
        </Card>
        <Card className="flex flex-col gap-2 p-5">
          <span className="text-small text-text-muted">{t("walletPage.reserved")}</span>
          <span className="text-h1 font-medium tabular-nums">{f.money(heldAmount())}</span>
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
        <Card>
          <ul className="divide-y divide-border">
            {entries.map((entry) => {
              const Icon = typeIcon[entry.type];
              const creator = entry.creatorId ? getCreator(entry.creatorId) : undefined;
              return (
                <li key={`${entry.type}-${entry.id}`} className="flex items-center gap-4 p-4 sm:px-5">
                  {creator ? (
                    <Avatar id={creator.id} name={f.pick(creator.name)} size="md" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-on-soft">
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
                  <span className={cn("min-w-24 text-end font-medium tabular-nums", entry.amount > 0 && "text-success", entry.struck && "text-text-muted line-through")}>{f.signedMoney(entry.amount)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
