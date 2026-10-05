import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clapperboard, Hourglass, ScanSearch } from "lucide-react";
import { ReviewActions } from "@/components/brand/orders/ReviewActions";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, orderTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { getCampaign } from "@/lib/data/campaigns";
import { getClip } from "@/lib/data/clips";
import { getCreator } from "@/lib/data/creators";
import { getOrder } from "@/lib/data/orders";
import { DEMO_TODAY, products } from "@/lib/data/account";
import { currentStep, isLate, nextAction, stepsFor, waitingFor } from "@/lib/orderFlow";
import { NextActionButton, Stars } from "@/components/brand/campaigns/OrderCard";
import { LinkButton } from "@/components/ui/Button";
import { getI18n } from "@/lib/i18n/server";

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();
  const { t, f } = await getI18n();
  const { done } = await searchParams;

  const creator = getCreator(order.creatorId)!;
  const name = f.pick(creator.name);
  const campaign = order.campaignId ? getCampaign(order.campaignId) : undefined;
  const clip = order.clipId ? getClip(order.clipId) : undefined;
  const brief = order.brief ?? campaign?.brief;
  // Steps and next action follow the same rules as the campaign page.
  const product = campaign ? products.find((p) => p.id === campaign.productIds?.[0]) : undefined;
  const physical = product?.details.type === "physical";
  const logistics = product && campaign ? campaign.logistics?.[product.id] : undefined;
  const returns = logistics?.type === "physical" && logistics.after === "return";
  const steps = stepsFor(physical);
  const stepIndex = steps.indexOf(currentStep(order, physical));
  const action = nextAction(order, { physical, returns });
  const late = isLate(order, campaign?.deadline, DEMO_TODAY);
  const watchable = clip && (order.status === "delivered" || order.status === "approved");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={f.pick(order.title)}
        subtitle={<bdi dir="ltr">#{order.id.replace("ord-", "")}</bdi>}
        back={{ href: "/orders", label: t("ordersPage.title") }}
      >
        {late && <Badge tone="error">{t("flow.late")}</Badge>}
        {order.revisionRequested && <Badge tone="warning">{t("brandHome.revisionRequested")}</Badge>}
        <Badge tone={orderTone[order.status]}>{t(`status.order.${order.status}`)}</Badge>
      </PageHeader>

      {done === "offerSent" && <Notice>{t("orderDetail.doneOfferSent", { name })}</Notice>}
      {done === "approved" && <Notice>{t("orderDetail.doneApproved", { amount: f.money(order.amount), name })}</Notice>}
      {done === "revisionSent" && <Notice>{t("orderDetail.doneRevisionSent", { name })}</Notice>}
      {action && action !== "review" && product && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-accent/40 p-4 sm:p-5">
          <p className="font-medium">{t(`flow.action.${action}`, { name, product: f.pick(product.name) })}</p>
          <NextActionButton orderId={order.id} action={action} />
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="font-medium">{t("orderDetail.clip")}</h2>
            {watchable ? (
              <>
                <div className="mx-auto w-full max-w-[320px]">
                  <video
                    dir="ltr"
                    src={clip.videoSrc}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={t("profile.play", { title: f.pick(clip.title) })}
                    className="aspect-[9/16] w-full rounded-[var(--radius-md)] bg-black object-cover"
                  />
                </div>
                {order.status === "delivered" && (
                  <>
                    <p className="text-small text-text-muted">{t("orderDetail.reviewHint")}</p>
                    <ReviewActions orderId={order.id} />
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                {clip && order.status === "submitted" ? (
                  <div className="relative w-36">
                    <ClipPoster clip={clip} views={f.compact(clip.views)} duration={f.duration(clip.durationSec)} compact className="opacity-60" />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-12 place-items-center rounded-full bg-card text-primary shadow-soft">
                        <ScanSearch aria-hidden className="size-6" />
                      </span>
                    </span>
                  </div>
                ) : (
                  <span className="grid size-14 place-items-center rounded-full bg-surface text-text-muted">
                    {order.status === "pending" ? <Hourglass aria-hidden className="size-6" /> : <Clapperboard aria-hidden className="size-6" />}
                  </span>
                )}
                <p className="max-w-sm text-text-muted">
                  {order.status === "pending" && t("orderDetail.waitingPending", { name })}
                  {order.status === "in_progress" &&
                    (waitingFor(order, physical) === "receive" ? t("flow.waiting.receive", { name }) : t("orderDetail.waitingProgress", { name }))}
                  {order.status === "submitted" && t("orderDetail.waitingSubmitted")}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-medium">{t("orderDetail.items")}</h2>
            <ul className="flex flex-col gap-2">
              {order.items.map((item) => (
                <li key={item.format} className="flex justify-between gap-3">
                  <span>
                    {t(`formats.${item.format}`)}
                  </span>
                  <span className="tabular-nums">{f.money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {physical && order.status !== "cancelled" && (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-medium">{t("campaignDetail.shipping")}</h2>
              <ul className="flex flex-col gap-1 text-small">
                <li className={order.shipping?.sentAt ? "" : "text-text-muted"}>
                  {order.shipping?.sentAt ? t("campaignDetail.sentOn", { date: f.date(order.shipping.sentAt.slice(0, 10)) }) : t("campaignDetail.notSent")}
                  {order.shipping?.note && <span className="text-text-muted"> · {order.shipping.note}</span>}
                </li>
                {order.shipping?.sentAt && (
                  <li className={order.shipping.receivedAt ? "" : "text-text-muted"}>
                    {order.shipping.receivedAt ? t("campaignDetail.receivedOn", { date: f.date(order.shipping.receivedAt.slice(0, 10)) }) : t("campaignDetail.notReceived")}
                  </li>
                )}
                {order.shipping?.returnedAt && <li>{t("campaignDetail.returnedOn", { date: f.date(order.shipping.returnedAt.slice(0, 10)) })}</li>}
              </ul>
              <p className="text-small text-text-muted">{returns ? t("campaignDetail.returnInfo") : t("campaignDetail.keepInfo")}</p>
            </Card>
          )}

          {order.status === "approved" && (
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="font-medium">{order.rating ? t("campaignDetail.rated", { name }) : t("campaignDetail.rate", { name })}</h2>
              <Stars orderId={order.id} value={order.rating} label={t("campaignDetail.rate", { name })} />
              <LinkButton href={`/creators/${creator.id}`} variant="secondary" className="w-fit">
                {t("campaignDetail.hireAgain")}
              </LinkButton>
            </Card>
          )}

          {order.note && (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-medium">{t("orderDetail.yourNote")}</h2>
              <p className="text-text-muted">{order.note}</p>
            </Card>
          )}

          {order.revisionNote && order.status !== "approved" && (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-medium">{t("orderDetail.yourRevision")}</h2>
              <p className="text-text-muted">{order.revisionNote}</p>
            </Card>
          )}

          {brief && (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-medium">{t("orderDetail.brief")}</h2>
              <p className="max-w-prose text-text-muted">{f.pick(brief)}</p>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-small text-text-muted">{t("orderDetail.creator")}</h2>
            <Link href={`/creators/${creator.id}`} className="flex items-center gap-3 rounded-[var(--radius-md)]">
              <Avatar id={creator.id} name={name} size="md" ring={creator.hasNewClips ? "new" : undefined} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{name}</span>
                <span className="block truncate text-small text-text-muted">
                  <bdi dir="ltr">@{creator.handle}</bdi>
                </span>
              </span>
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-medium">{t("orderDetail.details")}</h2>
            <dl className="flex flex-col gap-2 text-small">
              {[
                [t("orderDetail.amount"), <span key="a" className="font-medium tabular-nums">{f.money(order.amount)}</span>],
                [t("orderDetail.clips"), f.number(order.clips)],
                [t("orderDetail.created"), f.date(order.createdAt)],
                [
                  t("orderDetail.source"),
                  campaign ? (
                    <Link key="s" href={`/campaigns/${campaign.id}`} className="text-primary hover:underline">
                      {f.pick(campaign.title)}
                    </Link>
                  ) : (
                    t("orderSource.offer")
                  ),
                ],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between gap-3">
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="text-end">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-medium">{t("orderDetail.progress")}</h2>
            <ol className="flex flex-col">
              {steps.map((s, index) => {
                const complete = index < stepIndex || order.status === "approved";
                const current = index === stepIndex && order.status !== "approved" && order.status !== "cancelled";
                return (
                  <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < steps.length - 1 && (
                      <span aria-hidden className={cn("absolute start-[11px] top-6 h-[calc(100%-24px)] w-0.5", complete ? "bg-primary" : "bg-border")} />
                    )}
                    <span
                      className={cn(
                        "relative grid size-6 shrink-0 place-items-center rounded-full border-2",
                        complete && "border-primary bg-primary text-on-primary",
                        current && "border-primary bg-card",
                        !complete && !current && "border-border bg-card",
                      )}
                    >
                      {complete && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                      {current && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <span className={cn("text-small", current ? "font-medium" : complete ? "text-text" : "text-text-muted")} aria-current={current ? "step" : undefined}>
                      {t(`flow.steps.${s}`)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
