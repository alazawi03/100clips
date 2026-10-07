import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, orderTone } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { hasManyBrands } from "@/lib/brandFilter";
import { getBrand } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { getCreator } from "@/lib/data/creators";
import { orderFlags } from "@/components/brand/campaigns/campaignView";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

/**
 * One order in a list: who, what, where it came from, status and amount.
 * Inside a campaign every order shares the campaign name, so "creator" leads with the creator and their clips instead.
 */
export function OrderRow({ order, i18n, lead = "order" }: { order: Order; i18n: I18n; lead?: "order" | "creator" }) {
  const { t, tp, f } = i18n;
  const creator = getCreator(order.creatorId)!;
  // Brand column: only for accounts with several brands, and not inside a campaign (all one brand there).
  const brand = lead === "order" && hasManyBrands() ? getBrand(order.brandId) : undefined;
  const brandName = brand ? f.pick(brand.name) : undefined;
  const flags = orderFlags(order, order.campaignId ? getCampaign(order.campaignId) : undefined);
  return (
    <li>
      <Link
        href={`/orders/${order.id}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors duration-[120ms] hover:bg-surface/60 sm:flex-nowrap sm:px-5"
      >
        <Avatar id={creator.id} name={f.pick(creator.name)} size="md" />
        <div className="min-w-0 flex-1">
          {lead === "creator" ? (
            <>
              <p className="truncate font-medium">{f.pick(creator.name)}</p>
              <p className="truncate text-small text-text-muted">
                {order.items.map((i) => t(`formats.${i.format}`)).join(t("common.separator"))}
              </p>
            </>
          ) : (
            <>
              <p className="truncate font-medium">{f.pick(order.title)}</p>
              <p className="truncate text-small text-text-muted">
                {f.pick(creator.name)}
                {t("common.separator")}
                {t(`orderSource.${order.source}`)}
                {brandName && <span className="md:hidden">{t("common.separator") + brandName}</span>}
              </p>
            </>
          )}
        </div>
        {order.status !== "cancelled" && (
          <div className="order-last flex w-full flex-col gap-1 ps-14 sm:order-none sm:w-44 sm:shrink-0 sm:ps-0">
            <span aria-hidden className="flex gap-0.5">
              {flags.steps.map((s, i) => (
                <span key={s} className={cn("h-1 flex-1 rounded-full", i <= flags.stepIndex ? "bg-primary" : "bg-border")} />
              ))}
            </span>
            <span className="truncate text-caption text-text-muted">
              {t("flow.stepLabel", { n: flags.stepIndex + 1, total: flags.steps.length, step: t(`flow.steps.${flags.steps[flags.stepIndex]}`) })}
            </span>
          </div>
        )}
        {brand && (
          <div className="hidden w-40 shrink-0 items-center gap-2 md:flex">
            <BrandLogo id={brand.id} name={brandName!} src={brand.logo} size="sm" />
            <span className="truncate text-small text-text-muted">{brandName}</span>
          </div>
        )}
        <div className="flex w-full items-center gap-3 ps-14 sm:w-auto sm:ps-0">
          {flags.late && <Badge tone="error">{t("flow.lateShort")}</Badge>}
          {flags.action && <Badge tone="warning">{tp("flow.waitingDays", flags.actionDays ?? 0)}</Badge>}
          {order.revisionRequested && <Badge tone="warning">{t("brandHome.revisionRequested")}</Badge>}
          {/* The step line says where the order is; cancelled orders have no steps, so they keep the badge. */}
          {order.status === "cancelled" && <Badge tone={orderTone[order.status]}>{t(`status.order.${order.status}`)}</Badge>}
          <span className="ms-auto min-w-20 text-end font-medium tabular-nums sm:ms-0">{f.money(order.amount)}</span>
        </div>
      </Link>
    </li>
  );
}
