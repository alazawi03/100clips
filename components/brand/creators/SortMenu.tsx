"use client";

import { ArrowDownUp, Check, ChevronDown } from "lucide-react";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

type Props = { label: string; options: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void };

/** Sort pill in the same style as the filters. One choice at a time. */
export function SortMenu({ label, options, value, onChange }: Props) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <Dropdown
      align="end"
      triggerLabel={`${label}: ${current.label}`}
      triggerClassName="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-border bg-card ps-3 pe-2.5 text-small text-text transition-colors duration-[120ms] hover:bg-surface"
      trigger={
        <>
          <ArrowDownUp aria-hidden className="size-4 shrink-0" />
          <span className="truncate">{current.label}</span>
          <ChevronDown aria-hidden className="size-4 shrink-0 opacity-60" />
        </>
      }
    >
      {(close) => (
        <div className="flex flex-col" role="group" aria-label={label}>
          {options.map((o) => {
            const on = o.value === current.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  close();
                  if (!on) onChange(o.value);
                }}
                className={cn(menuItemClass, on && "font-medium")}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {on && <Check aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </Dropdown>
  );
}
