import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelOrderButton, ExtendDeadlineButton } from "@/components/admin/AdminForms";
import { WaitingOnTag } from "@/components/admin/WaitingOnTag";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminOrder, canCancel, canMoveDeadline, orderRef, waitingOn } from "@/lib/admin/orders";
import { reportOf } from "@/lib/data/problems";
import { ResolveProblemButton } from "@/components/admin/AdminForms";
import { Badge } from "@/components/ui/Badge";
import { SERVICE_FEE_RATE, brandPaid, feeOf } from "@/lib/fees";
import { getI18n } from "@/lib/i18n/server";
import { eventsOf, isLate } from "@/lib/orderFlow";
import { orderBadgeStatus, READY_FOR_BRAND } from "@/lib/statuses";
import { today } from "@/lib/today";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const found = await adminOrder(id);
  if (!found) notFound();
  const { order, brand, creator } = found;
  const i18n = await getI18n();
  const { t, tp, f } = i18n;
  const day = today();
  const brandName = f.pick(brand.name);
  const creatorName = f.pick(creator.name);
  const deadline = order.deadline;
  const waiting = waitingOn(found);
  // Transfers to creators aren't on the API yet: owed since approval.
  const approved = order.events?.find((e) => e.type === "approved")?.at.slice(0, 10);
  const problem = reportOf(order.id);

  const facts: Array<[string, React.ReactNode]> = [
    [t("admin.orders.format"), t(`formats.${order.items[0].format}`)],
    [t("admin.orders.created"), f.date(order.createdAt)],
    [
      t("admin.orders.deadline"),
      deadline ? (
        <span key="d">
          {f.date(deadline)}
          {isLate(order, deadline, day) && <span className="font-medium text-warning"> · {t("admin.orders.late")}</span>}
          {found.movedFrom !== undefined && (
            <span className="text-text-muted"> · {t("admin.orders.extendedFrom", { date: found.movedFrom ? f.date(found.movedFrom) : t("admin.orders.noDeadline") })}</span>
          )}
        </span>
      ) : (
        t("admin.orders.noDeadline")
      ),
    ],
    [t("admin.orders.source"), t("admin.orders.fromCampaign", { title: f.pick(found.campaignTitle) })],
  ];
  if (order.revisionNote) facts.push([t("admin.orders.revisionNote"), `“${order.revisionNote}”`]);
  if (order.shipping?.sentAt) facts.push([t("admin.orders.shipping"), order.shipping.receivedAt ? t("admin.orders.received", { date: f.date(order.shipping.receivedAt.slice(0, 10)) }) : t("admin.orders.sentOn", { date: f.date(order.shipping.sentAt.slice(0, 10)) })]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={f.pick(order.title)} back={{ href: "/admin/orders", label: t("admin.orders.title") }} subtitle={<bdi dir="ltr">{orderRef(order)}</bdi>}>
        <StatusBadge order={orderBadgeStatus(order)} label={order.status === "delivered" ? READY_FOR_BRAND : undefined} />
      </PageHeader>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <WaitingOnTag waiting={waiting} i18n={i18n} className="text-body" />
        {canCancel(order) && (
          <div className="flex flex-wrap gap-2">
            {canMoveDeadline(order) && <ExtendDeadlineButton orderId={order.id} reference={orderRef(order)} current={deadline} min={day} />}
            <CancelOrderButton orderId={order.id} reference={orderRef(order)} amount={f.money(brandPaid(order))} />
          </div>
        )}
      </Card>

      {problem && (
        <Card className="flex flex-col gap-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{t("admin.reports.onOrder", { reason: t(`admin.reports.reasons.${problem.reason}`) })}</p>
            <Badge tone={problem.status === "open" ? "warning" : "success"}>{t(`admin.reports.status.${problem.status}`)}</Badge>
          </div>
          <p dir="auto" className="text-small">
            “{problem.details}”
          </p>
          {problem.status === "resolved" ? (
            <p dir="auto" className="text-small text-text-muted">
              {t("admin.reports.repliedOn", { date: f.messageTime(problem.resolvedAt ?? problem.at, "") })} “{problem.resolution}”
            </p>
          ) : (
            <div className="flex justify-end">
              <ResolveProblemButton id={problem.id} />
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="p-5">
            <h2 className="mb-3 text-h3 font-medium">{t("admin.orders.details")}</h2>
            <dl className="flex flex-col gap-2 text-small">
              {facts.map(([label, value]) => (
                <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="text-end">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-h3 font-medium">{t("admin.orders.timeline")}</h2>
            <ol className="flex flex-col gap-3">
              {eventsOf(order).map((e, i) => (
                <li key={`${e.type}-${i}`} className="flex items-start gap-3 text-small">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-text-muted" />
                  <span className="min-w-0 flex-1">{t(`admin.events.${e.type}`, { brand: brandName, creator: creatorName })}</span>
                  <span className="shrink-0 text-text-muted">{f.date(e.at.slice(0, 10))}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3 p-5">
            <Link href={`/admin/users/brands/${order.brandId}`} className="flex items-center gap-3 rounded-[var(--radius-md)] hover:underline">
              <BrandLogo id={order.brandId} name={brandName} src={brand.logo} size="md" />
              <span className="min-w-0">
                <span className="block text-small text-text-muted">{t("admin.who.brand")}</span>
                <span className="block truncate font-medium">{brandName}</span>
              </span>
            </Link>
            <Link href={`/admin/users/creators/${order.creatorId}`} className="flex items-center gap-3 rounded-[var(--radius-md)] hover:underline">
              <Avatar id={order.creatorId} name={creatorName} src={creator.photo} size="md" />
              <span className="min-w-0">
                <span className="block text-small text-text-muted">{t("admin.who.creator")}</span>
                <span className="block truncate font-medium">{creatorName}</span>
              </span>
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-h3 font-medium">{t("admin.orders.money")}</h2>
            <dl className="flex flex-col gap-2 text-small">
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t("admin.orders.creatorPay")}</dt>
                <dd className="tabular-nums">{f.money(order.amount)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t("cart.serviceFee", { rate: `${SERVICE_FEE_RATE * 100}%` })}</dt>
                <dd className="tabular-nums">{f.money(feeOf(order))}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-border pt-2 font-medium">
                <dt>{t("admin.orders.brandPaid")}</dt>
                <dd className="tabular-nums">{f.money(brandPaid(order))}</dd>
              </div>
            </dl>
            <p className="mt-3 text-small text-text-muted">
              {order.status === "declined" || order.status === "cancelled"
                ? t("admin.orders.moneyRefunded", { amount: f.money(brandPaid(order)) })
                : order.status !== "approved"
                  ? t("admin.orders.moneyHeld")
                  : tp("admin.orders.moneyOwed", Math.max(0, Math.round((Date.parse(day) - Date.parse(approved ?? day)) / 86_400_000)))}
            </p>
            {order.status === "approved" && (
              <Link href="/admin/payouts" className="mt-2 inline-block text-small font-medium text-primary hover:underline">
                {t("admin.overview.openPayouts")}
              </Link>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
