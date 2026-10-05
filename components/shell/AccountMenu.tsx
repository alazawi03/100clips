"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import type { ThemeChoice } from "@/lib/theme";
import { ThemeSwitcher } from "./ThemeSwitcher";

type Props = {
  id: string;
  name: string;
  email: string;
  theme: ThemeChoice;
};

/** Profile menu at the bottom of the desktop sidebar. Opens upwards, on hover or click. */
export function AccountMenu({ id, name, email, theme }: Props) {
  const { t } = useI18n();
  return (
    <Dropdown
      openOnHover
      placement="above"
      panelClassName="w-72"
      triggerLabel={t("header.account")}
      triggerClassName="flex w-full items-center gap-3 rounded-[var(--radius-md)] p-2 text-start hover:bg-surface"
      trigger={
        <>
          <Avatar id={id} name={name} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-small font-medium">{name}</span>
            <bdi dir="ltr" className="block truncate text-caption text-text-muted">
              {email}
            </bdi>
          </span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-text-muted" />
        </>
      }
    >
      {(close) => (
        <div className="flex flex-col">
          <Link href="/settings" onClick={close} className={menuItemClass}>
            <Avatar id={id} name={name} size="md" />
            <span className="min-w-0">
              <span className="block truncate font-medium">{name}</span>
              <span className="block truncate text-small text-primary">{t("header.profile")}</span>
            </span>
          </Link>

          <div className="my-1 border-t border-border" />
          <ThemeSwitcher initial={theme} />
          <div className="my-1 border-t border-border" />
          <Link href="/settings" onClick={close} className={menuItemClass}>
            <Settings aria-hidden className="size-5 text-icon-inactive" strokeWidth={1.75} />
            {t("nav.settings")}
          </Link>
          <Link href="/login" onClick={close} className={menuItemClass}>
            <LogOut aria-hidden className="size-5 text-icon-inactive rtl:-scale-x-100" strokeWidth={1.75} />
            {t("header.signOut")}
          </Link>
        </div>
      )}
    </Dropdown>
  );
}
