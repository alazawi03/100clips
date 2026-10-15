import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SearchForm } from "@/components/admin/SearchForm";
import { WaitingOnTag } from "@/components/admin/WaitingOnTag";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminOrderRows, isOrderFilter, matchesFilter, matchesSearch, ORDER_FILTERS, orderRef, type OrderFilter } from "@/lib/admin/orders";
import { brandPaid } from "@/lib/fees";
import { getI18n } from "@/lib/i18n/server";
import { daysUntil } from "@/lib/orderFlow";
import { orderBadgeStatus, READY_FOR_BRAND } from "@/lib/statuses";
import { today } from "@/lib/today";

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const filter: OrderFilter = isOrderFilter(params.filter) ? params.filter : "all";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const i18n = await getI18n();
  const { t, tp, f } = i18n;
  const day = today();
  const searched = (await adminOrderRows(day)).filter((r) => matchesSearch(r, q));
  const rows = searched.filter((r) => matchesFilter(r, filter));
  const href = (next: OrderFilter) => `/admin/orders?filter=${next}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.orders.title")} subtitle={t("admin.orders.subtitle")} />
      <SearchForm action="/admin/orders" q={q} placeholder={t("admin.orders.search")} keep={{ filter }} />
      <FilterTabs
        label={t("admin.orders.filtersLabel")}
        tabs={ORDER_FILTERS.map((x) => ({ href: href(x), label: t(`admin.orders.filters.${x}`), count: f.number(searched.filter((r) => matchesFilter(r, x)).length), active: x === filter }))}
      />
      {rows.length === 0 ? (
        <EmptyState title={t("admin.orders.empty")} hint={q ? t("admin.orders.emptySearch", { q }) : undefined} />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {rows.map(({ order, deadline, late, waiting, brand, creator }) => {
              const brandName = f.pick(brand.name);
              return (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="grid gap-x-4 gap-y-2 p-4 hover:bg-surface sm:px-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <BrandLogo id={order.brandId} name={brandName} src={brand.logo} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{f.pick(order.title)}</p>
                        <p className="truncate text-small text-text-muted">
                          {brandName} · {f.pick(creator.name)} · <bdi dir="ltr">{orderRef(order)}</bdi>
                        </p>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <WaitingOnTag waiting={waiting} i18n={i18n} />
                      <span className="text-small text-text-muted">
                        {deadline ? (late ? <span className="font-medium text-warning">{tp("admin.orders.lateBy", -daysUntil(deadline, day))}</span> : t("admin.orders.due", { date: f.date(deadline) })) : t("admin.orders.noDeadline")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <StatusBadge order={orderBadgeStatus(order)} label={order.status === "delivered" ? READY_FOR_BRAND : undefined} />
                      <span className="min-w-20 text-end font-medium tabular-nums">{f.money(brandPaid(order))}</span>
                      <ChevronLeft aria-hidden className="hidden size-5 rotate-180 text-text-muted rtl:rotate-0 md:block" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
