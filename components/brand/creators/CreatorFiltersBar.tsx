"use client";

import { Languages, LayoutGrid, Mars, MonitorPlay, Search, Users, Venus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { nicheIcon } from "@/components/ui/nicheIcons";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { FilterMenu, type FilterOption } from "./FilterMenu";
import { SortMenu } from "./SortMenu";
import { cn } from "@/lib/cn";
import { CONTENT_LANGUAGES, GENDERS, NICHES, PLATFORMS, SORTS } from "@/lib/data/creatorFilters";

export function CreatorFiltersBar({ resultsLabel }: { resultsLabel: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const firstRun = useRef(true);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  // Search as you type, a beat after the last keystroke.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = setTimeout(() => update("q", query.trim()), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = ["platform", "niche", "gender", "lang"].some((k) => params.get(k)) || !!params.get("q");

  const icon = "size-4 shrink-0";
  const filters: Array<{ key: string; label: string; icon: ReactNode; options: FilterOption[] }> = [
    {
      key: "platform",
      label: t("explore.platform"),
      icon: <MonitorPlay aria-hidden className={icon} />,
      options: PLATFORMS.map((p) => ({ value: p, label: t(`platforms.${p}`), icon: <PlatformLogo platform={p} className="size-5" /> })),
    },
    {
      key: "niche",
      label: t("explore.niche"),
      icon: <LayoutGrid aria-hidden className={icon} />,
      options: NICHES.map((n) => {
        const Icon = nicheIcon[n];
        return { value: n, label: t(`niches.${n}`), icon: <Icon aria-hidden className="size-5 text-text-muted" strokeWidth={1.75} /> };
      }),
    },
    {
      key: "gender",
      label: t("explore.gender"),
      icon: <Users aria-hidden className={icon} />,
      options: GENDERS.map((g) => {
        const Icon = g === "female" ? Venus : Mars;
        return { value: g, label: t(`genders.${g}`), icon: <Icon aria-hidden className="size-5 text-text-muted" strokeWidth={1.75} /> };
      }),
    },
    {
      key: "lang",
      label: t("explore.language"),
      icon: <Languages aria-hidden className={icon} />,
      options: CONTENT_LANGUAGES.map((l) => ({ value: l, label: t(`languages.${l}`) })),
    },
  ];

  const sortLabels = { rating: t("explore.sortRating"), priceLow: t("explore.sortPriceLow"), priceHigh: t("explore.sortPriceHigh"), orders: t("explore.sortOrders") };

  return (
    <section aria-label={t("explore.filtersLabel")} className="flex flex-col gap-3">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("explore.search")}
          aria-label={t("explore.search")}
          className="h-11 w-full rounded-full border border-border bg-card ps-10 pe-4 shadow-soft placeholder:text-text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <FilterMenu
            key={f.key}
            label={f.label}
            icon={f.icon}
            options={f.options}
            selected={(params.get(f.key) ?? "").split(",").filter(Boolean)}
            onChange={(next) => update(f.key, next.join(","))}
          />
        ))}
        {active && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-small font-medium text-primary hover:bg-primary-soft"
          >
            <X aria-hidden className="size-4" />
            {t("explore.clear")}
          </button>
        )}
        <div className="ms-auto">
          <SortMenu
            label={t("explore.sort")}
            value={params.get("sort") ?? "rating"}
            options={SORTS.map((s) => ({ value: s, label: sortLabels[s] }))}
            onChange={(v) => update("sort", v === "rating" ? "" : v)}
          />
        </div>
      </div>

      <p className={cn("text-small text-text-muted transition-opacity", pending && "opacity-50")} aria-live="polite">
        {resultsLabel}
      </p>
    </section>
  );
}
