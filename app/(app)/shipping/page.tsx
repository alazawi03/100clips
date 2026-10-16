import Link from "next/link";
import { markOrderReturned } from "@/app/actions/brand";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { productOf } from "@/components/brand/campaigns/campaignView";
import { ShipButton, ShipToLines } from "@/components/brand/campaigns/OrderCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { ActionTag } from "@/components/ui/StatusBadge";
import { brandFilterOf, hasManyBrands, href } from "@/lib/brandFilter";
import { workspace, type Workspace } from "@/lib/data/live";
import type { Order } from "@/lib/data/types";
import { getI18n, type I18n } from "@/lib/i18n/server";
import { actionWaitingDays, daysUntil } from "@/lib/orderFlow";
import { compareInStage, SHIPPING_STAGES, shippingStage, type ShippingStage } from "@/lib/shipping";
import { today } from "@/lib/today";

/** Every physical product the brand sends to creators, by where it is now. */
export default async function ShippingPage({ searchParams }: PageProps<"/shipping">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const query = await searchParams;
  const ws = await workspace();
  const brandId = brandFilterOf(query.brand, ws.brands);
  const orders = brandId ? ws.orders.filter((o) => o.brandId === brandId) : ws.orders;

  const byStage = new Map<ShippingStage, Order[]>(SHIPPING_STAGES.map((s) => [s, []]));
  for (const order of orders) {
    const campaign = ws.campaign(order.campaignId);
    const stage = campaign && shippingStage(order, productOf(campaign, ws));
    if (stage) byStage.get(stage)!.push(order);
  }
  const total = SHIPPING_STAGES.reduce((n, s) => n + byStage.get(s)!.length, 0);

  // Open on the tab that was asked for, else the first one with something in it.
  const asked = SHIPPING_STAGES.find((s) => s === query.tab);
  const stage = asked ?? SHIPPING_STAGES.find((s) => byStage.get(s)!.length > 0) ?? "send";
  const shown = byStage.get(stage)!.toSorted((a, b) => compareInStage(stage, a, b));

  const tabs = SHIPPING_STAGES.map((s) => ({
    href: href("/shipping", { tab: s, brand: brandId }),
    label: t(`shippingPage.tabs.${s}`),
    count: f.number(byStage.get(s)!.length),
    active: s === stage,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("shippingPage.title")} subtitle={t("shippingPage.subtitle")}>
        {hasManyBrands(ws.brands) && <BrandFilter brands={ws.brands.map((b) => ({ id: b.id, name: f.pick(b.name), logo: b.logo }))} value={brandId} />}
      </PageHeader>
      {total === 0 ? (
        <EmptyState title={t("shippingPage.emptyAll")} hint={t("shippingPage.emptyAllHint")} />
      ) : (
        <>
          <FilterTabs tabs={tabs} label={t("shippingPage.filterLabel")} />
          {shown.length > 0 ? (
            <Card>
              <ul className="divide-y divide-border">
                {shown.map((order) => (
                  <ShippingRow key={order.id} order={order} stage={stage} ws={ws} i18n={i18n} />
                ))}
              </ul>
            </Card>
          ) : (
            <EmptyState title={t(`shippingPage.empty.${stage}`)} />
          )}
        </>
      )}
    </div>
  );
}

/** One product: who has it, which campaign, where it stands, and the brand's button when there is one. */
function ShippingRow({ order, stage, ws, i18n }: { order: Order; stage: ShippingStage; ws: Workspace; i18n: I18n }) {
  const { t, tp, f } = i18n;
  const creator = ws.creator(order.creatorId);
  const name = creator ? f.pick(creator.name) : "";
  const { product } = productOf(ws.campaign(order.campaignId)!, ws);
  const productName = product ? f.pick(product.name) : "";
  const s = order.shipping;
  const day = (iso: string) => f.date(iso.slice(0, 10));

  let status: React.ReactNode = null;
  let action: React.ReactNode = null;
  if (stage === "send") {
    status = <ActionTag>{tp("flow.waitingDays", actionWaitingDays(order, "ship", today()))}</ActionTag>;
    action = <ShipButton orderId={order.id} name={name} productName={productName} />;
  } else if (stage === "way") {
    status = (
      <span className="text-small text-text-muted">
        {tp("shippingPage.sentDays", Math.max(0, -daysUntil(s!.sentAt!.slice(0, 10), today())))}
        {t("common.separator")}
        {t("flow.waiting.receive", { name })}
      </span>
    );
  } else if (stage === "with") {
    status = <span className="text-small text-text-muted">{t("campaignDetail.receivedOn", { date: day(s!.receivedAt!) })}</span>;
    action =
      order.status === "approved" ? (
        <form action={markOrderReturned.bind(null, order.id)}>
          <Button type="submit" variant="primary" className="h-9 md:h-9">
            {t("flow.button.collect")}
          </Button>
        </form>
      ) : (
        <span className="text-small text-text-muted">{t("shippingPage.pickupAfterApproval")}</span>
      );
  } else {
    status = <span className="text-small text-text-muted">{t("campaignDetail.returnedOn", { date: day(s!.returnedAt!) })}</span>;
  }

  return (
    <li className="flex flex-col gap-3 p-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap">
        <Avatar id={order.creatorId} name={name} src={creator?.photo} size="md" />
        <div className="min-w-0 flex-1">
          <Link href={`/orders/${order.id}`} className="block truncate font-medium hover:underline">
            {name}
          </Link>
          <p className="truncate text-small text-text-muted">
            {productName}
            {t("common.separator")}
            {f.pick(order.title)}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 ps-14 sm:w-auto sm:justify-end sm:ps-0">
          {status}
          {action}
        </div>
      </div>
      {stage === "send" && order.shipTo && <ShipToLines to={order.shipTo} className="ps-14" />}
      {stage === "way" && s?.note && (
        <p dir="auto" className="ps-14 text-small text-text-muted">
          {t("shippingPage.note", { note: s.note })}
        </p>
      )}
    </li>
  );
}
