"use client";

import { useTransition } from "react";
import { Bug } from "lucide-react";
import { switchDebugAccount } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Debug only (never in production): try the dashboard as a brand-new account, or with the demo data. */
export function DebugAccountSwitch({ isNew }: { isNew: boolean }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const option = (to: "demo" | "new", label: string) => {
    const on = (to === "new") === isNew;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        disabled={pending}
        // "New account" works even when it's already on: it empties the account again.
        onClick={() => (to === "new" || !on) && start(() => switchDebugAccount(to))}
        className={cn("h-8 rounded-full px-3 text-small font-medium transition-colors", on ? "bg-primary text-on-primary" : "text-text-muted hover:bg-surface hover:text-text")}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2 self-start rounded-full border border-dashed border-border p-1 ps-3 text-small text-text-muted">
      <Bug aria-hidden className="size-4" />
      <span>{t("debug.account")}</span>
      <div role="radiogroup" aria-label={t("debug.account")} className="flex gap-1">
        {option("demo", t("debug.demoData"))}
        {option("new", t("debug.newAccount"))}
      </div>
    </div>
  );
}
