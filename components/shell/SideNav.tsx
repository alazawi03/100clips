"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { BrandSwitcher, type BrandOption } from "./BrandSwitcher";
import { LanguageToggle } from "./LanguageToggle";
import { isActive, moreItems, sidebarItems, tabItems, type NavItem } from "./nav";

/** Desktop sidebar. Sits on the inline start: right in Arabic, left in English. */
export function SideNav({ brands, currentBrandId }: { brands: BrandOption[]; currentBrandId: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label={t("nav.label")} className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col gap-1 border-e border-border bg-background p-4 md:flex">
      {sidebarItems.map((item) => (
        <SideLink key={item.href} item={item} active={isActive(item, pathname)} label={t(item.label)} />
      ))}
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
        <BrandSwitcher brands={brands} currentId={currentBrandId} variant="sidebar" />
      </div>
    </nav>
  );
}

function SideLink({ item, active, label }: { item: NavItem; active: boolean; label: string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 transition-colors duration-[120ms]",
        active ? "bg-primary-soft font-medium text-primary-on-soft" : "text-text hover:bg-surface",
      )}
    >
      <Icon aria-hidden className={cn("size-5", active ? "text-primary-on-soft" : "text-icon-inactive")} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

const tabClass = "flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-caption leading-tight";

/** Mobile tab bar: Home, Explore, Campaigns, Orders, More. More opens a sheet with the rest. */
export function BottomNav({ balanceLabel }: { balanceLabel: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const sheet = useRef<HTMLDialogElement>(null);
  const moreActive = moreItems.some((item) => isActive(item, pathname));

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
          <MoreHorizontal aria-hidden className="size-6" strokeWidth={1.75} />
          <span>{t("nav.more")}</span>
        </button>
      </nav>

      <dialog
        ref={sheet}
        aria-label={t("nav.moreLabel")}
        onClick={(e) => e.target === sheet.current && sheet.current?.close()}
        className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-[var(--radius-xl)] bg-background p-0 text-text backdrop:bg-[var(--overlay)] md:hidden"
      >
        <div className="flex flex-col gap-1 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">{t("nav.more")}</p>
            <button type="button" onClick={() => sheet.current?.close()} aria-label={t("nav.close")} className="grid size-11 place-items-center rounded-full hover:bg-surface">
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {moreItems.map((item) => (
            <SideLink key={item.href} item={item} active={isActive(item, pathname)} label={t(item.label)} />
          ))}
          <div className="mt-2 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-3 py-2">
            <span className="text-small text-text-muted">{balanceLabel}</span>
            <LanguageToggle />
          </div>
        </div>
      </dialog>
    </>
  );
}
