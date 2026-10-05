import { OrderRow } from "@/components/brand/orders/OrderRow";
import { Card } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { brandFilterOf, hasManyBrands, href } from "@/lib/brandFilter";
import { brands } from "@/lib/data/account";
import { orders as allOrders } from "@/lib/data/orders";
import { ORDER_STATUSES } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const query = await searchParams;
  const brandId = brandFilterOf(query.brand);
  const orders = brandId ? allOrders.filter((o) => o.brandId === brandId) : allOrders;
  const raw = query.status;
  const status = ORDER_STATUSES.find((s) => s === raw);
  const shown = (status ? orders.filter((o) => o.status === status) : orders).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  const tabs = [
    { href: href("/orders", { brand: brandId }), label: t("common.all"), count: f.number(orders.length), active: !status },
    ...ORDER_STATUSES.map((s) => ({
      href: href("/orders", { status: s, brand: brandId }),
      label: t(`status.order.${s}`),
      count: f.number(orders.filter((o) => o.status === s).length),
      active: status === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("ordersPage.title")}>
        {hasManyBrands() && <BrandFilter brands={brands.map((b) => ({ id: b.id, name: f.pick(b.name) }))} value={brandId} />}
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
        <EmptyState title={t("ordersPage.empty")} />
      )}
    </div>
  );
}
