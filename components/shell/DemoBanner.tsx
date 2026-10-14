"use client";

import { FlaskConical } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";

/** Pages that still read the in-memory demo data (lib/data). Remove each as it moves to the API. */
const DEMO_PAGES = ["/settings"];

/** Says so on pages that show demo data, so it's never mistaken for the account's real data. */
export function DemoBanner() {
  const { t } = useI18n();
  const path = usePathname();
  if (!DEMO_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return (
    <div role="note" className="mb-6 flex items-center gap-2 rounded-[var(--radius-md)] bg-surface px-4 py-2 text-small text-text-muted">
      <FlaskConical aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      {t("header.demoData")}
    </div>
  );
}
