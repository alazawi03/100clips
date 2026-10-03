import { CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Confirmation after an action ("success"), or neutral guidance ("info"). */
export function Notice({ tone = "success", children, action }: { tone?: "success" | "info"; children: ReactNode; action?: ReactNode }) {
  const Icon = tone === "success" ? CircleCheck : Info;
  return (
    <div
      role={tone === "success" ? "status" : undefined}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3",
        tone === "success" ? "bg-success-soft text-text" : "bg-surface text-text",
      )}
    >
      <Icon aria-hidden className={cn("size-5 shrink-0", tone === "success" ? "text-success" : "text-text-muted")} />
      <p className="min-w-0 flex-1">{children}</p>
      {action}
    </div>
  );
}
