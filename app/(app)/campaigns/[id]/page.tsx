import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CalendarPlus, ChevronRight, CircleCheck, Clock, Copy, CircleX, ExternalLink, Hourglass, ImageOff, Lock, } from "lucide-react";
import { duplicateCampaign } from "@/app/actions/brand";
import { CampaignLayout } from "@/components/brand/campaigns/CampaignLayout";
import { CampaignMenu } from "@/components/brand/campaigns/CampaignMenu";
import { AddCreatorMenu } from "@/components/brand/campaigns/InviteMenus";
import { ClipsGallery } from "@/components/brand/campaigns/ClipsGallery";
import { NextActionButton, OrderCard } from "@/components/brand/campaigns/OrderCard";
import { orderCardView, productOf, type OrderCardView } from "@/components/brand/campaigns/campaignView";
import { Badge, campaignTone } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { DEMO_TODAY, getBrand } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { getCreator } from "@/lib/data/creators";
import { orders as allOrders } from "@/lib/data/orders";
import type { Platform } from "@/lib/data/types";
import { getI18n, type I18n } from "@/lib/i18n/server";
import { daysUntil, eventsOf } from "@/lib/orderFlow";


/** Which platform a reference link points to, for its logo. */
function platformOfUrl(url: string): Platform | undefined {
  const host = url.replace(/^https?:\/\/(www\.|m\.)?/, "").split("/")[0];
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
}

/** Brand actions first (late ones first), in the order they unblock creators. */
const ACTION_ORDER = { review: 0, ship: 1, collect: 2 } as const;
/** When nothing needs the brand, the most useful thing to wait on. */
const WAITING_ORDER = { accept: 0, receive: 1, filming: 2, revision: 3, checking: 4, done: 5, cancelled: 6 } as const;

