import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ActivityList } from "@/components/admin/ActivityList";
import { DecisionForm } from "@/components/admin/DecisionForm";
import { APPLICATION_TONE } from "@/components/admin/tones";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { getApplication } from "@/lib/admin/applicationsApi";
import { activityFor } from "@/lib/admin/data";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminApplicationPage({ params, searchParams }: PageProps<"/admin/approvals/[id]">) {
  const { id } = await params;
  const { decided } = await searchParams;
  const a = await getApplication(id);
  if (!a) notFound();
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const name = f.pick(a.name);
  const list = new Intl.ListFormat(locale);
  const last = a.decisions.at(-1);
  const socials = [
    a.instagram && { label: t("platforms.instagram"), handle: a.instagram, href: `https://www.instagram.com/${a.instagram}` },
    a.tiktok && { label: t("platforms.tiktok"), handle: a.tiktok, href: `https://www.tiktok.com/@${a.tiktok}` },
  ].filter((s): s is Exclude<typeof s, "" | undefined> => !!s);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={name} back={{ href: "/admin/approvals", label: t("admin.approvals.title") }} subtitle={t("admin.approvals.appliedOn", { date: f.date(a.appliedAt.slice(0, 10)) })}>
        <Badge tone={APPLICATION_TONE[a.status]}>{t(`admin.approvals.status.${a.status}`)}</Badge>
      </PageHeader>

      {decided && a.status !== "pending" && <Notice>{t(`admin.approvals.decided.${a.status}`, { name })}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {a.intro && (
            <Card className="flex flex-col gap-4 p-5">
              <h2 className="text-h3 font-medium">{t("admin.approvals.intro")}</h2>
              <p className="text-small text-text-muted">{t("admin.approvals.introHint")}</p>
              <video dir="ltr" src={a.intro} controls playsInline preload="metadata" aria-label={t("admin.approvals.intro")} className="aspect-[9/16] w-full max-w-60 rounded-[var(--radius-md)] bg-black object-cover" />
            </Card>
          )}

          {a.samples.length > 0 && <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-h3 font-medium">{t("admin.approvals.samplesTitle")}</h2>
            <p className="text-small text-text-muted">{t("admin.approvals.samplesHint")}</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {a.samples.map((s, i) => (
                <li key={s.id}>
                  {/* Media stays left-to-right in both languages. */}
                  <video dir="ltr" src={s.videoSrc} controls playsInline preload="metadata" aria-label={t("profile.sample", { n: i + 1 })} className="aspect-[9/16] w-full rounded-[var(--radius-md)] bg-black object-cover" />
                </li>
              ))}
            </ul>
          </Card>}

          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <Avatar id={a.id} name={name} size="lg" />
              <div className="min-w-0">
                <p className="font-medium">{name}</p>
                <p className="text-small text-text-muted">
                  <bdi dir="ltr">@{a.handle}</bdi> · {f.pick(a.city)} · <bdi dir="ltr">{a.phone}</bdi>
                </p>
              </div>
            </div>
            <p>{f.pick(a.bio)}</p>
            <dl className="grid gap-3 text-small sm:grid-cols-2">
              <div>
                <dt className="text-text-muted">{t("admin.approvals.niches")}</dt>
                <dd className="font-medium">{list.format(a.niches.map((n) => t(`niches.${n}`)))}</dd>
              </div>
              <div>
                <dt className="text-text-muted">{t("admin.approvals.prices")}</dt>
                <dd className="flex flex-col">
                  {a.formats.map((o) => (
                    <span key={o.format} className="font-medium">
                      {t(`formats.${o.format}`)} · <span className="tabular-nums">{f.money(o.price)}</span>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <ul className="flex flex-col gap-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-3 py-2 hover:bg-border">
                    <span className="min-w-0">
                      <span className="block text-small text-text-muted">{s.label}</span>
                      <bdi dir="ltr" className="block truncate font-medium">
                        @{s.handle}
                      </bdi>
                    </span>
                    <ExternalLink aria-hidden className="size-4 shrink-0 text-text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="flex flex-col gap-4 p-5 lg:sticky lg:top-24">
          {a.status === "pending" ? (
            <>
              <h2 className="text-h3 font-medium">{t("admin.approvals.reviewTitle")}</h2>
              <DecisionForm id={a.id} />
            </>
          ) : (
            <>
              <h2 className="text-h3 font-medium">{t("admin.approvals.lastDecision")}</h2>
              {last && (
                <div className="flex flex-col gap-2">
                  <Badge tone={APPLICATION_TONE[last.status]} className="w-fit">
                    {t(`admin.approvals.status.${last.status}`)}
                  </Badge>
                  <p className="text-small text-text-muted">{f.messageTime(last.at, "")}</p>
                  {last.note && <p className="rounded-[var(--radius-md)] bg-surface p-3 text-small">“{last.note}”</p>}
                </div>
              )}
              <p className="text-small text-text-muted">{t(`admin.approvals.after.${a.status}`)}</p>
              {a.status === "approved" && (
                <Link href={`/admin/users/creators/${a.id}`} className="text-small font-medium text-primary hover:underline">
                  {t("admin.approvals.openProfile")}
                </Link>
              )}
            </>
          )}
        </Card>
      </div>

      <ActivityList actions={activityFor("application", a.id)} i18n={i18n} />
    </div>
  );
}
