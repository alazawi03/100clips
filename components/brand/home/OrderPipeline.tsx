import { BadgeCheck, ChevronRight, Clapperboard, Hourglass, Inbox, ScanSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

const statusIcon: Record<OrderStatus, LucideIcon> = {
  pending: Hourglass,
  in_progress: Clapperboard,
  submitted: ScanSearch,
  delivered: Inbox,
  approved: BadgeCheck,
};

/** Orders counted per status, laid out in the order an order moves through them. */
export function OrderPipeline({ orders, i18n }: { orders: Order[]; i18n: I18n }) {
  const { t, f } = i18n;
  return (
    <Card className="p-2">
      <h2 className="sr-only">{t("brandHome.pipelineTitle")}</h2>
      <ol className="scrollbar-none flex overflow-x-auto">
        {ORDER_STATUSES.map((status, index) => {
          const count = orders.filter((o) => o.status === status).length;
          const needsYou = status === "delivered" && count > 0;
          const Icon = statusIcon[status];
          return (
            <li key={status} className="flex min-w-[180px] flex-1 items-center">
              <div className={cn("flex flex-1 items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3", needsYou && "bg-primary-soft text-primary-on-soft")}>
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    needsYou ? "bg-card text-primary" : "bg-surface text-text-muted",
                  )}
                >
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-h1 font-medium tabular-nums">{f.number(count)}</span>
                  <span className={cn("whitespace-nowrap text-small", needsYou ? "font-medium" : "text-text-muted")}>{t(`status.order.${status}`)}</span>
                </div>
              </div>
              {index < ORDER_STATUSES.length - 1 && (
                <ChevronRight aria-hidden className="mx-0.5 size-4 shrink-0 text-icon-inactive rtl:rotate-180" />
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
