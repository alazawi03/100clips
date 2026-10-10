import Link from "next/link";
import { ArrowLeftRight, Clock, Flag, Landmark, UserCheck } from "lucide-react";
import { ActionCallout, CalmCallout } from "@/components/brand/ActionCallout";
import { StatCard } from "@/components/admin/StatCard";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { applications, waitlistByCountry } from "@/lib/admin/data";
import { flagOf } from "@/lib/data/emojis";
import { heldNow, owedToCreators, periodOf, platformBrand, stuckOrders, totals } from "@/lib/admin/money";
import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { reports } from "@/lib/data/messages";
import { problemReports } from "@/lib/data/problems";
import { openWithdrawals } from "@/lib/data/wallet";
import { getI18n } from "@/lib/i18n/server";
import { orderBadgeStatus, READY_FOR_BRAND } from "@/lib/statuses";

export default async function AdminOverviewPage() {
  const { t, tp, f, locale } = await getI18n();
  const list = new Intl.ListFormat(locale, { type: "conjunction" });
  const today = DEMO_TODAY;
  const { from, to } = periodOf("30d", today);
  const period = totals(from, to);
  const held = heldNow();
  const owed = owedToCreators(today);
  const owedAmount = owed.reduce((n, r) => n + r.amount, 0);
  const noBank = owed.filter((r) => !r.bank);
  const stuck = stuckOrders(today);
  const waitingApproval = applications.filter((a) => a.status === "pending");
  const openProblems = problemReports.filter((r) => r.status === "open");
  // Brands can have several withdrawals waiting; the list is newest first, so the oldest is last.
  const withdrawals = openWithdrawals();
  const withdrawalsTotal = withdrawals.reduce((n, w) => n + w.amount, 0);
  const waiting = waitlistByCountry();
  const regions = new Intl.DisplayNames([locale], { type: "region" });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("admin.overview.title")} subtitle={t("admin.asOf", { date: f.date(today) })} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.stats.owed")}
          value={f.money(owedAmount)}
          hint={tp("admin.stats.owedHint", owed.length)}
          action={owed.length > 0 ? { href: "/admin/payouts", label: t("admin.overview.openPayouts") } : undefined}
        />
        <StatCard label={t("admin.stats.held")} value={f.money(held.total)} hint={tp("admin.stats.heldHint", held.orders, { fees: f.money(held.fees) })} />
        <StatCard label={t("admin.stats.revenue30")} value={f.money(period.revenue)} hint={tp("admin.stats.revenueHint", period.clips)} action={{ href: "/admin/money", label: t("admin.overview.openMoney") }} />
        <StatCard label={t("admin.stats.paid30")} value={f.money(period.netPaid)} hint={t("admin.stats.paidHint", { refunded: f.money(period.refunded) })} />
      </div>

      <section aria-labelledby="attention-title" className="flex flex-col gap-3">
        <SectionHeader id="attention-title" title={t("admin.overview.attention")} />
        {waitingApproval.length > 0 && (
          <ActionCallout
            icon={UserCheck}
            title={tp("admin.overview.approvals", waitingApproval.length)}
            detail={list.format(waitingApproval.map((a) => f.pick(a.name)))}
            action={<LinkButton href="/admin/approvals">{t("admin.overview.openApprovals")}</LinkButton>}
          />
        )}
        {owed.length > 0 && (
          <ActionCallout
            icon={ArrowLeftRight}
            title={tp("admin.overview.toTransfer", owed.length, { amount: f.money(owedAmount) })}
            detail={tp("admin.overview.oldestWait", owed[0].waitingDays)}
            action={<LinkButton href="/admin/payouts">{t("admin.overview.openPayouts")}</LinkButton>}
          />
        )}
        {noBank.length > 0 && (
          <ActionCallout
            icon={Landmark}
            title={tp("admin.overview.noBank", noBank.length)}
            detail={list.format(noBank.map((r) => f.pick(getCreator(r.creatorId)!.name)))}
            action={<LinkButton href="/admin/payouts" variant="secondary">{t("admin.overview.view")}</LinkButton>}
          />
        )}
        {withdrawals.length > 0 && (
          <ActionCallout
            icon={ArrowLeftRight}
            title={tp("admin.overview.brandWithdrawals", withdrawals.length, { amount: f.money(withdrawalsTotal) })}
            detail={t("admin.overview.oldestRequested", { date: f.date(withdrawals.at(-1)!.requestedAt.slice(0, 10)) })}
            action={<LinkButton href="/admin/payouts">{t("admin.overview.openPayouts")}</LinkButton>}
          />
        )}
        {openProblems.length + reports.length > 0 && (
          <ActionCallout
            icon={Flag}
            title={tp("admin.overview.problems", openProblems.length + reports.length)}
            action={<LinkButton href="/admin/reports">{t("admin.overview.openReports")}</LinkButton>}
          />
        )}
        {withdrawals.length === 0 && openProblems.length === 0 && waitingApproval.length === 0 && owed.length === 0 && noBank.length === 0 && reports.length === 0 && stuck.length === 0 && <CalmCallout>{t("admin.overview.calm")}</CalmCallout>}
      </section>

      {stuck.length > 0 && (
        <section aria-labelledby="stuck-title">
          <SectionHeader id="stuck-title" title={tp("admin.stuck.title", stuck.length)} hint={t("admin.stuck.hint")} action={{ href: "/admin/orders?filter=stuck", label: t("admin.overview.openOrders") }} />
          <Card>
            <ul className="divide-y divide-border">
              {stuck.map(({ order, reason, days }) => {
                const brand = platformBrand(order.brandId);
                const creator = getCreator(order.creatorId);
                return (
                  <li key={order.id}>
                    <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-surface sm:px-5">
                    <BrandLogo id={order.brandId} name={brand ? f.pick(brand.name) : order.brandId} src={brand?.logo} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{f.pick(order.title)}</p>
                      <p className="truncate text-small text-text-muted">
                        {brand ? f.pick(brand.name) : order.brandId} · {creator ? f.pick(creator.name) : order.creatorId} · <bdi dir="ltr">{order.id}</bdi>
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-small text-text-muted">
                      <Clock aria-hidden className="size-4" strokeWidth={1.75} />
                      {tp(`admin.stuck.reasons.${reason}`, days)}
                    </span>
                    {/* No 100clips review in the MVP: a delivered clip waits for the brand, so say so. */}
                    <StatusBadge order={orderBadgeStatus(order)} label={order.status === "delivered" ? READY_FOR_BRAND : undefined} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      )}

      {/* Where creators outside Bahrain are waiting for us: the case for the next country. */}
      {waiting.length > 0 && (
        <section aria-labelledby="waitlist-title">
          <SectionHeader id="waitlist-title" title={t("admin.waitlist.title")} hint={t("admin.waitlist.hint")} />
          <Card>
            <ul className="divide-y divide-border">
              {waiting.map((w) => (
                <li key={w.country} className="flex items-center gap-3 p-4 sm:px-5">
                  <span aria-hidden className="text-xl leading-none">
                    {flagOf(w.country)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{regions.of(w.country)}</p>
                    <p className="text-small text-text-muted">{t("admin.waitlist.latest", { date: f.date(w.latest.slice(0, 10)) })}</p>
                  </div>
                  <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-surface sm:block" aria-hidden>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(w.count / waiting[0].count) * 100}%` }} />
                  </div>
                  <span className="text-small font-medium tabular-nums">{tp("admin.waitlist.requests", w.count)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
