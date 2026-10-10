import Link from "next/link";
import { Flag, MessageCircleWarning } from "lucide-react";
import { ResolveProblemButton } from "@/components/admin/AdminForms";
import { Badge } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card, SectionHeader } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { platformBrand } from "@/lib/admin/money";
import { getPlatformOrder } from "@/lib/admin/orders";
import { getCreator } from "@/lib/data/creators";
import { getConversation, reports as chatReports } from "@/lib/data/messages";
import { problemReports } from "@/lib/data/problems";
import { getI18n } from "@/lib/i18n/server";

/** What brands reported: problems on an order (resolved here with a reply), and chats flagged as abusive or off-platform. */
export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  const { tab } = await searchParams;
  const status = tab === "resolved" ? "resolved" : "open";
  const { t, f } = await getI18n();
  const list = problemReports.filter((r) => r.status === status).sort((a, b) => (status === "open" ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.reports.title")} subtitle={t("admin.reports.subtitle")} />

      <section aria-labelledby="problems-title" className="flex flex-col gap-4">
        <SectionHeader id="problems-title" title={t("admin.reports.problemsTitle")} hint={t("admin.reports.problemsHint")} />
        <FilterTabs
          label={t("admin.reports.tabsLabel")}
          tabs={(["open", "resolved"] as const).map((s) => ({ href: `/admin/reports?tab=${s}`, label: t(`admin.reports.status.${s}`), count: f.number(problemReports.filter((r) => r.status === s).length), active: s === status }))}
        />
        {list.length === 0 ? (
          <EmptyState title={t(`admin.reports.empty.${status}`)} />
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((r) => {
              const order = getPlatformOrder(r.orderId);
              const brand = platformBrand(r.brandId);
              const brandName = brand ? f.pick(brand.name) : r.brandId;
              const creator = order ? getCreator(order.creatorId) : undefined;
              return (
                <Card key={r.id} className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <BrandLogo id={r.brandId} name={brandName} src={brand?.logo} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t(`admin.reports.reasons.${r.reason}`)}</p>
                      <p className="text-small text-text-muted">
                        {brandName}
                        {creator && <> · {f.pick(creator.name)}</>} · {f.messageTime(r.at, "")}
                      </p>
                    </div>
                    <Badge tone={r.status === "open" ? "warning" : "success"}>{t(`admin.reports.status.${r.status}`)}</Badge>
                  </div>
                  <p dir="auto" className="rounded-[var(--radius-md)] bg-surface p-3">
                    {r.details}
                  </p>
                  {order && (
                    <Link href={`/admin/orders/${order.id}`} className="w-fit text-small font-medium text-primary hover:underline">
                      {t("admin.reports.openOrder", { title: f.pick(order.title), id: order.id })}
                    </Link>
                  )}
                  {r.status === "resolved" ? (
                    <div className="border-t border-border pt-3 text-small">
                      <p className="text-text-muted">{t("admin.reports.repliedOn", { date: f.messageTime(r.resolvedAt ?? r.at, "") })}</p>
                      <p dir="auto">“{r.resolution}”</p>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <ResolveProblemButton id={r.id} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="chat-reports-title">
        <SectionHeader id="chat-reports-title" title={t("admin.reports.chatTitle")} hint={t("admin.reports.chatHint")} />
        {chatReports.length === 0 ? (
          <p className="flex items-center gap-2 text-small text-text-muted">
            <Flag aria-hidden className="size-4" />
            {t("admin.reports.chatEmpty")}
          </p>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {[...chatReports].reverse().map((r) => {
                const chat = getConversation(r.conversationId);
                const brand = chat ? platformBrand(chat.brandId) : undefined;
                const creator = chat ? getCreator(chat.creatorId) : undefined;
                return (
                  <li key={r.id} className="flex gap-3 p-4 sm:px-5">
                    <MessageCircleWarning aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t(`chat.reportReasons.${r.reason}`)}</p>
                      <p className="text-small text-text-muted">
                        {brand ? f.pick(brand.name) : "?"} → {creator ? f.pick(creator.name) : "?"} · {f.messageTime(r.at, "")}
                      </p>
                      {r.details && (
                        <p dir="auto" className="text-small">
                          “{r.details}”
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
