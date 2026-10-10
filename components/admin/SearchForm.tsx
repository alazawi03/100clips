import { Search } from "lucide-react";
import { controlClass } from "@/components/ui/Form";
import { cn } from "@/lib/cn";

/** A search box that filters the list through the URL (?q=), keeping the other parameters. Works without JavaScript. */
export function SearchForm({ action, q, placeholder, keep = {} }: { action: string; q: string; placeholder: string; keep?: Record<string, string> }) {
  return (
    <form action={action} method="get" role="search" className="relative w-full sm:max-w-sm">
      {Object.entries(keep).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      <input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={placeholder} className={cn(controlClass, "h-11 ps-9")} />
    </form>
  );
}
