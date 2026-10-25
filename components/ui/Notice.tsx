"use client";

import { CircleCheck, Info } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** How long a confirmation stays before it goes. */
const SHOWN_MS = 6000;

/**
 * Confirmation after an action ("success"), or guidance ("info": the violet info note, DESIGN.md 4.1).
 * A confirmation comes from ?done= in the address: it takes that off (so a reload doesn't show it again) and, unless
 * it has its own buttons (`action`, which close it), goes after a few seconds.
 */
export function Notice({ tone = "success", children, action }: { tone?: "success" | "info"; children: ReactNode; action?: ReactNode }) {
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (tone !== "success") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("done")) {
      url.searchParams.delete("done");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    if (action) return;
    const timer = setTimeout(() => setShown(false), SHOWN_MS);
    return () => clearTimeout(timer);
  }, [tone, action]);

  if (!shown) return null;
  const Icon = tone === "success" ? CircleCheck : Info;
  return (
    <div
      role={tone === "success" ? "status" : undefined}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3",
        tone === "success" ? "bg-success-soft text-text" : "bg-info-soft text-info-on-soft",
      )}
    >
      <Icon aria-hidden className={cn("size-5 shrink-0", tone === "success" ? "text-success" : "text-info-on-soft")} />
      <p className="min-w-0 flex-1">{children}</p>
      {action}
    </div>
  );
}
