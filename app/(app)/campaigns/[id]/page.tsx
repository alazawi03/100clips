import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarClock, CalendarPlus, ChevronRight, CircleCheck, CircleX, ExternalLink, Gift, ImageOff, Lock, X } from "lucide-react";
import { ActionCallout, CalmCallout } from "@/components/brand/ActionCallout";
import { CampaignLayout } from "@/components/brand/campaigns/CampaignLayout";
import { CampaignMenu } from "@/components/brand/campaigns/CampaignMenu";
import { AddCreatorMenu } from "@/components/brand/campaigns/InviteMenus";
import { ClipsGallery } from "@/components/brand/campaigns/ClipsGallery";
import { ShowBriefButton } from "@/components/brand/campaigns/ShowBriefButton";
import { OpenOrderButton, OrderCard } from "@/components/brand/campaigns/OrderCard";
import { CampaignStatus } from "@/components/brand/campaigns/CampaignStatus";
import { orderCardView, productOf, type OrderCardView } from "@/components/brand/campaigns/campaignView";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { DEMO_TODAY, getBrand } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { getCreator } from "@/lib/data/creators";
import { orders as allOrders } from "@/lib/data/orders";
import { nobodyAccepted } from "@/lib/data/store";
import type { Platform } from "@/lib/data/types";
import { getI18n, type I18n } from "@/lib/i18n/server";
import { eventsOf } from "@/lib/orderFlow";
import { campaignProgress } from "@/lib/statuses";
import { cn } from "@/lib/cn";


/** Which platform a reference link points to, for its logo. */
function platformOfUrl(url: string): Platform | undefined {
  const host = url.replace(/^https?:\/\/(www\.|m\.)?/, "").split("/")[0];
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("instagram.com")) return "instagram";
}

