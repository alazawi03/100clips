import Link from "next/link";
import { ChevronLeft, Film } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { APPLICATION_TONE } from "@/components/admin/tones";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { listApplications } from "@/lib/admin/applicationsApi";
import type { ApplicationStatus } from "@/lib/admin/data";
import { getI18n } from "@/lib/i18n/server";

const TABS: ApplicationStatus[] = ["pending", "changes_requested", "rejected", "approved"];

export default async function AdminApprovalsPage({ searchParams }: PageProps<"/admin/approvals">) {
  const { tab } = await searchParams;
  const status: ApplicationStatus = TABS.includes(tab as ApplicationStatus) ? (tab as ApplicationStatus) : "pending";
  const { t, tp, f, locale } = await getI18n();
  const applications = await listApplications();
  const list_ = new Intl.ListFormat(locale);
  // Oldest first: whoever applied first is reviewed first.
  const list = applications.filter((a) => a.status === status).sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.approvals.title")} subtitle={t("admin.approvals.subtitle")} />
      <FilterTabs
        label={t("admin.approvals.tabsLabel")}
        tabs={TABS.map((s) => ({ href: `/admin/approvals?tab=${s}`, label: t(`admin.approvals.status.${s}`), count: f.number(applications.filter((a) => a.status === s).length), active: s === status }))}
      />
      {list.length === 0 ? (
        <EmptyState title={t(`admin.approvals.empty.${status}`)} />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {list.map((a) => {
              const name = f.pick(a.name);
              return (
                <li key={a.id}>
                  <Link href={`/admin/approvals/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-surface sm:px-5">
                    <Avatar id={a.id} name={name} size="md" />
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-small text-text-muted">
                        <bdi dir="ltr">@{a.handle}</bdi>
                        {[f.pick(a.city), list_.format(a.niches.map((n) => t(`niches.${n}`)))].filter(Boolean).map((part) => ` · ${part}`)}
                      </p>
                    </div>
                    <p className="flex items-center gap-1 text-small text-text-muted">
                      <Film aria-hidden className="size-4" strokeWidth={1.75} />
                      {/* Sign-up sends the intro; samples come after approval. */}
                      {a.samples.length === 0 && a.hasIntro ? t("admin.approvals.intro") : tp("admin.approvals.samples", a.samples.length)}
                    </p>
                    <div className="text-end text-small text-text-muted">
                      <Badge tone={APPLICATION_TONE[a.status]}>{t(`admin.approvals.status.${a.status}`)}</Badge>
                      <p className="mt-1">{t("admin.approvals.appliedOn", { date: f.date(a.appliedAt.slice(0, 10)) })}</p>
                    </div>
                    <ChevronLeft aria-hidden className="size-5 rotate-180 text-text-muted rtl:rotate-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
