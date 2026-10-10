import Link from "next/link";
import { BadgeCheck, CalendarDays, Hourglass, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import type { Results } from "@/lib/dashboard";
import type { I18n } from "@/lib/i18n/server";

/**
 * The KPIs at the top of the dashboard: approved clips, clips on the way, spend so far, and spend this
 * month next to last month. (Views need the platforms' APIs: after the MVP.)
 */
export function ResultsRow({ results, i18n }: { results: Results; i18n: I18n }) {
  const { t, tp, f } = i18n;

  return (
    <section aria-labelledby="kpi-title">
      <h2 id="kpi-title" className="sr-only">
        {t("brandHome.kpiTitle")}
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={BadgeCheck}
          label={t("brandHome.statApproved")}
          value={f.number(results.approvedClips)}
          hint={tp("brandHome.fromCreators", results.creators)}
          href="/orders?status=approved"
          linkLabel={t("brandHome.seeApproved")}
        />
        <Stat
          icon={Hourglass}
          label={t("brandHome.statOnTheWay")}
          value={f.number(results.onTheWay)}
          hint={tp("brandHome.waitingReview", results.toReview)}
          href="/orders"
          linkLabel={t("ordersPage.title")}
        />
        <Stat
          icon={Wallet}
          label={t("brandHome.statSpent")}
          value={f.money(results.spent)}
          hint={results.held > 0 ? t("brandHome.heldForOnTheWay", { amount: f.money(results.held) }) : undefined}
        />
        <Stat icon={CalendarDays} label={t("brandHome.statThisMonth")} value={f.money(results.spentThisMonth)} hint={t("brandHome.lastMonth", { amount: f.money(results.spentLastMonth) })} />
      </ul>
    </section>
  );
}

function Stat({ icon: Icon, label, value, hint, href, linkLabel }: { icon: LucideIcon; label: string; value: ReactNode; hint?: string; href?: string; linkLabel?: string }) {
  const body = (
    <Card className="flex h-full flex-col gap-2 p-4 sm:p-5">
      <span className="flex items-center gap-2 text-small text-text-muted">
        <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
        {label}
      </span>
      <span className="text-h1 font-medium tabular-nums">{value}</span>
      {hint && <span className="text-caption text-text-muted">{hint}</span>}
    </Card>
  );
  return (
    <li>
      {href ? (
        <Link href={href} aria-label={linkLabel ? `${label}: ${value}. ${linkLabel}` : undefined} className="block h-full rounded-[var(--radius-xl)] transition-transform duration-200 hover:-translate-y-0.5">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}
