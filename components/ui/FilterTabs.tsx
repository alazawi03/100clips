import Link from "next/link";
import { cn } from "@/lib/cn";

export type FilterTab = { href: string; label: string; count?: string; active: boolean };

/** Pill tabs that filter a list through the URL. Scrolls sideways on small screens. */
export function FilterTabs({ tabs, label }: { tabs: FilterTab[]; label: string }) {
  return (
    <nav aria-label={label} className="scrollbar-none -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex w-max gap-2">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              scroll={false}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-small transition-colors duration-[120ms]",
                tab.active ? "border-primary-soft bg-primary-soft font-medium text-primary-on-soft" : "border-border bg-card text-text-muted hover:text-text",
              )}
            >
              {tab.label}
              {tab.count !== undefined && <span className="tabular-nums opacity-80">{tab.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
