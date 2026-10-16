import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "error" | "brand";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface text-text-muted",
  success: "bg-success-soft text-success-on-soft",
  warning: "bg-warning-soft text-warning-on-soft",
  error: "bg-error-soft text-error",
  brand: "bg-brand-soft text-brand-on-soft",
};

/** A neutral label pill. Statuses use <StatusBadge> (lib/statuses.ts) instead. */
export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2 text-small font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