export default async function CampaignDetailPage({ params }: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign) notFound();
  const i18n = await getI18n();
  const { t, tp, f } = i18n;

  const brand = getBrand(campaign.brandId);
  const { product } = productOf(campaign);
  const productName = product ? f.pick(product.name) : "";
  const its = allOrders.filter((o) => o.campaignId === campaign.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const views = its.map((o) => orderCardView(o, campaign, i18n));
  const live = its.filter((o) => o.status !== "cancelled");

  const deliveredCount = live.filter((o) => o.status === "delivered" || o.status === "approved").length;
  const canCancel = its.length > 0 && its.every((o) => o.status === "pending" || o.status === "cancelled") && campaign.status !== "cancelled";

  /* ---------- Header ---------- */
  const header = (
    <header className="flex flex-col gap-4">
      <Link href="/campaigns" className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] text-small text-text-muted hover:text-text">
        <ChevronRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" />
        {t("campaignsPage.title")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {brand && <BrandLogo id={brand.id} name={f.pick(brand.name)} src={brand.logo} size="lg" />}
          <div className="min-w-0">
            <h1 className="text-h1 font-medium text-balance">{f.pick(campaign.title)}</h1>
            <p className="flex flex-wrap items-center gap-2 text-small text-text-muted">
              <Badge tone={campaignTone[campaign.status]}>{t(`status.campaign.${campaign.status}`)}</Badge>
              {live.length > 0 && t("campaignDetail.deliveredOf", { done: f.number(deliveredCount), total: f.number(live.length) })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status !== "cancelled" && <AddCreatorMenu campaignId={campaign.id} />}
          {product && (
            <form action={duplicateCampaign.bind(null, campaign.id)}>
              <Button type="submit" variant="secondary">
                <Copy aria-hidden />
                {t("campaignDetail.duplicate")}
              </Button>
            </form>
          )}
          <CampaignMenu campaignId={campaign.id} canCancel={canCancel} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-small">
        {product && (
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-border ps-1 pe-3">
            <span className="relative grid size-7 place-items-center overflow-hidden rounded-full bg-surface">
              {product.photos[0] ? <Image src={product.photos[0]} alt="" fill unoptimized className="object-cover" /> : <ImageOff aria-hidden className="size-3.5 text-icon-inactive" />}
            </span>
            {productName}
          </span>
        )}
        {campaign.createdAt && (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-text-muted">
            <CalendarPlus aria-hidden className="size-4" />
            {t("campaignDetail.created", { date: f.date(campaign.createdAt) })}
          </span>
        )}
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-text-muted">
          <CalendarClock aria-hidden className="size-4" />
          {campaign.deadline ? t("flow.due", { date: f.date(campaign.deadline) }) : t("campaignDetail.noDeadline")}
        </span>
      </div>
    </header>
  );

  /* ---------- Next action ---------- */
  const todo = views
    .filter((v): v is OrderCardView & { action: NonNullable<OrderCardView["action"]> } => !!v.action)
    .sort((a, b) => Number(b.late) - Number(a.late) || ACTION_ORDER[a.action] - ACTION_ORDER[b.action]);
  const waiting = views.filter((v) => v.status !== "cancelled").sort((a, b) => Number(b.late) - Number(a.late) || WAITING_ORDER[a.waiting] - WAITING_ORDER[b.waiting])[0];
  const actionTitle = (v: (typeof todo)[number]) => t(`flow.action.${v.action}`, { name: v.name, product: productName });
  const banner =
    todo.length > 0 ? (
      <Card className="flex flex-col gap-3 border-warning/40 bg-warning-soft p-4 sm:p-5">
        {todo.length === 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-start gap-2">
              <Clock aria-hidden className="mt-1 size-4 shrink-0 text-warning" />
              <span>
                <span className="block font-medium">{actionTitle(todo[0])}</span>
                <span className="block text-small text-text-muted">{tp("flow.waitingDays", todo[0].actionDays ?? 0)}</span>
              </span>
            </p>
            <NextActionButton orderId={todo[0].id} action={todo[0].action} />
          </div>
        ) : (
          <>
            <p className="flex items-center gap-2 font-medium">
              <Clock aria-hidden className="size-4 text-warning" />
              {tp("flow.attention", todo.length)}
            </p>
            <ul className="flex flex-col divide-y divide-warning/20">
              {todo.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-small">
                    <span className="block">{actionTitle(v)}</span>
                    <span className="block text-caption text-text-muted">
                      {tp("flow.waitingDays", v.actionDays ?? 0)}
                      {v.late && <span className="ms-2 font-medium text-error">{t("flow.late")}</span>}
                    </span>
                  </span>
                  <NextActionButton orderId={v.id} action={v.action} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    ) : (
      <Card className="flex items-center gap-3 p-4 text-text-muted sm:p-5">
        <Hourglass aria-hidden className="size-5 shrink-0" />
        {waiting && waiting.waiting !== "done" ? t(`flow.waiting.${waiting.waiting}`, { name: waiting.name }) : t("flow.calm")}
      </Card>
    );

  /* ---------- Summary ---------- */
  const clipsOf = (pred: (s: string) => boolean) => live.filter((o) => pred(o.status)).reduce((n, o) => n + o.clips, 0);
  const moneyOf = (pred: (s: string) => boolean) => its.filter((o) => pred(o.status)).reduce((n, o) => n + o.amount, 0);
  const days = campaign.deadline ? daysUntil(campaign.deadline, DEMO_TODAY) : undefined;
  const summary = (
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard title={t("campaignDetail.summaryCreators")} value={f.number(live.length)}>
        {t("campaignDetail.summaryCreatorsLine", { accepted: f.number(live.filter((o) => o.status !== "pending").length), waiting: f.number(live.filter((o) => o.status === "pending").length) })}
      </SummaryCard>
      <SummaryCard title={t("campaignDetail.summaryClips")} value={f.number(clipsOf(() => true))}>
        {t("campaignDetail.summaryClipsLine", {
          ordered: f.number(clipsOf(() => true)),
          delivered: f.number(clipsOf((s) => s === "delivered" || s === "approved")),
          approved: f.number(clipsOf((s) => s === "approved")),
        })}
      </SummaryCard>
      <SummaryCard title={t("campaignDetail.summaryMoney")} value={f.money(moneyOf(() => true))}>
        <span className="block">
          {t("campaignDetail.released")} {f.money(moneyOf((s) => s === "approved"))}
        </span>
        {moneyOf((s) => s === "cancelled") > 0 && (
          <span className="block">
            {t("campaignDetail.returned")} {f.money(moneyOf((s) => s === "cancelled"))}
          </span>
        )}
      </SummaryCard>
      <SummaryCard
        title={t("checkout.deadline")}
        value={days === undefined ? "—" : days < 0 ? tp("campaignDetail.daysLate", -days) : tp("campaignDetail.daysLeft", days)}
        alert={days !== undefined && days < 0 && live.some((o) => o.status === "pending" || o.status === "in_progress")}
      >
        {campaign.deadline ? f.date(campaign.deadline) : t("campaignDetail.noDeadline")}
      </SummaryCard>
    </div>
  );

  /* ---------- Orders ---------- */
  const ordersSection = (
    <div className="flex flex-col gap-6">
      {views.length > 0 && (
        <section aria-labelledby="creators-title" className="flex flex-col gap-3">
          <SectionHeader id="creators-title" title={t("campaignDetail.creatorsTitle")} />
          <ul className="flex flex-col gap-3">
            {views.map((v) => (
              <li key={v.id}>
                <OrderCard order={v} productName={productName} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  /* ---------- Clips ---------- */
  const clipItems = views
    .filter((v) => v.clip && (v.status === "submitted" || v.status === "delivered" || v.status === "approved"))
    .map((v) => ({ orderId: v.id, creatorId: v.creatorId, name: v.name, status: v.status, clip: v.clip! }));

  /* ---------- Activity ---------- */
  const events = [
    ...its.flatMap((o) => eventsOf(o).map((e, i) => ({ ...e, key: `${o.id}-${i}`, text: t(`flow.events.${e.type}`, { name: f.pick(getCreator(o.creatorId)!.name) }) }))),
    ...(campaign.createdAt ? [{ type: "created", at: campaign.createdAt, key: "created", text: t("campaignDetail.campaignCreated") }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const activity = (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="font-medium">{t("campaignDetail.activity")}</h2>
      <Timeline events={events.slice(0, 8)} i18n={i18n} />
      {events.length > 8 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-small font-medium hover:underline [&::-webkit-details-marker]:hidden">{t("campaignDetail.showAll")}</summary>
          <div className="mt-3">
            <Timeline events={events.slice(8)} i18n={i18n} />
          </div>
        </details>
      )}
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {header}
      {campaign.status === "cancelled" && <Notice tone="info">{t("campaignDetail.cancelledNote")}</Notice>}
      <CampaignLayout
        banner={banner}
        summary={summary}
        orders={ordersSection}
        brief={<BriefPanel campaignId={campaign.id} i18n={i18n} />}
        clips={<ClipsGallery items={clipItems} />}
        activity={activity}
      />
    </div>
  );
}

function SummaryCard({ title, value, alert, children }: { title: string; value: string; alert?: boolean; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-small text-text-muted">{title}</span>
      <span className={alert ? "text-h3 font-medium text-error" : "text-h3 font-medium tabular-nums"}>{value}</span>
      <span className="text-caption text-text-muted">{children}</span>
    </Card>
  );
}

function Timeline({ events, i18n }: { events: Array<{ key: string; at: string; text: string }>; i18n: I18n }) {
  const { f } = i18n;
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => (
        <li key={e.key} className="relative flex gap-3 pb-3 last:pb-0">
          {i < events.length - 1 && <span aria-hidden className="absolute start-[5px] top-4 h-[calc(100%-12px)] w-px bg-border" />}
          <span aria-hidden className="relative mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
          <span className="flex min-w-0 flex-col">
            <span className="text-small">{e.text}</span>
            <span className="text-caption text-text-muted">{f.date(e.at.slice(0, 10))}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Read-only brief: the basics locked at payment, the extra details, logistics and notes. */
function BriefPanel({ campaignId, i18n }: { campaignId: string; i18n: I18n }) {
  const { t, f } = i18n;
  const campaign = getCampaign(campaignId)!;
  const { product, returns, physical } = productOf(campaign);
  const notes = allOrders.filter((o) => o.campaignId === campaignId && o.note);
  return (
    <Card>
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-5 [&::-webkit-details-marker]:hidden">
          <h2 className="font-medium">{t("campaignDetail.brief")}</h2>
          <ChevronRight aria-hidden className="size-5 rotate-90 text-text-muted transition-transform group-open:-rotate-90" />
        </summary>
        <div className="flex flex-col gap-5 px-5 pb-5">
          <BriefGroup title={t("campaignDetail.stage1")} hint={t("campaignDetail.stage1Hint")} locked>
            {product && <BriefRow label={t("campaignDetail.product")}>{f.pick(product.name)}</BriefRow>}
            {campaign.videoStyle && <BriefRow label={t("checkout.videoStyle")}>{t(`checkout.videoStyles.${campaign.videoStyle}`)}</BriefRow>}
            <BriefRow label={t("checkout.briefLabel")}>
              <span className="whitespace-pre-line">{f.pick(campaign.brief)}</span>
            </BriefRow>
            <BriefRow label={t("checkout.deadline")}>{campaign.deadline ? f.date(campaign.deadline) : t("campaignDetail.noDeadline")}</BriefRow>
          </BriefGroup>

          {(campaign.keyMessage || campaign.references?.length || campaign.mustInclude || campaign.avoid || product?.benefits.length || product?.concerns.length) && (
            <BriefGroup title={t("campaignDetail.stage2")}>
              {campaign.keyMessage && <BriefRow label={t("checkout.keyMessage")}>{campaign.keyMessage}</BriefRow>}
              {campaign.references && campaign.references.length > 0 && (
                <BriefRow label={t("checkout.references")}>
                  <ul className="flex flex-col gap-1.5">
                    {campaign.references.map((url) => {
                      const platform = platformOfUrl(url);
                      return (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                            {platform ? <PlatformLogo platform={platform} className="size-4 shrink-0" /> : <ExternalLink aria-hidden className="size-4 shrink-0 text-text-muted" />}
                            <bdi dir="ltr" className="truncate">
                              {url.replace(/^https?:\/\/(www\.)?/, "")}
                            </bdi>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </BriefRow>
              )}
              {campaign.mustInclude && (
                <BriefRow label={t("checkout.mustInclude")} icon={<CircleCheck aria-hidden className="size-4 text-success" />}>
                  <span className="whitespace-pre-line">{campaign.mustInclude}</span>
                </BriefRow>
              )}
              {campaign.avoid && (
                <BriefRow label={t("checkout.avoid")} icon={<CircleX aria-hidden className="size-4 text-error" />}>
                  <span className="whitespace-pre-line">{campaign.avoid}</span>
                </BriefRow>
              )}
              {product && product.benefits.length > 0 && (
                <BriefRow label={t("productDrawer.benefits")}>
                  <ul className="list-disc ps-5">
                    {product.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </BriefRow>
              )}
              {product && product.concerns.length > 0 && (
                <BriefRow label={t("productDrawer.concerns")}>
                  <dl className="flex flex-col gap-1.5">
                    {product.concerns.map((c, i) => (
                      <div key={i}>
                        <dt className="font-medium">{c.question}</dt>
                        {c.answer && <dd className="text-text-muted">{c.answer}</dd>}
                      </div>
                    ))}
                  </dl>
                </BriefRow>
              )}
            </BriefGroup>
          )}

          {physical && (
            <BriefGroup title={t("campaignDetail.logistics")}>
              <p className="text-small">{returns ? t("campaignDetail.returnInfo") : t("campaignDetail.keepInfo")}</p>
            </BriefGroup>
          )}

          {notes.length > 0 && (
            <BriefGroup title={t("campaignDetail.notesTitle")}>
              {notes.map((o) => (
                <BriefRow key={o.id} label={f.pick(getCreator(o.creatorId)!.name)}>
                  {o.note}
                </BriefRow>
              ))}
            </BriefGroup>
          )}
        </div>
      </details>
    </Card>
  );
}

function BriefGroup({ title, hint, locked, children }: { title: string; hint?: string; locked?: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="flex items-center gap-1.5 text-small font-medium">
        {locked && <Lock aria-hidden className="size-3.5 text-text-muted" />}
        {title}
        {hint && <span className="font-normal text-text-muted">· {hint}</span>}
      </h3>
      {children}
    </section>
  );
}

function BriefRow({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 text-small">
      <span className="flex items-center gap-1.5 text-text-muted">
        {icon}
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
