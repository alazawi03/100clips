"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, CreditCard, Flag, LayoutDashboard, LifeBuoy, Package, UserCheck, Users, Wallet, type LucideIcon } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages";

type Item = { href: string; label: MessageKey; icon: LucideIcon; exact?: boolean };

const items: Item[] = [
  { href: "/admin", label: "admin.nav.overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/approvals", label: "admin.nav.approvals", icon: UserCheck },
  { href: "/admin/orders", label: "admin.nav.orders", icon: Package },
  { href: "/admin/payments", label: "admin.nav.payments", icon: CreditCard },
  { href: "/admin/payouts", label: "admin.nav.payouts", icon: ArrowLeftRight },
  { href: "/admin/reports", label: "admin.nav.reports", icon: Flag },
  { href: "/admin/support", label: "admin.nav.support", icon: LifeBuoy },
  { href: "/admin/money", label: "admin.nav.money", icon: Wallet },
  { href: "/admin/users", label: "admin.nav.users", icon: Users },
];

/** A count after the label: things waiting on the admin in that section. */
function Count({ n }: { n?: number }) {
  if (!n) return null;
  return <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-caption font-medium text-on-accent tabular-nums">{n}</span>;
}

const isActive = (item: Item, path: string) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));

/** Admin sidebar on desktop (inline start), pill tabs under the header on phones. */
export function AdminNav({ footer, counts = {} }: { footer?: React.ReactNode; counts?: Record<string, number> }) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <>
      <nav aria-label={t("admin.nav.label")} className="sticky top-16 z-30 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col gap-1 border-e border-border bg-background p-4 md:flex">
        {items.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 transition-colors duration-[120ms]",
                active ? "bg-primary-soft font-medium text-primary-on-soft" : "text-text hover:bg-surface",
              )}
            >
              <Icon aria-hidden className={cn("size-5", active ? "text-primary-on-soft" : "text-icon-inactive")} strokeWidth={1.75} />
              {t(item.label)}
              <Count n={counts[item.href]} />
            </Link>
          );
        })}
        {footer && <div className="mt-auto border-t border-border pt-3">{footer}</div>}
      </nav>

      <nav aria-label={t("admin.nav.label")} className="scrollbar-none sticky top-16 z-30 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:hidden">
        <ul className="flex w-max gap-2">
          {items.map((item) => {
            const active = isActive(item, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-small",
                    active ? "border-primary-soft bg-primary-soft font-medium text-primary-on-soft" : "border-border bg-card text-text-muted",
                  )}
                >
                  {t(item.label)}
                  <Count n={counts[item.href]} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
