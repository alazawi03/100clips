import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { Badge } from "@/components/ui/Badge";
import { redirect } from "next/navigation";
import { listApplications } from "@/lib/admin/applicationsApi";
import { owedToCreators } from "@/lib/admin/money";
import { DEMO_TODAY } from "@/lib/data/account";
import { problemReports } from "@/lib/data/problems";
import { openWithdrawals } from "@/lib/data/wallet";
import { getI18n } from "@/lib/i18n/server";
import { getMe } from "@/lib/session";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("admin.title") };
}

/** 100clips' own panel: money, transfers to creators, and (later) orders, brands, creators and reports. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Admin accounts only (made by hand in the database); everyone else goes to their own dashboard.
  const me = await getMe();
  if (me?.account.role !== "admin") redirect("/dashboard");
  const { t } = await getI18n();
  // What waits on the admin: applications to review, creators to pay.
  const counts = {
    "/admin/approvals": (await listApplications()).filter((a) => a.status === "pending").length,
    "/admin/payouts": owedToCreators(DEMO_TODAY).length + openWithdrawals().length,
    "/admin/reports": problemReports.filter((r) => r.status === "open").length,
  };
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <Link href="/admin" aria-label={t("admin.nav.overview")} className="flex shrink-0 items-center gap-2 rounded-[var(--radius-sm)]">
            {/* The logo is a brand mark: never mirrored in RTL. */}
            <Image src="/100clips-wordmark-on-light.svg" alt="" width={575} height={128} priority className="h-5 w-auto dark:hidden sm:h-6" />
            <Image src="/100clips-wordmark-on-dark.svg" alt="" width={575} height={128} priority className="hidden h-5 w-auto dark:block sm:h-6" />
            <Badge>{t("admin.badge")}</Badge>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LanguageToggle />
          </div>
        </div>
      </header>
      <div className="md:flex">
        <AdminNav
          counts={counts}
          footer={
            <Link href="/dashboard" className="flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-small text-text-muted hover:bg-surface hover:text-text">
              <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} />
              {t("admin.nav.brandApp")}
            </Link>
          }
        />
        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 md:px-8 md:pt-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
