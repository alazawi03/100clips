"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, LayoutGrid } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

type BrandOption = { id: string; name: string; logo?: string };

/**
 * Brand menu that filters a page through ?brand=, each brand shown with its logo.
 * The caller renders it only when there is more than one brand.
 */
export function BrandFilter({ brands, value }: { brands: BrandOption[]; value?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = brands.find((b) => b.id === value);

  function choose(id?: string) {
    const next = new URLSearchParams(params);
    if (id) next.set("brand", id);
    else next.delete("brand");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2 text-small text-text-muted">
      <span className="shrink-0">{t("brandFilter.label")}</span>
      <Dropdown
        align="start"
        panelClassName="w-64"
        triggerLabel={`${t("brandFilter.label")}: ${current?.name ?? t("brandFilter.all")}`}
        triggerClassName="inline-flex h-9 min-w-40 max-w-64 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-card ps-1.5 pe-2.5 text-small font-medium text-text transition-colors hover:bg-surface"
        trigger={
          <>
            {current ? (
              <BrandLogo id={current.id} name={current.name} src={current.logo} size="xs" />
            ) : (
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface text-text-muted">
                <LayoutGrid className="size-3.5" />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-start">{current?.name ?? t("brandFilter.all")}</span>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-text-muted" />
          </>
        }
      >
        {(close) => (
          <ul>
            {[undefined, ...brands].map((b) => {
              const on = b ? b.id === value : !current;
              return (
                <li key={b?.id ?? "all"}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      choose(b?.id);
                      close();
                    }}
                    className={cn(menuItemClass, "text-small text-text", on && "font-medium")}
                  >
                    {b ? (
                      <BrandLogo id={b.id} name={b.name} src={b.logo} size="sm" />
                    ) : (
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)] border border-border bg-surface text-text-muted">
                        <LayoutGrid className="size-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{b?.name ?? t("brandFilter.all")}</span>
                    {on && <Check aria-hidden className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Dropdown>
    </div>
  );
}
