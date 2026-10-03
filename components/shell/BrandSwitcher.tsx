"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronDown, ChevronsUpDown, Plus } from "lucide-react";
import { selectBrand } from "@/app/actions/account";
import { useI18n } from "@/components/i18n/I18nProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

export type BrandOption = { id: string; name: string; industry: string; logo?: string };

function Mark({ brand, size }: { brand: BrandOption; size: "sm" | "md" }) {
  return <BrandLogo id={brand.id} name={brand.name} src={brand.logo} size={size} />;
}

/**
 * Brand switcher. Everything on screen belongs to the selected brand. Hidden when there is only one.
 * "sidebar": full-width row at the bottom of the desktop sidebar, menu opens upwards. "header": compact pill for phones.
 */
export function BrandSwitcher({ brands, currentId, variant = "header" }: { brands: BrandOption[]; currentId: string; variant?: "header" | "sidebar" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const current = brands.find((b) => b.id === currentId) ?? brands[0];
  if (brands.length < 2) return null;

  return (
    <Dropdown
      placement={variant === "sidebar" ? "above" : "below"}
      panelClassName={variant === "sidebar" ? "w-full" : undefined}
      triggerLabel={t("header.currentBrand", { name: current.name })}
      triggerClassName={cn(
        variant === "sidebar"
          ? "flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card p-2 text-start transition-opacity hover:bg-surface"
          : "flex h-10 max-w-[260px] items-center gap-2 rounded-full border border-border bg-card ps-1 pe-3 transition-opacity hover:bg-surface",
        pending && "opacity-60",
      )}
      trigger={
        variant === "sidebar" ? (
          <>
            <Mark brand={current} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-small font-medium">{current.name}</span>
              <span className="block truncate text-caption text-text-muted">{current.industry}</span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-text-muted" />
          </>
        ) : (
          <>
            <Mark brand={current} size="sm" />
            <span className="hidden min-w-0 truncate text-small font-medium sm:block">{current.name}</span>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-text-muted" />
          </>
        )
      }
    >
      {(close) => (
        <div className="flex flex-col">
          <p className="px-3 pb-1 pt-2 text-caption text-text-muted">{t("header.switchBrand")}</p>
          <ul>
            {brands.map((brand) => {
              const selected = brand.id === current.id;
              return (
                <li key={brand.id}>
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    className={menuItemClass}
                    onClick={() => {
                      close();
                      if (selected) return;
                      startTransition(async () => {
                        await selectBrand(brand.id);
                        router.refresh();
                      });
                    }}
                  >
                    <Mark brand={brand} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{brand.name}</span>
                      <span className="block truncate text-small text-text-muted">{brand.industry}</span>
                    </span>
                    {selected && <Check aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={2.5} />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="my-1 border-t border-border" />
          <Link href="/brands/new" onClick={close} className={cn(menuItemClass, "text-primary")}>
            <span className="grid size-10 place-items-center rounded-full border border-dashed border-primary/40">
              <Plus aria-hidden className="size-5" />
            </span>
            <span className="font-medium">{t("header.addBrand")}</span>
          </Link>
        </div>
      )}
    </Dropdown>
  );
}
