"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { setTheme } from "@/app/actions/theme";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { ThemeChoice } from "@/lib/theme";

const options = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

/** System / Light / Dark. Applies at once on the open page, and a cookie keeps it for the next load. */
export function ThemeSwitcher({ initial }: { initial: ThemeChoice }) {
  const { t } = useI18n();
  const [theme, setChoice] = useState(initial);

  function pick(value: ThemeChoice) {
    setChoice(value);
    const root = document.documentElement;
    if (value === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", value);
    void setTheme(value);
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <p id="theme-label" className="text-small text-text-muted">
        {t("theme.label")}
      </p>
      <div role="radiogroup" aria-labelledby="theme-label" className="grid grid-cols-3 gap-1 rounded-[var(--radius-md)] bg-surface p-1">
        {options.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            onClick={() => pick(value)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] text-small font-medium transition-colors",
              theme === value ? "bg-card text-text" : "text-text-muted hover:text-text",
            )}
          >
            <Icon aria-hidden className="size-4" strokeWidth={1.75} />
            {t(`theme.${value}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
