import { getI18n } from "@/lib/i18n/server";

/**
 * Shown the moment a link is tapped, while the page's data loads: the page's outline (a title and
 * cards), so the tap answers at once instead of after the server does. The header and sidebar stay.
 */
export default async function Loading() {
  const { t } = await getI18n();
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">{t("common.loading")}</span>
      <div aria-hidden className="h-9 w-48 max-w-full rounded-[var(--radius-md)] bg-surface motion-safe:animate-pulse" />
      <div aria-hidden className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-40 rounded-[var(--radius-lg)] bg-surface motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