/** "2026-10-03" → "2026-10-04". */
function nextDay(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Brand actions first (late ones first), in the order they unblock creators. */
const ACTION_ORDER = { review: 0, ship: 1, collect: 2 } as const;
/** When nothing needs the brand, the most useful thing to wait on. */
const WAITING_ORDER = { accept: 0, receive: 1, filming: 2, revision: 3, done: 4, cancelled: 5 } as const;

/** The label of each extra detail, for the edit history. */
const DETAIL_LABEL = { keyMessage: "checkout.keyMessage", references: "checkout.references", mustInclude: "checkout.mustInclude", avoid: "checkout.avoid" } as const;

export default async function CampaignDetailPage({ params, searchParams }: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  // Set by the ⋯ menu after saving: confirm it, and mark what changed.
  const { done } = await searchParams;
  const campaign = getCampaign(id);
  if (!campaign) notFound();
  // A draft has nothing to show yet: it opens where it was left.
  if (campaign.status === "draft") redirect(`/campaigns/new?draft=${campaign.id}`);
  const i18n = await getI18n();
  const { t, tp, f } = i18n;

  const brand = getBrand(campaign.brandId);
  const { product } = productOf(campaign);
  const productName = product ? f.pick(product.name) : "";
  const its = allOrders.filter((o) => o.campaignId === campaign.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const views = its.map((o) => orderCardView(o, campaign, i18n));
  const progress = campaignProgress(campaign, allOrders);
  const cancelled = campaign.status === "cancelled";
  // Edits only while no creator is held to the old details.
  const canEdit = nobodyAccepted(campaign.id) && !cancelled;
  // A later deadline only helps creators who still owe a clip.
  const canExtend = !!campaign.deadline && its.some((o) => o.status === "pending" || o.status === "in_progress");
  const extended = campaign.events?.some((e) => e.type === "deadlineMoved") ?? false;
  const lastEdit = campaign.events?.findLast((e) => e.type === "detailsEdited");
  const lastEditFields = lastEdit?.type === "detailsEdited" && lastEdit.changes?.length ? lastEdit.changes.map((c) => t(DETAIL_LABEL[c.field])).join(t("common.separator")) : undefined;
  const tomorrow = nextDay(DEMO_TODAY);

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
            {/* The review count is the banner's job here, not a tag. */}
            <CampaignStatus progress={progress} showReview={false} className="mt-1.5" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status !== "cancelled" && <AddCreatorMenu campaignId={campaign.id} />}
          <CampaignMenu
            campaignId={campaign.id}
            cancelled={cancelled}
            canEdit={canEdit}
            details={{ keyMessage: campaign.keyMessage, references: campaign.references ?? [], mustInclude: campaign.mustInclude, avoid: campaign.avoid }}
            deadline={campaign.deadline}
            canExtend={canExtend}
            minDeadline={campaign.deadline && campaign.deadline >= tomorrow ? nextDay(campaign.deadline) : tomorrow}
          />
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
        <span
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-3",
            done === "deadlineExtended" ? "bg-success-soft text-text motion-safe:animate-[pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]" : "bg-surface text-text-muted",
          )}
        >
          <CalendarClock aria-hidden className="size-4" />
          {campaign.deadline ? t("flow.due", { date: f.date(campaign.deadline) }) : t("campaignDetail.noDeadline")}
          {extended && (
            <span className="ms-0.5 rounded-full bg-card px-2 py-0.5 text-caption font-medium text-success">{t("campaignDetail.deadlineExtendedTag")}</span>
          )}
        </span>
      </div>
    </header>
  );

  /* ---------- Next action ---------- */
  const todo = views
    .filter((v): v is OrderCardView & { action: NonNullable<OrderCardView["action"]> } => !!v.action)
    .sort((a, b) => Number(b.late) - Number(a.late) || ACTION_ORDER[a.action] - ACTION_ORDER[b.action]);
  const waiting = views.filter((v) => v.status !== "cancelled").sort((a, b) => Number(b.late) - Number(a.late) || WAITING_ORDER[a.waiting] - WAITING_ORDER[b.waiting])[0];
  // One callout per kind of action ("2 clips waiting for your review"); its button opens the first such order.
  const groups = (["review", "ship", "collect"] as const)
    .map((action) => ({ action, items: todo.filter((v) => v.action === action) }))
    .filter((g) => g.items.length > 0);
  const banner =
    groups.length > 0 ? (
      <div className="flex flex-col gap-3">
        {groups.map(({ action, items }) => (
          <ActionCallout
            key={action}
            title={tp(`flow.group.${action}`, items.length)}
            detail={`${items.map((v) => v.name).join(t("common.separator"))} · ${tp("flow.waitingDays", Math.max(...items.map((v) => v.actionDays ?? 0)))}`}
            action={<OpenOrderButton orderId={items[0].id} label={t(`flow.groupButton.${action}`)} />}
          />
        ))}
      </div>
    ) : (
      <CalmCallout>{waiting && waiting.waiting !== "done" ? t(`flow.waiting.${waiting.waiting}`, { name: waiting.name }) : t("flow.calm")}</CalmCallout>
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
    .filter((v) => v.clip && (v.status === "delivered" || v.status === "approved"))
    .map((v) => ({ orderId: v.id, creatorId: v.creatorId, name: v.name, status: v.status, clip: v.clip! }));

  /* ---------- Activity ---------- */
  const events = [
    ...its.flatMap((o) => eventsOf(o).map((e, i) => ({ ...e, key: `${o.id}-${i}`, text: t(`flow.events.${e.type}`, { name: f.pick(getCreator(o.creatorId)!.name) }) }))),
    ...(campaign.createdAt ? [{ type: "created", at: campaign.createdAt, key: "created", text: t("campaignDetail.campaignCreated") }] : []),
    ...(campaign.events ?? []).map((e, i) => ({
      ...e,
      key: `campaign-${i}`,
      text:
        e.type === "deadlineMoved"
          ? e.from
            ? t("campaignDetail.deadlineMovedFrom", { from: f.date(e.from), to: f.date(e.deadline) })
            : t("campaignDetail.deadlineMovedEvent", { date: f.date(e.deadline) })
          : e.changes?.length
            ? t("campaignDetail.detailsEditedFields", { fields: e.changes.map((c) => t(DETAIL_LABEL[c.field])).join(t("common.separator")) })
            : t("campaignDetail.detailsEditedEvent"),
      // What each edited field said before and after.
      changes: e.type === "detailsEdited" ? e.changes?.map((c) => ({ label: t(DETAIL_LABEL[c.field]), before: c.before, after: c.after })) : undefined,
    })),
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
      {(done === "deadlineExtended" || done === "detailsEdited") && (
        <Notice
          action={
            <span className="flex items-center gap-1">
              {done === "detailsEdited" && <ShowBriefButton label={t("campaignDetail.seeDetails")} />}
              <Link href={`/campaigns/${campaign.id}`} scroll={false} aria-label={t("nav.close")} className="grid size-8 place-items-center rounded-full text-text-muted hover:bg-card hover:text-text">
                <X aria-hidden className="size-4" />
              </Link>
            </span>
          }
        >
          {done === "deadlineExtended"
            ? t("campaignDetail.doneDeadlineExtended", { date: f.date(campaign.deadline!) })
            : lastEditFields
              ? t("campaignDetail.doneDetailsEditedFields", { fields: lastEditFields })
              : t("campaignDetail.doneDetailsEdited")}
        </Notice>
      )}
      {campaign.status === "cancelled" && <Notice tone="info">{t("campaignDetail.cancelledNote")}</Notice>}
      <CampaignLayout
        banner={banner}
        orders={ordersSection}
        brief={<BriefPanel campaignId={campaign.id} i18n={i18n} justEdited={done === "detailsEdited"} />}
        clips={<ClipsGallery items={clipItems} />}
        activity={activity}
      />
    </div>
  );
}

