import Link from "next/link";
import { Card, SectionHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Order } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import type { I18n } from "@/lib/i18n/server";
import { orderBadgeStatus, READY_FOR_BRAND } from "@/lib/statuses";

/** A user's orders, newest first, each opening the admin's order page. `who` names the other side. */
export function OrderHistory({ orders, who, i18n, amount = "brandPaid" }: { orders: Order[]; who: (o: Order) => string; i18n: I18n; amount?: "brandPaid" | "creatorPay" }) {
  const { t, f } = i18n;
  const list = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section aria-labelledby="orders-title">
      <SectionHeader id="orders-title" title={t("admin.users.orderHistory")} />
      {list.length === 0 ? (
        <p className="text-small text-text-muted">{t("admin.users.noOrders")}</p>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {list.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-surface sm:px-5">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate font-medium">{f.pick(o.title)}</p>
                    <p className="truncate text-small text-text-muted">
                      {who(o)} · {f.date(o.createdAt)} · <bdi dir="ltr">{o.id}</bdi>
                    </p>
                  </div>
                  <StatusBadge order={orderBadgeStatus(o)} label={o.status === "delivered" ? READY_FOR_BRAND : undefined} />
                  <span className="min-w-20 text-end font-medium tabular-nums">{f.money(amount === "brandPaid" ? brandPaid(o) : o.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
