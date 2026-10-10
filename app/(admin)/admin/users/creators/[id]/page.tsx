import { notFound } from "next/navigation";
import { MessageCircle, ShieldAlert, TriangleAlert } from "lucide-react";
import { ActivityList } from "@/components/admin/ActivityList";
import { ResetLoginButton, SuspendControl } from "@/components/admin/AdminForms";
import { OrderHistory } from "@/components/admin/OrderHistory";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { activityFor, bankHistory, payouts, platformOrders } from "@/lib/admin/data";
import { platformBrand, recentBankChange } from "@/lib/admin/money";
import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { suspensionOf } from "@/lib/data/moderation";
import { getI18n } from "@/lib/i18n/server";

const spaced = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();

export default async function AdminCreatorPage({ params }: PageProps<"/admin/users/creators/[id]">) {
  const { id } = await params;
  const creator = getCreator(id);
  if (!creator) notFound();
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const name = f.pick(creator.name);
  const list = new Intl.ListFormat(locale);
  const suspension = suspensionOf("creator", id);
  const orders = platformOrders().filter((o) => o.creatorId === id);
  const approved = orders.filter((o) => o.status === "approved");
  const history = [...(bankHistory[id] ?? [])].reverse();
  const changedDays = recentBankChange(id, DEMO_TODAY);
  const transfers = payouts.filter((p) => p.creatorId === id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={name} back={{ href: "/admin/users?tab=creators", label: t("admin.users.title") }} subtitle={<bdi dir="ltr">@{creator.handle}</bdi>}>
        <Badge tone={suspension ? "error" : "success"}>{t(suspension ? "admin.users.suspendedBadge" : "admin.users.live")}</Badge>
        <LinkButton href={`/admin/users/creators/${id}/support`} variant="secondary">
          <MessageCircle aria-hidden />
          {t("admin.support.contact")}
        </LinkButton>
        <ResetLoginButton kind="creator" id={id} />
        <SuspendControl kind="creator" id={id} name={name} suspended={!!suspension} />
      </PageHeader>

      {suspension && (
        <Card className="flex items-start gap-3 border-error/30 bg-error-soft p-4">
          <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-error" />
          <div>
            <p className="font-medium">{t("admin.users.suspendedSince", { date: f.date(suspension.at.slice(0, 10)) })}</p>
            <p className="text-small text-text-muted">“{suspension.reason}”</p>
            <p className="text-small text-text-muted">{t("admin.users.suspendWhat.creator")}</p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <Avatar id={id} name={name} size="lg" />
            <div className="min-w-0">
              <p className="font-medium">{name}</p>
              <p className="text-small text-text-muted">{f.pick(creator.city)}</p>
            </div>
          </div>
          <p className="text-small">{f.pick(creator.bio)}</p>
          <dl className="grid gap-3 text-small sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">{t("admin.approvals.niches")}</dt>
              <dd className="font-medium">{list.format(creator.niches.map((n) => t(`niches.${n}`)))}</dd>
            </div>
            <div>
              <dt className="text-text-muted">{t("admin.approvals.prices")}</dt>
              <dd className="flex flex-col font-medium">
                {creator.formats.map((o) => (
                  <span key={o.format}>
                    {t(`formats.${o.format}`)} · <span className="tabular-nums">{f.money(o.price)}</span>
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">{t("admin.users.rating")}</dt>
              <dd className="font-medium">{creator.rating ? `${creator.rating.toFixed(1)} ★` : t("admin.users.noRating")}</dd>
            </div>
            <div>
              <dt className="text-text-muted">{t("admin.users.earnedTotal")}</dt>
              <dd className="font-medium tabular-nums">{f.money(approved.reduce((n, o) => n + o.amount, 0))}</dd>
            </div>
          </dl>
        </Card>

        <section aria-labelledby="bank-title">
          <SectionHeader id="bank-title" title={t("admin.users.bankTitle")} hint={t("admin.users.bankHint")} />
          {changedDays !== undefined && (
            <p className="mb-3 flex items-start gap-2 rounded-[var(--radius-md)] bg-warning-soft p-3 text-small">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              {t("admin.payouts.bankChanged", { days: f.number(changedDays) })}
            </p>
          )}
          {history.length === 0 ? (
            <p className="text-small text-text-muted">{t("admin.payouts.noBank")}</p>
          ) : (
            <Card>
              <ol className="divide-y divide-border">
                {history.map((b, i) => (
                  <li key={b.at} className="flex flex-col gap-0.5 p-4 text-small sm:px-5">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{b.accountName}</span>
                      {i === 0 ? <Badge tone="success">{t("admin.users.bankCurrent")}</Badge> : <Badge>{t("admin.users.bankOld")}</Badge>}
                    </span>
                    <span className={i === 0 ? "" : "text-text-muted line-through decoration-text-muted/50"}>
                      {b.bank} · <bdi dir="ltr">{spaced(b.iban)}</bdi>
                    </span>
                    <span className="text-caption text-text-muted">{t(b.by === "admin" ? "admin.users.bankByAdmin" : "admin.users.bankByCreator", { date: f.messageTime(b.at, "") })}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </section>
      </div>

      <OrderHistory orders={orders} who={(o) => { const b = platformBrand(o.brandId); return b ? f.pick(b.name) : o.brandId; }} i18n={i18n} amount="creatorPay" />

      <section aria-labelledby="transfers-title">
        <SectionHeader id="transfers-title" title={t("admin.users.transfers")} />
        {transfers.length === 0 ? (
          <p className="text-small text-text-muted">{t("admin.payouts.noHistory")}</p>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {transfers.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-small sm:px-5">
                  <span className="flex-1">{f.date(p.paidAt.slice(0, 10))}</span>
                  <span className="text-text-muted">
                    <bdi dir="ltr">{p.bankRef}</bdi> · <bdi dir="ltr">•••• {p.iban.slice(-4)}</bdi>
                  </span>
                  <span className="min-w-20 text-end font-medium tabular-nums">{f.money(p.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <ActivityList actions={activityFor("creator", id)} i18n={i18n} />
    </div>
  );
}
