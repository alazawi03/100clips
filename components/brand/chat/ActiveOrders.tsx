import Link from "next/link";
import { ChevronDown, ChevronLeft, Package } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { orderBadgeStatus } from "@/lib/statuses";
import type { Order } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

/**
 * The work going on with this creator, under the chat header. Nothing when there's none;
 * one order as a single row; several folded into "N active orders" that opens to the list.
 */
export function ActiveOrders({ orders, i18n }: { orders: Order[]; i18n: I18n }) {
  const { tp, f } = i18n;
  if (orders.length === 0) return null;

  const row = (order: Order) => (
    <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface">
      <span className="min-w-0 flex-1 truncate text-small font-medium">{f.pick(order.title)}</span>
      <StatusBadge order={orderBadgeStatus(order)} />
      <ChevronLeft aria-hidden className="size-4 shrink-0 text-text-muted ltr:rotate-180" />
    </Link>
  );

  if (orders.length === 1) {
    return (
      <nav aria-label={tp("chat.activeOrders", 1)} className="border-b border-border bg-surface/50">
        <div className="flex items-center">
          <span className="flex shrink-0 items-center gap-1.5 ps-4 text-caption text-text-muted">
            <Package aria-hidden className="size-4" strokeWidth={1.75} />
            {tp("chat.activeOrders", 1)}
          </span>
          <div className="min-w-0 flex-1">{row(orders[0])}</div>
        </div>
      </nav>
    );
  }

  return (
    <details className="group border-b border-border bg-surface/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-small [&::-webkit-details-marker]:hidden">
        <Package aria-hidden className="size-4 text-text-muted" strokeWidth={1.75} />
        <span className="font-medium">{tp("chat.activeOrders", orders.length)}</span>
        <ChevronDown aria-hidden className="ms-auto size-4 text-text-muted transition-transform group-open:rotate-180" />
      </summary>
      <nav aria-label={tp("chat.activeOrders", orders.length)} className="max-h-48 divide-y divide-border overflow-y-auto border-t border-border">
        {orders.map(row)}
      </nav>
    </details>
  );
}
