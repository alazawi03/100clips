"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";

export function AccountMenu({ id, name, email }: { id: string; name: string; email: string }) {
  const { t } = useI18n();
  return (
    <Dropdown
      align="end"
      triggerLabel={t("header.account")}
      triggerClassName="grid size-11 place-items-center rounded-full hover:bg-surface"
      trigger={<Avatar id={id} name={name} size="sm" />}
    >
      {(close) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar id={id} name={name} size="md" />
            <span className="min-w-0">
              <span className="block truncate font-medium">{name}</span>
              <bdi dir="ltr" className="block truncate text-small text-text-muted">
                {email}
              </bdi>
            </span>
          </div>
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
