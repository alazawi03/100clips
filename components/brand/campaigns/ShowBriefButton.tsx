"use client";

import { SHOW_BRIEF_EVENT } from "./CampaignLayout";

/** "See details" after editing: opens the brief (on phones, its tab) and scrolls to it. */
export function ShowBriefButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(SHOW_BRIEF_EVENT))}
      className="h-8 shrink-0 rounded-full px-3 text-small font-medium text-primary hover:bg-card"
    >
      {label}
    </button>
  );
}
