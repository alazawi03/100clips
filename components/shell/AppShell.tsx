import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShoppingBag, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { workspace } from "@/lib/data/live";
import { unreadCount } from "@/lib/data/chatApi";
import { getTheme } from "@/lib/theme";
import { getI18n } from "@/lib/i18n/server";
import { displayName, getUser, requireBrandAccount } from "@/lib/session";
import { AccountMenu } from "./AccountMenu";
import { DemoBanner } from "./DemoBanner";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationBell } from "./NotificationBell";
import { notificationRows } from "./notificationRows";
import { HOME_HREF } from "./nav";
import { TopSearch } from "./TopSearch";
import { BottomNav, SideNav } from "./SideNav";

export async function AppShell({ children }: { children: ReactNode }) {
  // Signed in (proxy.ts) with a brand owner's account; otherwise onboarding first.
  const me = await requireBrandAccount();
  const user = await getUser();
  const i18n = await getI18n();
  const { t, f } = i18n;
  const ws = await workspace();
  const notifications = await notificationRows(i18n, 8);
  const cartCount = ws.cart.length;
  const unread = await unreadCount();
  const balanceLabel = t("header.balanceShort", { amount: f.money(ws.balance) });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 md:gap-4 md:px-6">
          <Link href={HOME_HREF} aria-label={t("header.home")} className="shrink-0 rounded-[var(--radius-sm)]">
            {/* The logo is a brand mark: never mirrored in RTL. */}
            <Image src="/laqta-logo-black.svg" alt="" width={2205} height={960} priority className="h-5 w-auto dark:hidden sm:h-6 md:h-7" />
            <Image src="/laqta-logo-white.svg" alt="" width={2205} height={960} priority className="hidden h-5 w-auto dark:block sm:h-6 md:h-7" />
          </Link>

          <div className="flex flex-1 justify-center px-4 lg:px-8">
            <TopSearch />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/balance"
              aria-label={balanceLabel}
              className="hidden h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-small font-medium tabular-nums hover:bg-border sm:flex"
            >
              <Wallet aria-hidden className="size-4 text-text-muted" strokeWidth={1.75} />
              {f.money(ws.balance)}
            </Link>
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            {/* On desktop, Messages lives in the sidebar with its unread count. */}
            <Link href="/messages" aria-label={t("header.messages", { count: unread })} className="relative grid size-11 place-items-center rounded-full text-text hover:bg-surface md:hidden">
              <MessageCircle aria-hidden className="size-5 rtl:-scale-x-100" strokeWidth={1.75} />
              {unread > 0 && (
                <span aria-hidden className="absolute end-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-caption font-medium text-on-brand tabular-nums">
                  {unread}
                </span>
              )}
            </Link>
            <Link href="/cart" aria-label={t("header.cart", { count: cartCount })} className="relative grid size-11 place-items-center rounded-full text-text hover:bg-surface">
              <ShoppingBag aria-hidden className="size-5" strokeWidth={1.75} />
              {cartCount > 0 && (
                <span aria-hidden className="absolute end-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-caption font-medium text-on-brand tabular-nums">
                  {cartCount}
                </span>
              )}
            </Link>
            {/* On phones, notifications live in the More sheet to keep the header uncluttered. */}
            <div className="hidden sm:block">
              <NotificationBell rows={notifications.rows} unread={notifications.unread} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <SideNav unread={{ "/messages": unread }} account={<AccountMenu
              id={me.account.id}
              name={displayName(me, i18n.locale, user?.email)}
              email={user?.email ?? ""}
              theme={await getTheme()}
            />} />
        {/* Pages marked data-hug (messages) sit right beside the sidebar instead of centred. */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8 md:has-[[data-hug]]:ps-4">
          <div className="mx-auto w-full max-w-[1200px] has-[[data-hug]]:mx-0">
            <DemoBanner />
            {children}
          </div>
        </main>
      </div>

      <BottomNav balanceLabel={balanceLabel} unread={{ "/notifications": notifications.unread }} />
    </div>
  );
}
