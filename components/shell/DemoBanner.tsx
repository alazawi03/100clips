"use client";

import { FlaskConical } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Pages that still read the in-memory demo data (lib/data). Remove each as it moves to the API. */
const DEMO_PAGES = ["/settings"];

/** Says so on pages that show demo data, so it's never mistaken for the account's real data. */
export function DemoBanner() {
  const { t } = useI18n();
  const path = usePathname();
  if (!DEMO_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return <DemoNote className="mb-6">{t("header.demoData")}</DemoNote>;
}

/** The demo-data line on its own, for a page that only sometimes shows demo data. */
export function DemoNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="note" className={cn("flex items-center gap-2 rounded-[var(--radius-md)] bg-surface px-4 py-2 text-small text-text-muted", className)}>
      <FlaskConical aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      {children}
    </div>
  );
}
