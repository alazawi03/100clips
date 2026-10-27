import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clapperboard, Clock, Download, Flag, Gift, Hourglass, Megaphone, MessageCircle, UserRound } from "lucide-react";
import { markOrderReturned } from "@/app/actions/brand";
import { messageCreator } from "@/app/actions/messages";
import { AdCode } from "@/components/brand/orders/AdCode";
import { ApprovalMoment } from "@/components/brand/orders/ApprovalMoment";
import { ClipVersions, OfferWaiting, OrderClosedNote } from "@/components/brand/orders/OrderOutcome";
import { ReportProblem } from "@/components/brand/orders/ReportProblem";
import { ReviewActions } from "@/components/brand/orders/ReviewActions";
import { adPlatformOf } from "@/components/brand/campaigns/campaignView";
import { Avatar } from "@/components/ui/Avatar";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { conversations } from "@/lib/data/chatApi";
import { clipOf, workspace } from "@/lib/data/live";
import { clipVersions, currentStep, nextAction, offerHoursLeft, stepsFor, waitingFor } from "@/lib/orderFlow";
import { ShipButton, ShipToLines, Stars } from "@/components/brand/campaigns/OrderCard";
import { Button, LinkButton, buttonClass } from "@/components/ui/Button";
import { dayOf, nowIso, today } from "@/lib/today";
import { campaignProgress, isActiveOrder, orderBadgeStatus } from "@/lib/statuses";
import { brandPaid, priceForBrand } from "@/lib/fees";
import { getI18n } from "@/lib/i18n/server";

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const [ws, chats] = await Promise.all([workspace(), conversations()]);
  const order = ws.order(id);
  if (!order) notFound();
  const { t, tp, f } = await getI18n();
  const { done } = await searchParams;

  const creator = ws.creator(order.creatorId)!;
  const name = f.pick(creator.name);
  const campaign = ws.campaign(order.campaignId);
  const clip = clipOf(order, ws);
  const brief = campaign?.brief;
  // Steps and next action follow the same rules as the campaign page.
  const product = ws.product(campaign?.productIds?.[0]);
  const physical = product?.details.type === "physical";
  const logistics = product && campaign ? campaign.logistics?.[product.id] : undefined;
  const returns = logistics?.type === "physical" && logistics.after === "return";
  const steps = stepsFor(physical);
  const stepIndex = steps.indexOf(currentStep(order, physical));
  const action = nextAction(order, { physical, returns });
  // Its versions, even while the watermarked copy of the latest is still being made.
  const versions = clipVersions(order, clip);
  const watchable = versions.length > 0 && (order.status === "delivered" || order.status === "approved");
  // Before approving the brand watches copies with laqta's watermark: approving gives it the clip without.
  const watermarked = versions.some((v) => v.watermarked || v.preview);
  const active = isActiveOrder(order);
  const report = order.problem;
  const unread = chats.find((c) => c.brandId === order.brandId && c.creatorId === order.creatorId)?.unread ?? 0;
  // Just approved: the celebration, bigger when this was the campaign's last clip.
  const justApproved = done === "approved" && order.status === "approved";
  const progress = justApproved && campaign ? campaignProgress(campaign, ws.orders) : undefined;
  const campaignClips =
    progress?.status === "completed"
      ? ws.orders.filter((o) => o.campaignId === campaign!.id && o.status === "approved").flatMap((o) => clipOf(o, ws) ?? [])
      : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={f.pick(order.title)}
        subtitle={order.number ? <bdi dir="ltr">#{order.number}</bdi> : undefined}
        back={{ href: "/orders", label: t("ordersPage.title") }}
      >
        <StatusBadge order={orderBadgeStatus(order)} />
        <form action={messageCreator.bind(null, order.creatorId, order.brandId)}>
          <button
            type="submit"
            aria-label={unread > 0 ? `${t("campaignDetail.messages")} · ${tp("chat.unread", unread)}` : t("campaignDetail.messages")}
            className="relative grid size-9 place-items-center rounded-full border border-border text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <MessageCircle aria-hidden className="size-[18px]" />
            {unread > 0 && (
              <span aria-hidden className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-caption font-medium text-on-brand tabular-nums">
                {unread}
              </span>
            )}
          </button>
        </form>
        {campaign && (
          <LinkButton href={`/campaigns/${campaign.id}`} variant="secondary" className="h-9 md:h-9">
            <Megaphone aria-hidden />
            {t("checkout.viewCampaign")}
          </LinkButton>
        )}
      </PageHeader>

      {done === "offerSent" && <Notice>{t("orderDetail.doneOfferSent", { name })}</Notice>}
      {justApproved && (
        <ApprovalMoment
          title={progress?.status === "completed" ? t("orderDetail.campaignCompleteTitle") : t("orderDetail.approvedTitle")}
          subtitle={
            progress?.status === "completed"
              ? `${tp("orderDetail.campaignCompleteBody", progress.approved)} ${t("orderDetail.approvedPaid", { name })}`
              : t("orderDetail.approvedPaid", { name })
          }
          closeHref={`/orders/${order.id}`}
          closeLabel={t("nav.close")}
          complete={
            campaignClips.length > 1 && (
              <ul className="grid w-full max-w-md grid-cols-4 gap-2 sm:grid-cols-6">
                {campaignClips.map((c, i) => (
                  <li key={c.id} className="motion-safe:animate-[pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]" style={{ animationDelay: `${950 + i * 90}ms` }}>
                    <ClipPoster clip={c} views={f.compact(c.views)} duration={c.durationSec ? f.duration(c.durationSec) : ""} compact />
                  </li>
                ))}
              </ul>
            )
          }
        >
          {!order.rating && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-small font-medium">{t("orderDetail.rateCreator", { name })}</p>
              <Stars orderId={order.id} label={t("orderDetail.rateCreator", { name })} />
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {clip && (
              <a href={clip.videoSrc} download className={buttonClass("secondary", "h-10 md:h-10")}>
                <Download aria-hidden />
                {t("orderDetail.downloadClip")}
              </a>
            )}
            <LinkButton href={`/creators/${creator.id}`} variant="secondary" className="h-10 md:h-10">
              <UserRound aria-hidden />
              {t("orderDetail.hireAgain", { name })}
            </LinkButton>
            {progress?.status === "completed" && (
              <LinkButton href={`/campaigns/${campaign!.id}`} variant="primary" className="h-10 md:h-10">
                <Megaphone aria-hidden />
                {t("checkout.viewCampaign")}
              </LinkButton>
            )}
          </div>
        </ApprovalMoment>
      )}
      {done === "revisionSent" && <Notice>{t("orderDetail.doneRevisionSent", { name })}</Notice>}
      {order.status === "pending" && (
        <Card className="p-4 sm:p-5">
          <OfferWaiting orderId={order.id} name={name} hoursLeft={offerHoursLeft(order, nowIso())} refund={f.money(brandPaid(order))} />
        </Card>
      )}
      {!active && (
        <Card className="p-4 sm:p-5">
          <OrderClosedNote status={order.status} reason={order.declineReason} note={order.declineNote} name={name} refund={f.money(brandPaid(order))} />
        </Card>
      )}
      {action && action !== "review" && product && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-warning/40 bg-warning-soft p-4 sm:p-5">
          <p className="flex items-start gap-2 font-medium">
            <Clock aria-hidden className="mt-1 size-4 shrink-0 text-warning" />
            {t(`flow.action.${action}`, { name, product: f.pick(product.name) })}
          </p>
          {action === "ship" ? (
            <ShipButton orderId={order.id} name={name} productName={f.pick(product.name)} />
          ) : (
            <form action={markOrderReturned.bind(null, order.id)}>
              <Button type="submit" variant="primary" className="h-9 md:h-9">
                {t("flow.button.collect")}
              </Button>
            </form>
          )}
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Nothing to show for an order that ended before any clip (declined, expired, withdrawn). */}
          {(watchable || active) && (
            <Card className="flex flex-col gap-4 p-4 sm:p-5">
              <h2 className="font-medium">{t("orderDetail.clip")}</h2>
              {watchable ? (
                <>
                  <ClipVersions versions={versions} title={f.pick(order.title)} className="mx-auto w-full max-w-[320px]" />
                  {adPlatformOf(order) && <AdCode orderId={order.id} platform={adPlatformOf(order)!} code={order.adCode} today={today()} />}
                  {order.status === "delivered" && (
                    <>
                      <p className="text-small text-text-muted">{t(watermarked ? "orderDetail.reviewHintPreview" : "orderDetail.reviewHint")}</p>
                      <ReviewActions orderId={order.id} creatorName={name} watermarked={watermarked} />
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <span className="grid size-14 place-items-center rounded-full bg-surface text-text-muted">
                    {order.status === "pending" ? <Hourglass aria-hidden className="size-6" /> : <Clapperboard aria-hidden className="size-6" />}
                  </span>
                  <p className="max-w-sm text-text-muted">
                    {order.status === "pending" && t("orderDetail.waitingPending", { name })}
                    {order.status === "in_progress" &&
                      (waitingFor(order, physical) === "receive" ? t("flow.waiting.receive", { name }) : t("orderDetail.waitingProgress", { name }))}
                  </p>
                </div>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 font-medium">{t("orderDetail.items")}</h2>
            <ul className="flex flex-col gap-2">
              {order.items.map((item) => (
                <li key={item.format} className="flex justify-between gap-3">
                  <span>
                    {t(`formats.${item.format}`)}
                  </span>
                  <span className="tabular-nums">{f.money(priceForBrand(item.price * item.quantity))}</span>
                </li>
              ))}
            </ul>
          </Card>

          {physical && active && (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-medium">{t("campaignDetail.shipping")}</h2>
              {order.shipTo && !order.shipping?.receivedAt && <ShipToLines to={order.shipTo} className="mb-1" />}
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
              <p className="flex items-center gap-1.5 text-small text-text-muted">
                {!returns && <Gift aria-hidden className="size-4 shrink-0" />}
                {returns ? t("campaignDetail.returnInfo") : t("campaignDetail.keepInfo")}
              </p>
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
              <Avatar id={creator.id} name={name} src={creator.photo} size="md" ring={creator.hasNewClips ? "new" : undefined} />
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
                [t("orderDetail.totalPaid"), <span key="paid" className="font-medium tabular-nums">{f.money(brandPaid(order))}</span>],
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

          {/* laqta support: the brand's latest report and its answer, or a way to send one. */}
          <Card className="flex flex-col gap-2 p-5">
            <h2 className="font-medium">{t("orderDetail.problem.cardTitle")}</h2>
            {report && (
              <div className="flex flex-col gap-1 text-small">
                <p className="flex items-center gap-1.5">
                  <Flag aria-hidden className="size-4 shrink-0 text-text-muted" />
                  {t(report.status === "open" ? "orderDetail.problem.open" : "orderDetail.problem.resolved", { date: f.date(dayOf(report.at)) })}
                </p>
                <p className="text-text-muted">{t(`orderDetail.problem.reasons.${report.reason}`)}</p>
                {report.resolution && (
                  <div className="rounded-[var(--radius-md)] bg-surface p-3">
                    <p className="text-caption text-text-muted">{t("orderDetail.problem.reply")}</p>
                    <p>{report.resolution}</p>
                  </div>
                )}
              </div>
            )}
            {!report && <p className="text-small text-text-muted">{t("orderDetail.problem.hint")}</p>}
            <ReportProblem orderId={order.id} canReport={report?.status !== "open"} />
          </Card>

          <Card className="p-5">
            <h2 className="font-medium">{t("orderDetail.progress")}</h2>
            {active && <p className="mb-3 text-small text-text-muted">{t("flow.stepCount", { n: stepIndex + 1, total: steps.length })}</p>}
            <ol className="flex flex-col">
              {steps.map((s, index) => {
                const complete = index < stepIndex || order.status === "approved";
                const current = index === stepIndex && order.status !== "approved" && active;
                return (
                  <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < steps.length - 1 && (
                      <span aria-hidden className={cn("absolute start-[11px] top-6 h-[calc(100%-24px)] w-0.5", complete ? "bg-primary" : "bg-border")} />
                    )}
                    <span
                      className={cn(
                        "relative grid size-6 shrink-0 place-items-center rounded-full border-2 text-caption leading-none font-medium tabular-nums",
                        complete && "border-primary bg-primary text-on-primary",
                        current && "border-primary bg-card",
                        !complete && !current && "border-border bg-card",
                      )}
                    >
                      {complete ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : <span className={current ? "text-primary" : "text-text-muted"}>{index + 1}</span>}
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
