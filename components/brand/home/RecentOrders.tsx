import { OrderRow } from "@/components/brand/orders/OrderRow";
import { Card, SectionHeader } from "@/components/ui/Card";
import type { Order } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

export function RecentOrders({ orders, i18n }: { orders: Order[]; i18n: I18n }) {
  const { t } = i18n;
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <section aria-labelledby="orders-title">
      <SectionHeader id="orders-title" title={t("brandHome.recentOrdersTitle")} action={{ href: "/orders", label: t("common.seeAll") }} />
      <Card>
        <ul className="divide-y divide-border">
          {recent.map((order) => (
            <OrderRow key={order.id} order={order} i18n={i18n} />
          ))}
        </ul>
      </Card>
    </section>
  );
}
