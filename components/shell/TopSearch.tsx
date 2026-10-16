"use client";

import Form from "next/form";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

/** Creator search in the top bar (DESIGN.md TopBar). Explore has its own search box, so it steps aside there. */
export function TopSearch() {
  const pathname = usePathname();
  const { t } = useI18n();
  if (pathname === "/explore") return null;

  return (
    <Form action="/explore" role="search" className="relative hidden w-full max-w-md md:block">
      <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        name="q"
        placeholder={t("header.search")}
        aria-label={t("header.search")}
        className="h-10 w-full rounded-full border border-border bg-surface ps-10 pe-4 text-small placeholder:text-text-muted focus:bg-card focus:outline-2 focus:outline-offset-0 focus:outline-primary"
      />
    </Form>
  );
}
