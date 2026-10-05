"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Select } from "@/components/ui/Form";

/** Brand dropdown that filters a page through ?brand=. The caller renders it only when there is more than one brand. */
export function BrandFilter({ brands, value }: { brands: Array<{ id: string; name: string }>; value?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-small text-text-muted">
      <span className="shrink-0">{t("brandFilter.label")}</span>
      <Select
        value={value ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("brand", e.target.value);
          else next.delete("brand");
          const query = next.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }}
        className="h-9 w-auto min-w-40 py-0 text-text"
      >
        <option value="">{t("brandFilter.all")}</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
