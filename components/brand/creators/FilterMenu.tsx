"use client";

import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

export type FilterOption = { value: string; label: string; icon?: ReactNode };

type Props = {
  label: string;
  icon?: ReactNode;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
};

/** A filter pill that opens a checklist. Several options can be ticked; any of them matches. */
export function FilterMenu({ label, icon, options, selected, onChange }: Props) {
  const { t } = useI18n();
  const picked = options.filter((o) => selected.includes(o.value));
  const summary = picked.length === 0 ? label : picked.length === 1 ? picked[0].label : `${label} · ${picked.length}`;

  return (
    <Dropdown
      triggerLabel={picked.length ? `${label}: ${picked.map((o) => o.label).join(t("common.separator"))}` : label}
      triggerClassName={cn(
        "inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border ps-3 pe-2.5 text-small transition-colors duration-[120ms]",
        picked.length ? "border-primary-soft bg-primary-soft font-medium text-primary-on-soft" : "border-border bg-card text-text hover:bg-surface",
      )}
      trigger={
        <>
          {picked.length === 1 && picked[0].icon ? picked[0].icon : icon}
          <span className="truncate">{summary}</span>
          <ChevronDown aria-hidden className="size-4 shrink-0 opacity-60" />
        </>
      }
    >
      {() => (
        <fieldset className="flex flex-col">
          <legend className="sr-only">{label}</legend>
          {options.map((option) => {
            const on = selected.includes(option.value);
            return (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 hover:bg-surface">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={on}
                  onChange={() => onChange(on ? selected.filter((v) => v !== option.value) : [...selected, option.value])}
                />
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-[6px] border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
                    on ? "border-primary bg-primary text-on-primary" : "border-icon-inactive",
                  )}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                {option.icon && <span className="grid size-6 shrink-0 place-items-center">{option.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </label>
            );
          })}
          {selected.length > 0 && (
            <>
              <div className="my-1 border-t border-border" />
              <button type="button" onClick={() => onChange([])} className="rounded-[var(--radius-md)] px-3 py-2 text-start text-small font-medium text-primary hover:bg-primary-soft">
                {t("explore.clearOne")}
              </button>
            </>
          )}
        </fieldset>
      )}
    </Dropdown>
  );
}
