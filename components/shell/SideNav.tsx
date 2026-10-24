"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { LogOut, MoreHorizontal, Plus, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { LanguageToggle } from "./LanguageToggle";
import { isActive, moreItems, sidebarItems, tabItems, type NavItem } from "./nav";

/** Unread counts by nav href, e.g. { "/messages": 3 }. */
type Unread = Partial<Record<string, number>>;

/**
 * Desktop sidebar. Sits on the inline start: right in Arabic, left in English.
 * The main action (a new campaign) on top, then the pages in one list.
 */
export function SideNav({ account, unread = {} }: { account: ReactNode; unread?: Unread }) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label={t("nav.label")} className="sticky top-16 z-30 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col border-e border-border bg-background p-4 md:flex">
      {/* Only the pages scroll (on short screens). The account menu stays outside: a scrolling box clips sideways too,
          and its panel is wider than the sidebar. */}
      <div className="-mx-4 -mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-1 pt-4">
        <Link href="/campaigns/new" className={buttonClass("primary", "mb-3 w-full")}>
          <Plus aria-hidden />
          {t("newCampaign.button")}
        </Link>
        {sidebarItems.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(item, pathname)} label={t(item.label)} count={unread[item.href]} />
        ))}
      </div>
      <div className="mt-1 border-t border-border pt-3">{account}</div>
    </nav>
  );
}

function SideLink({ item, active, label, count = 0 }: { item: NavItem; active: boolean; label: string; count?: number }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        // DESIGN.md Sidebar: 40px rows (44 in the mobile sheet); active is the surface fill with a 2px pink bar on the inline-start edge.
        "relative flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 transition-colors duration-[120ms] md:h-10",
        active
          ? "bg-surface font-medium text-text before:absolute before:inset-y-2 before:start-0 before:w-[2px] before:rounded-full before:bg-brand"
          : "text-text hover:bg-surface",
      )}
    >
      <Icon aria-hidden className={cn("size-5", active ? "text-text" : "text-icon-inactive")} strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-caption font-medium text-on-brand tabular-nums">
          <span aria-hidden>{count}</span>
          <span className="sr-only">{t("nav.unread", { count })}</span>
        </span>
      )}
    </Link>
  );
}

const tabClass = "flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-caption leading-tight";

/** Mobile tab bar: Home, Explore, Campaigns, Orders, More. More opens a sheet with the rest. */
export function BottomNav({ balanceLabel, unread = {} }: { balanceLabel: string; unread?: Unread }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const sheet = useRef<HTMLDialogElement>(null);
  const moreActive = moreItems.some((item) => isActive(item, pathname));
  // Something new behind More (e.g. notifications): a pink dot on the tab, like the creator app's Post button.
  const moreUnread = moreItems.reduce((sum, item) => sum + (unread[item.href] ?? 0), 0);

  // Close the sheet after navigating.
  useEffect(() => {
    sheet.current?.close();
  }, [pathname]);

  return (
    <>
      <nav
        aria-label={t("nav.label")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {tabItems.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn(tabClass, active ? "font-medium text-text" : "text-icon-inactive")}>
              <Icon aria-hidden className="size-6" strokeWidth={1.75} />
              <span className="line-clamp-1">{t(item.label)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => sheet.current?.showModal()}
          className={cn(tabClass, moreActive ? "font-medium text-text" : "text-icon-inactive")}
        >
          <span className="relative">
            <MoreHorizontal aria-hidden className="size-6" strokeWidth={1.75} />
            {moreUnread > 0 && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-2 ring-background" />}
          </span>
          <span>{t("nav.more")}</span>
          {moreUnread > 0 && <span className="sr-only">{t("nav.unread", { count: moreUnread })}</span>}
        </button>
      </nav>

      <dialog
        ref={sheet}
        aria-label={t("nav.moreLabel")}
        onClick={(e) => e.target === sheet.current && sheet.current?.close()}
        className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-[var(--radius-lg)] bg-background p-0 text-text backdrop:bg-[var(--overlay)] md:hidden"
      >
        <div className="flex flex-col gap-1 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">{t("nav.more")}</p>
            <button type="button" onClick={() => sheet.current?.close()} aria-label={t("nav.close")} className="grid size-11 place-items-center rounded-full hover:bg-surface">
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {moreItems.map((item) => (
            <SideLink key={item.href} item={item} active={isActive(item, pathname)} label={t(item.label)} count={unread[item.href]} />
          ))}
          <form action={signOut}>
            <button type="submit" className="flex h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-text hover:bg-surface">
              <LogOut aria-hidden className="size-5 text-icon-inactive rtl:-scale-x-100" strokeWidth={1.75} />
              {t("header.signOut")}
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-3 py-2">
            <span className="text-small text-text-muted">{balanceLabel}</span>
            <LanguageToggle className="hover:bg-border" />
          </div>
        </div>
      </dialog>
    </>
  );
}
