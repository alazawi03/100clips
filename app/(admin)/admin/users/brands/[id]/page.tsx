import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { ActivityList } from "@/components/admin/ActivityList";
import { ResetLoginButton, SuspendControl } from "@/components/admin/AdminForms";
import { OrderHistory } from "@/components/admin/OrderHistory";
import { Badge } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { activityFor, platformOrders } from "@/lib/admin/data";
import { brandRows } from "@/lib/admin/users";
import { getCreator } from "@/lib/data/creators";
import { suspensionOf } from "@/lib/data/moderation";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminBrandPage({ params }: PageProps<"/admin/users/brands/[id]">) {
  const { id } = await params;
  const row = brandRows().find((r) => r.brand.id === id);
  if (!row) notFound();
  const { brand, owner, balance, spent } = row;
  const i18n = await getI18n();
  const { t, f } = i18n;
  const name = f.pick(brand.name);
  const suspension = suspensionOf("brand", id);
  const orders = platformOrders().filter((o) => o.brandId === id);
  const links = [
    !!brand.website && { label: t("admin.users.website"), value: brand.website!.replace(/^https?:\/\//, ""), href: brand.website! },
    !!brand.instagram && { label: t("platforms.instagram"), value: `@${brand.instagram}`, href: `https://www.instagram.com/${brand.instagram}` },
    !!brand.tiktok && { label: t("platforms.tiktok"), value: `@${brand.tiktok}`, href: `https://www.tiktok.com/@${brand.tiktok}` },
  ].filter((l): l is { label: string; value: string; href: string } => !!l);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={name} back={{ href: "/admin/users?tab=brands", label: t("admin.users.title") }} subtitle={t(`industries.${brand.industry}`)}>
        <Badge tone={suspension ? "error" : "success"}>{t(suspension ? "admin.users.suspendedBadge" : "admin.users.active")}</Badge>
        <ResetLoginButton kind="brand" id={id} />
        <SuspendControl kind="brand" id={id} name={name} suspended={!!suspension} />
      </PageHeader>

      {suspension && (
        <Card className="flex items-start gap-3 border-error/30 bg-error-soft p-4">
          <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-error" />
          <div>
            <p className="font-medium">{t("admin.users.suspendedSince", { date: f.date(suspension.at.slice(0, 10)) })}</p>
            <p className="text-small text-text-muted">“{suspension.reason}”</p>
            <p className="text-small text-text-muted">{t("admin.users.suspendWhat.brand")}</p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <BrandLogo id={id} name={name} src={brand.logo} size="lg" />
            <div className="min-w-0">
              <p className="font-medium">{name}</p>
              {brand.about && <p className="text-small text-text-muted">{f.pick(brand.about)}</p>}
            </div>
          </div>
          <dl className="grid gap-3 text-small sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">{t("admin.users.owner")}</dt>
              <dd className="font-medium">{f.pick(owner.name)}</dd>
              <dd>
                <bdi dir="ltr">{owner.email}</bdi>
              </dd>
              <dd>
                <bdi dir="ltr">{owner.phone}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">{t("admin.users.balance")}</dt>
              <dd className="font-medium tabular-nums">{f.money(balance)}</dd>
              <dt className="mt-2 text-text-muted">{t("admin.users.spentTotal")}</dt>
              <dd className="font-medium tabular-nums">{f.money(spent)}</dd>
            </div>
          </dl>
          {links.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-small">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 hover:bg-border">
                    <span className="text-text-muted">{l.label}</span>
                    <bdi dir="ltr" className="font-medium">
                      {l.value}
                    </bdi>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-h3 font-medium">{t("admin.users.registration")}</h2>
          {(brand.countries ?? []).length === 0 ? (
            <p className="text-small text-text-muted">{t("admin.users.noRegistration")}</p>
          ) : (
            <ul className="divide-y divide-border text-small">
              {(brand.countries ?? []).map((c) => {
                const reg = brand.registrations?.[c];
                return (
                  <li key={c} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="font-medium">{t(`countries.${c}`)}</span>
                    <span className="flex flex-wrap gap-2">
                      <Badge tone={reg?.crNumber ? "success" : "warning"}>{reg?.crNumber ? t("admin.users.cr", { number: reg.crNumber }) : t("admin.users.noCr")}</Badge>
                      <Badge tone={reg?.vatCertificate ? "success" : "neutral"}>{t(reg?.vatCertificate ? "admin.users.vat" : "admin.users.noVat")}</Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <OrderHistory orders={orders} who={(o) => { const c = getCreator(o.creatorId); return c ? f.pick(c.name) : o.creatorId; }} i18n={i18n} />

      <ActivityList actions={activityFor("brand", id)} i18n={i18n} />
    </div>
  );
}
