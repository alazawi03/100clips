import { OrderRow } from "@/components/brand/orders/OrderRow";
import { Card } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { brandFilterOf, hasManyBrands, href } from "@/lib/brandFilter";
import { workspace } from "@/lib/data/live";
import { ORDER_STATUSES } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";
import { ORDER_STATUS, statusOfOrderStatus } from "@/lib/statuses";

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const query = await searchParams;
  const { brands, orders: allOrders } = await workspace();
  const brandId = brandFilterOf(query.brand, brands);
  const orders = brandId ? allOrders.filter((o) => o.brandId === brandId) : allOrders;
  const raw = query.status;
  const status = ORDER_STATUSES.find((s) => s === raw);
  const shown = (status ? orders.filter((o) => o.status === status) : orders).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  const tabs = [
    { href: href("/orders", { brand: brandId }), label: t("common.all"), count: f.number(orders.length), active: !status },
    ...ORDER_STATUSES.map((s) => ({
      href: href("/orders", { status: s, brand: brandId }),
      label: f.pick(ORDER_STATUS[statusOfOrderStatus(s)].label),
      count: f.number(orders.filter((o) => o.status === s).length),
      active: status === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("ordersPage.title")}>
        {hasManyBrands(brands) && <BrandFilter brands={brands.map((b) => ({ id: b.id, name: f.pick(b.name), logo: b.logo }))} value={brandId} />}
      </PageHeader>
      <FilterTabs tabs={tabs} label={t("ordersPage.filterLabel")} />
      {shown.length > 0 ? (
        <Card>
          <ul className="divide-y divide-border">
            {shown.map((order) => (
              <OrderRow key={order.id} order={order} i18n={i18n} />
            ))}
          </ul>
        </Card>
      ) : (
        // No orders at all: say where they come from. Otherwise only this tab is empty.
        orders.length === 0 ? <EmptyState title={t("ordersPage.empty")} hint={t("ordersPage.emptyHint")} /> : <EmptyState title={t("ordersPage.emptyFiltered")} />
      )}
    </div>
  );
}
