import { ArrowDownLeft, ArrowUpFromLine, ArrowUpRight, CreditCard, Hourglass, Undo2 } from "lucide-react";
import Link from "next/link";
import { TopUpButton } from "@/components/brand/balance/TopUpButton";
import { WithdrawButton } from "@/components/brand/wallet/WithdrawButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, SectionHeader } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { cn } from "@/lib/cn";
import { cardOnline, workspace } from "@/lib/data/live";
import type { Order, Withdrawal } from "@/lib/data/types";
import { expectedArrival, myBankAccount, myWithdrawals, WITHDRAWAL_DAYS } from "@/lib/data/wallet";
import { brandPaid } from "@/lib/fees";
import { maskIban } from "@/lib/iban";
import { eventsOf } from "@/lib/orderFlow";
import { getI18n } from "@/lib/i18n/server";
import { dayOf } from "@/lib/today";

type LedgerEntry = components["schemas"]["LedgerEntry"];
type Payment = components["schemas"]["Payment"];

/**
 * One line in the history. Money in: top-ups, card payments at checkout, and refunds of orders that
 * ended without work (declined, expired, withdrawn). Money out: held for running orders, paid for
 * approved ones, withdrawn to the bank (a rejected withdrawal shows struck through: it came back).
 */
type EntryType = "topUp" | "card" | "hold" | "payment" | "refund" | "failed" | "withdrawal";
type Entry = { id: string; date: string; label: string; detail?: string; type: EntryType; amount: number; creatorId?: string; badge: { tone: BadgeTone; label: string }; struck?: boolean };

const typeIcon = { topUp: ArrowDownLeft, card: CreditCard, hold: Hourglass, payment: ArrowUpRight, refund: Undo2, failed: CreditCard, withdrawal: ArrowUpFromLine };

export default async function WalletPage() {
  const { t, f } = await getI18n();
  const [ws, ledger, unpaid, refused, withdrawals, bank, online] = await Promise.all([
    workspace(),
    api<LedgerEntry[]>("/me/ledger?limit=200"),
    api<Payment[]>("/me/payments?status=pending"),
    api<Payment[]>("/me/payments?status=failed&limit=50"),
    myWithdrawals(),
    myBankAccount(),
    cardOnline(),
  ]);
  const { orders } = ws;
  // Top-ups not paid (still open on Gate-E for their hour, or ended unpaid) aren't shown: nothing moved, and the
  // brand just tops up again. A late payment still lands in the balance. Checkouts waiting for the card are shown:
  // their campaign waits for them, and part of the balance may be held.
  const pending = unpaid.filter((p) => p.kind !== "top_up");
  const failed = refused.filter((p) => p.kind !== "top_up");
  const held = orders.filter((o) => o.status === "pending" || o.status === "in_progress" || o.status === "delivered").reduce((sum, o) => sum + brandPaid(o), 0);
  const netSpent = orders.filter((o) => o.status === "approved").reduce((sum, o) => sum + brandPaid(o), 0);
  const moneyIn = ledger.filter((e) => e.type === "top_up" || e.type === "card_payment");
  const netCharged = moneyIn.reduce((sum, e) => sum + e.amount, 0);
  // Card payments not confirmed yet: nothing has moved, so they're a note rather than a line.
  const waitingByCard = pending.reduce((sum, p) => sum + p.by_card, 0);
  // The balance part of those checkouts: held (already off the available balance) until the card is paid.
  const heldForCard = pending.reduce((sum, p) => sum + p.from_balance, 0);
  // Everything on its way to the bank: the total, from the earliest to the latest expected arrival.
  const onItsWay = withdrawals.filter((w) => w.status === "requested");
  const pendingOut = onItsWay.length > 0 && {
    amount: onItsWay.reduce((sum, w) => sum + w.amount, 0),
    from: onItsWay.map((w) => expectedArrival(w).from).sort()[0],
    to: onItsWay.map((w) => expectedArrival(w).to).sort().at(-1)!,
  };

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

  const withdrawalEntry = (w: Withdrawal): Entry => {
    const { from, to } = expectedArrival(w);
    const detail =
      w.status === "sent"
        ? t("walletPage.withdrawal.sentDetail", { iban: maskIban(w.iban ?? ""), date: f.date(dayOf(w.sentAt!)) })
        : w.status === "rejected"
          ? t("walletPage.withdrawal.rejectedDetail", { note: w.note ?? "" })
          : t("walletPage.withdrawal.requestedDetail", { from: f.date(from), to: f.date(to) });
    const badge = {
      requested: { tone: "warning" as const, label: t("walletPage.withdrawal.requested") },
      sent: { tone: "success" as const, label: t("walletPage.withdrawal.sent") },
      rejected: { tone: "neutral" as const, label: t("walletPage.withdrawal.rejected") },
    }[w.status];
    return { id: w.id, date: dayOf(w.requestedAt), label: t("walletPage.withdrawal.label"), detail, type: "withdrawal", amount: -w.amount, badge, struck: w.status === "rejected" };
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
    ...withdrawals.map(withdrawalEntry),
    // The card was refused: shown so the brand knows, but no money moved.
    ...failed.map((p): Entry => {
      const campaign = ws.campaign(p.campaign_id ?? undefined);
      return {
        id: p.id,
        date: dayOf(p.failed_at ?? p.created_at),
        label: p.kind === "top_up" ? t("walletPage.topUpLabel") : t("walletPage.cardPaymentLabel"),
        detail: campaign ? f.pick(campaign.title) || t("newCampaign.untitled") : undefined,
        type: "failed",
        amount: p.by_card,
        badge: { tone: "error", label: t("walletPage.typeFailed") },
      };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("nav.balance")} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-4 p-5 md:col-span-1">
          <span className="text-small text-text-muted">{t("walletPage.available")}</span>
          <span className="text-display font-medium tabular-nums">{f.money(ws.balance)}</span>
          {waitingByCard > 0 && <p className="text-small text-text-muted">{t("walletPage.cardPending", { amount: f.money(waitingByCard) })}</p>}
          {/* Card payments still open on Gate-E: back to their page. */}
          {pending.filter((p) => p.pay_url).map((p) => (
            <Link key={p.id} href={`/payments/${p.id}`} className="text-small font-medium text-primary underline-offset-4 hover:underline">
              {t("payment.payNow", { amount: f.money(p.by_card) })}
            </Link>
          ))}
          {heldForCard > 0 && <p className="text-small text-text-muted">{t("walletPage.heldForCard", { amount: f.money(heldForCard) })}</p>}
          {pendingOut && (
            <p className="text-small text-text-muted">
              {t("walletPage.withdrawal.pending", { amount: f.money(pendingOut.amount), from: f.date(pendingOut.from), to: f.date(pendingOut.to) })}
            </p>
          )}
          <div className="mt-auto flex flex-col gap-2">
            <TopUpButton cardOnline={online} />
            <WithdrawButton balance={ws.balance} bank={bank && { holder: bank.holder, iban: maskIban(bank.iban) }} days={WITHDRAWAL_DAYS} />
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
                    {entry.type === "failed" ? (
                      <span className="min-w-24 text-end font-medium tabular-nums text-text-muted line-through">{f.money(entry.amount)}</span>
                    ) : (
                      <span className={cn("min-w-24 text-end font-medium tabular-nums", entry.amount > 0 && "text-success", entry.struck && "text-text-muted line-through")}>{f.signedMoney(entry.amount)}</span>
                    )}
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
