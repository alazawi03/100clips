import Image from "next/image";
import Link from "next/link";
import { Bell, MessageCircle, ShoppingBag, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { account, brands } from "@/lib/data/account";
import { getCurrentBrand } from "@/lib/currentBrand";
import { unreadCount } from "@/lib/data/messages";
import { cartOf } from "@/lib/data/store";
import { getI18n } from "@/lib/i18n/server";
import { AccountMenu } from "./AccountMenu";
import { BrandSwitcher } from "./BrandSwitcher";
import { LanguageToggle } from "./LanguageToggle";
import { HOME_HREF } from "./nav";
import { BottomNav, SideNav } from "./SideNav";

export async function AppShell({ children }: { children: ReactNode }) {
  const { t, f } = await getI18n();
  const brand = await getCurrentBrand();
  const cartCount = cartOf(brand.id).length;
  const unread = unreadCount(brand.id);
  const balanceLabel = t("header.balanceShort", { amount: f.money(account.balance) });
  const brandOptions = brands.map((b) => ({ id: b.id, name: f.pick(b.name), industry: t(`industries.${b.industry}`), logo: b.logo }));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 md:gap-4 md:px-6">
          <Link href={HOME_HREF} aria-label={t("header.home")} className="shrink-0 rounded-[var(--radius-sm)]">
            {/* The logo is a brand mark: never mirrored in RTL. */}
            <Image src="/100clips-wordmark-on-light.svg" alt="" width={575} height={128} priority className="h-5 w-auto dark:hidden sm:h-6 md:h-7" />
            <Image src="/100clips-wordmark-on-dark.svg" alt="" width={575} height={128} priority className="hidden h-5 w-auto dark:block sm:h-6 md:h-7" />
          </Link>

          {/* On desktop the brand switcher sits at the bottom of the sidebar. */}
          <div className="min-w-0 md:hidden">
            <BrandSwitcher brands={brandOptions} currentId={brand.id} />
          </div>

          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/balance"
              aria-label={balanceLabel}
              className="hidden h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-small font-medium tabular-nums hover:bg-border sm:flex"
            >
              <Wallet aria-hidden className="size-4 text-text-muted" strokeWidth={1.75} />
              {f.money(account.balance)}
            </Link>
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            <Link href="/messages" aria-label={t("header.messages", { count: unread })} className="relative grid size-11 place-items-center rounded-full text-text hover:bg-surface">
              <MessageCircle aria-hidden className="size-5 rtl:-scale-x-100" strokeWidth={1.75} />
              {unread > 0 && (
                <span aria-hidden className="absolute end-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-caption font-medium text-on-primary tabular-nums">
                  {unread}
                </span>
              )}
            </Link>
            <Link href="/cart" aria-label={t("header.cart", { count: cartCount })} className="relative grid size-11 place-items-center rounded-full text-text hover:bg-surface">
              <ShoppingBag aria-hidden className="size-5" strokeWidth={1.75} />
              {cartCount > 0 && (
                <span aria-hidden className="absolute end-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-caption font-medium text-on-primary tabular-nums">
                  {cartCount}
                </span>
              )}
            </Link>
            {/* On phones, notifications live in the More sheet to keep the header uncluttered. */}
            <Link href="/notifications" aria-label={t("nav.notifications")} className="relative hidden size-11 place-items-center rounded-full text-text hover:bg-surface sm:grid">
              <Bell aria-hidden className="size-5" strokeWidth={1.75} />
              <span aria-hidden className="absolute end-3 top-2.5 size-2 rounded-full border-2 border-background bg-error" />
            </Link>
            <AccountMenu id={account.id} name={f.pick(account.name)} email={account.email} />
          </div>
        </div>
      </header>

      <div className="flex">
        <SideNav brands={brandOptions} currentBrandId={brand.id} />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>

      <BottomNav balanceLabel={balanceLabel} />
    </div>
  );
}
