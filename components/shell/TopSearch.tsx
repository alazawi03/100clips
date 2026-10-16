"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

/** A bookable creator as the top-bar search shows it. Text is already in the page's language. */
export type SearchCreator = {
  id: string;
  name: string;
  handle: string;
  photo?: string;
  /** City and niche, e.g. "Manama, Food". */
  detail: string;
  /** "From BHD 8.000", with the fee. */
  price: string;
  /** Lower-cased Arabic and English names and the handle: a match on any of them counts, like Explore. */
  keys: string[];
};

const MAX = 6;

/**
 * Creator search in the top bar (DESIGN.md TopBar). Matches show in a dropdown as you type; Enter (or
 * "See all") opens Explore with the search. Explore has its own search box, so it steps aside there.
 */
export function TopSearch({ creators }: { creators: SearchCreator[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLFormElement>(null);
  const listId = useId();

  if (pathname === "/explore") return null;

  const q = query.trim().toLowerCase();
  const matches = q ? creators.filter((c) => c.keys.some((k) => k.includes(q))).slice(0, MAX) : [];
  const shown = open && q !== "";
  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const go = (href: string) => {
    close();
    setQuery("");
    router.push(href);
  };
  const exploreHref = `/explore?q=${encodeURIComponent(query.trim())}`;

  return (
    <Form
      ref={root}
      action="/explore"
      role="search"
      onSubmit={() => {
        close();
        setQuery("");
      }}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget)) close();
      }}
      className="relative hidden w-full max-w-md md:block"
    >
      <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        name="q"
        value={query}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={t("header.search")}
        aria-label={t("header.search")}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (shown) e.preventDefault();
            close();
          } else if (e.key === "ArrowDown" && q) {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (i + 1 >= matches.length ? -1 : i + 1));
          } else if (e.key === "ArrowUp" && q) {
            e.preventDefault();
            setActive((i) => (i <= -1 ? matches.length - 1 : i - 1));
          } else if (e.key === "Enter" && shown && active >= 0) {
            e.preventDefault();
            go(`/creators/${matches[active].id}`);
          }
        }}
        className={cn(
          "h-10 w-full rounded-full border border-border bg-surface ps-10 pe-4 text-small placeholder:text-text-muted focus:bg-card focus:outline-2 focus:outline-offset-0 focus:outline-primary",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />

      {shown && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-1.5 shadow-lift">
          {matches.length > 0 ? (
            <ul id={listId} role="listbox" aria-label={t("header.searchResults")} className="flex flex-col">
              {matches.map((c, i) => (
                <li key={c.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={`/creators/${c.id}`}
                    tabIndex={-1}
                    onClick={() => {
                      close();
                      setQuery("");
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 transition-colors duration-[120ms]", i === active && "bg-surface")}
                  >
                    <Avatar id={c.id} name={c.name} src={c.photo} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small font-medium">{c.name}</span>
                      <span className="block truncate text-caption text-text-muted">
                        <bdi dir="ltr">@{c.handle}</bdi>
                        {c.detail && ` · ${c.detail}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-caption font-medium tabular-nums text-text-muted">{c.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p id={listId} className="px-3 py-4 text-center text-small text-text-muted">
              {t("header.searchEmpty", { q: query.trim() })}
            </p>
          )}
          <Link
            href={exploreHref}
            onClick={() => {
              close();
              setQuery("");
            }}
            className="mt-1 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border-t border-border px-2.5 py-2.5 text-small font-medium hover:bg-surface"
          >
            <span className="min-w-0 truncate">{t("header.searchSeeAll", { q: query.trim() })}</span>
            <ArrowRight aria-hidden className="size-4 shrink-0 rtl:-scale-x-100" />
          </Link>
        </div>
      )}
    </Form>
  );
}
