import { OrderRow } from "@/components/brand/orders/OrderRow";
import { Card } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { brandOrders } from "@/lib/data/store";
import { ORDER_STATUSES } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const orders = brandOrders((await getCurrentBrand()).id);
  const raw = (await searchParams).status;
  const status = ORDER_STATUSES.find((s) => s === raw);
  const shown = (status ? orders.filter((o) => o.status === status) : orders).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  const tabs = [
    { href: "/orders", label: t("common.all"), count: f.number(orders.length), active: !status },
    ...ORDER_STATUSES.map((s) => ({
      href: `/orders?status=${s}`,
      label: t(`status.order.${s}`),
      count: f.number(orders.filter((o) => o.status === s).length),
      active: status === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("ordersPage.title")} />
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