type TimelineEvent = { key: string; at: string; text: string; changes?: Array<{ label: string; before?: string; after?: string }> };

function Timeline({ events, i18n }: { events: TimelineEvent[]; i18n: I18n }) {
  const { t, f } = i18n;
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => (
        <li key={e.key} className="relative flex gap-3 pb-3 last:pb-0">
          {i < events.length - 1 && <span aria-hidden className="absolute start-[5px] top-4 h-[calc(100%-12px)] w-px bg-border" />}
          <span aria-hidden className="relative mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
          <span className="flex min-w-0 flex-col">
            <span className="text-small">{e.text}</span>
            {e.changes && e.changes.length > 0 && (
              <dl className="mt-1.5 flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-surface p-2.5 text-caption">
                {e.changes.map((c) => (
                  <div key={c.label} className="flex flex-col gap-0.5">
                    <dt className="font-medium">{c.label}</dt>
                    <dd dir="auto" className="whitespace-pre-line break-words text-text-muted line-through">{c.before ?? t("campaignDetail.emptyValue")}</dd>
                    <dd dir="auto" className="whitespace-pre-line break-words">{c.after ?? t("campaignDetail.emptyValue")}</dd>
                  </div>
                ))}
              </dl>
            )}
            {/* Edits carry a time, so they show it; order events are by day. */}
            <span className="text-caption text-text-muted">{e.at.length > 10 ? f.messageTime(e.at, DEMO_TODAY) : f.date(e.at.slice(0, 10))}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Read-only brief: the basics locked at payment, the extra details, logistics and notes. */
function BriefPanel({ campaignId, i18n, justEdited }: { campaignId: string; i18n: I18n; justEdited?: boolean }) {
  const { t, f } = i18n;
  const campaign = getCampaign(campaignId)!;
  const { product, returns, physical } = productOf(campaign);
  const notes = allOrders.filter((o) => o.campaignId === campaignId && o.note);
  // Marked so creators and the brand can tell the details changed after the offer went out.
  const editedAt = campaign.events?.findLast((e) => e.type === "detailsEdited")?.at;
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
            <BriefGroup title={t("campaignDetail.stage2")} hint={editedAt ? t("campaignDetail.edited", { date: f.messageTime(editedAt, DEMO_TODAY) }) : undefined} highlight={justEdited}>
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
              <p className="flex items-center gap-1.5 text-small">
                {!returns && <Gift aria-hidden className="size-4 shrink-0" />}
                {returns ? t("campaignDetail.returnInfo") : t("campaignDetail.keepInfo")}
              </p>
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

/** `highlight`: just saved, so the "Edited" mark stands out. */
function BriefGroup({ title, hint, locked, highlight, children }: { title: string; hint?: string; locked?: boolean; highlight?: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="flex flex-wrap items-center gap-1.5 text-small font-medium">
        {locked && <Lock aria-hidden className="size-3.5 text-text-muted" />}
        {title}
        {hint &&
          (highlight ? (
            <span className="rounded-full bg-success-soft px-2 py-0.5 font-medium text-success motion-safe:animate-[pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]">{hint}</span>
          ) : (
            <span className="font-normal text-text-muted">· {hint}</span>
          ))}
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
