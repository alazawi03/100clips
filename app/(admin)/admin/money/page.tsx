import { Download } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { StatCard } from "@/components/admin/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { buttonClass } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { FilterTabs } from "@/components/ui/FilterTabs";
import {
  BREAKDOWNS,
  breakdown,
  heldNow,
  isBreakdown,
  isRange,
  ledger,
  owedTotal,
  periodOf,
  platformBrand,
  RANGES,
  revenueBuckets,
  totals,
  type Breakdown,
  type BreakdownRow,
  type LedgerEntry,
  type Range,
} from "@/lib/admin/money";
import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import type { Niche, Platform } from "@/lib/data/types";
import { getI18n, type I18n } from "@/lib/i18n/server";

const ledgerTone: Record<LedgerEntry["type"], BadgeTone> = { payment: "brand", refund: "neutral", payout: "success" };

export default async function AdminMoneyPage({ searchParams }: PageProps<"/admin/money">) {
  const params = await searchParams;
  const range: Range = isRange(params.range) ? params.range : "30d";
  const by: Breakdown = isBreakdown(params.by) ? params.by : "time";
  const i18n = await getI18n();
  const { t, tp, f } = i18n;
  const today = DEMO_TODAY;
  const { from, to, unit } = periodOf(range, today);
  const sum = totals(from, to);
  const held = heldNow();
  const owed = owedTotal(today);
  const entries = ledger(from, to);
  const href = (next: { range?: Range; by?: Breakdown }) => `/admin/money?range=${next.range ?? range}&by=${next.by ?? by}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("admin.money.title")} subtitle={t("admin.money.subtitle", { from: f.date(from), to: f.date(to) })} />

      <FilterTabs label={t("admin.money.rangeLabel")} tabs={RANGES.map((r) => ({ href: href({ range: r }), label: t(`admin.ranges.${r}`), active: r === range }))} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("admin.stats.revenue")} value={f.money(sum.revenue)} hint={tp("admin.stats.revenueHint", sum.clips)} />
        <StatCard label={t("admin.stats.paid")} value={f.money(sum.netPaid)} hint={t("admin.stats.paidHint", { refunded: f.money(sum.refunded) })} />
        <StatCard label={t("admin.stats.held")} value={f.money(held.total)} hint={tp("admin.stats.heldHint", held.orders, { fees: f.money(held.fees) })} />
        <StatCard label={t("admin.stats.owed")} value={f.money(owed.amount)} hint={tp("admin.stats.owedHint", owed.creators)} action={owed.creators > 0 ? { href: "/admin/payouts", label: t("admin.overview.openPayouts") } : undefined} />
      </div>

      <section aria-labelledby="revenue-title" className="flex flex-col gap-4">
        <SectionHeader id="revenue-title" title={t("admin.money.revenueTitle")} hint={t("admin.money.revenueHint")} />
        <FilterTabs label={t("admin.money.byLabel")} tabs={BREAKDOWNS.map((b) => ({ href: href({ by: b }), label: t(`admin.breakdowns.${b}`), active: b === by }))} />
        {by === "time" ? <TimeView i18n={i18n} from={from} to={to} unit={unit} /> : <BreakdownTable i18n={i18n} by={by} rows={breakdown(by, from, to)} />}
      </section>

      <section aria-labelledby="ledger-title">
        <SectionHeader id="ledger-title" title={t("admin.money.ledgerTitle")} hint={t("admin.money.ledgerHint")}>
          <a href={`/admin/money/export?range=${range}`} download className={buttonClass("secondary", "shrink-0")}>
            <Download aria-hidden />
            {t("admin.money.export")}
          </a>
        </SectionHeader>
        {entries.length === 0 ? (
          <EmptyState title={t("admin.money.ledgerEmpty")} />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {entries.map((e) => (
                <LedgerRow key={e.id} entry={e} i18n={i18n} />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function TimeView({ i18n, from, to, unit }: { i18n: I18n; from: string; to: string; unit: "week" | "month" }) {
  const { t, tp, f, locale } = i18n;
  const month = new Intl.DateTimeFormat(locale === "ar" ? "ar-BH-u-nu-latn" : "en-BH", { month: "short", year: "numeric", timeZone: "Asia/Bahrain" });
  const labelOf = (start: string) => (unit === "month" ? month.format(new Date(`${start}T12:00:00+03:00`)) : t("admin.money.weekOf", { date: f.date(start) }));
  const buckets = revenueBuckets(from, to, unit);
  const bars = buckets.map((b) => ({ key: b.start, label: labelOf(b.start), value: b.revenue, valueLabel: f.money(b.revenue), detail: tp("admin.stats.revenueHint", b.clips) }));
  return (
    <Card className="flex flex-col gap-6 p-5">
      <RevenueChart bars={bars} label={t("admin.money.chartLabel")} formatTick={(n) => f.money(n)} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-small">
          <thead className="text-start text-text-muted">
            <tr className="border-b border-border">
              <th className="py-2 text-start font-normal">{t(unit === "month" ? "admin.money.colMonth" : "admin.money.colWeek")}</th>
              <th className="py-2 text-end font-normal">{t("admin.money.colClips")}</th>
              <th className="py-2 text-end font-normal">{t("admin.money.colRevenue")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...buckets].reverse().map((b) => (
              <tr key={b.start}>
                <td className="py-2">{labelOf(b.start)}</td>
                <td className="py-2 text-end tabular-nums">{f.number(b.clips)}</td>
                <td className="py-2 text-end font-medium tabular-nums">{f.money(b.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BreakdownTable({ i18n, by, rows }: { i18n: I18n; by: Exclude<Breakdown, "time">; rows: BreakdownRow[] }) {
  const { t, f } = i18n;
  if (rows.length === 0) return <EmptyState title={t("admin.money.noRevenue")} />;
  const total = rows.reduce((n, r) => n + r.fee, 0);
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-small">
        <thead className="text-text-muted">
          <tr className="border-b border-border">
            <th className="px-5 py-3 text-start font-normal">{t(`admin.breakdowns.${by}`)}</th>
            <th className="px-3 py-3 text-end font-normal">{t("admin.money.colClips")}</th>
            <th className="px-3 py-3 text-end font-normal">{t("admin.money.colBrandPaid")}</th>
            <th className="px-3 py-3 text-end font-normal">{t("admin.money.colCreatorPay")}</th>
            <th className="px-3 py-3 text-end font-normal">{t("admin.money.colRevenue")}</th>
            <th className="px-5 py-3 text-end font-normal">{t("admin.money.colShare")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="px-5 py-3">
                <RowName i18n={i18n} by={by} id={r.key} />
              </td>
              <td className="px-3 py-3 text-end tabular-nums">{f.number(r.clips)}</td>
              <td className="px-3 py-3 text-end tabular-nums">{f.money(r.spend)}</td>
              <td className="px-3 py-3 text-end tabular-nums">{f.money(r.creatorPay)}</td>
              <td className="px-3 py-3 text-end font-medium tabular-nums">{f.money(r.fee)}</td>
              <td className="px-5 py-3 text-end tabular-nums text-text-muted">{total > 0 ? `${Math.round((r.fee / total) * 100)}%` : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function RowName({ i18n, by, id }: { i18n: I18n; by: Exclude<Breakdown, "time">; id: string }) {
  const { t, f } = i18n;
  if (by === "brand") {
    const brand = platformBrand(id);
    const name = brand ? f.pick(brand.name) : id;
    return (
      <span className="flex items-center gap-3">
        <BrandLogo id={id} name={name} src={brand?.logo} size="sm" />
        <span className="font-medium">{name}</span>
      </span>
    );
  }
  if (by === "creator") {
    const creator = getCreator(id);
    const name = creator ? f.pick(creator.name) : id;
    return (
      <span className="flex items-center gap-3">
        <Avatar id={id} name={name} size="sm" />
        <span className="font-medium">{name}</span>
      </span>
    );
  }
  return <span className="font-medium">{by === "platform" ? t(`platforms.${id as Platform}`) : t(`niches.${id as Niche}`)}</span>;
}

function LedgerRow({ entry, i18n }: { entry: LedgerEntry; i18n: I18n }) {
  const { t, f } = i18n;
  let title: string;
  let detail: string;
  if (entry.type === "payout") {
    const creator = getCreator(entry.creatorId);
    title = t("admin.ledger.payout", { name: creator ? f.pick(creator.name) : entry.creatorId });
    detail = t("admin.ledger.payoutDetail", { ref: entry.bankRef, count: entry.orders });
  } else {
    const brand = platformBrand(entry.order.brandId);
    const brandName = brand ? f.pick(brand.name) : entry.order.brandId;
    title = t(entry.type === "payment" ? "admin.ledger.payment" : "admin.ledger.refund", { brand: brandName });
    detail = `${f.pick(entry.order.title)} · ${entry.order.id}`;
  }
  return (
    <li className="flex items-center gap-4 p-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-small text-text-muted">
          {f.date(entry.day)} · <bdi>{detail}</bdi>
        </p>
      </div>
      <Badge tone={ledgerTone[entry.type]} className="hidden sm:inline-flex">
        {t(`admin.ledger.types.${entry.type}`)}
      </Badge>
      <span className="min-w-24 text-end font-medium tabular-nums">{f.signedMoney(entry.amount)}</span>
    </li>
  );
}
