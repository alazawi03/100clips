"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const TABS = ["overview", "orders", "brief", "clips", "activity"] as const;
type Tab = (typeof TABS)[number];

/**
 * Desktop: two columns, the work (next action, orders, clips) beside the reference (summary, brief, activity).
 * Phones: one section at a time under tabs. Every section is rendered once; tabs only hide the others.
 */
export function CampaignLayout(props: Record<"banner" | "summary" | "orders" | "brief" | "clips" | "activity", ReactNode>) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");
  const show = (...tabs: Tab[]) => cn(!tabs.includes(tab) && "max-lg:hidden");

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={t("campaignDetail.tabs.overview")} className="sticky top-16 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("shrink-0 border-b-2 px-3 py-3 text-small font-medium transition-colors", tab === id ? "border-primary text-text" : "border-transparent text-text-muted")}
          >
            {t(`campaignDetail.tabs.${id}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <div className={show("overview")}>{props.banner}</div>
          <div className={show("orders")}>{props.orders}</div>
          <div className={show("clips")}>{props.clips}</div>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <div className={show("overview")}>{props.summary}</div>
          <div className={show("brief")}>{props.brief}</div>
          <div className={show("activity")}>{props.activity}</div>
        </div>
      </div>
    </div>
  );
}
