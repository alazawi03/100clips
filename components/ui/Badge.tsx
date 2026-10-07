import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { CampaignStatus, OrderStatus } from "@/lib/data/types";

export type BadgeTone = "neutral" | "success" | "warning" | "error" | "brand";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface text-text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
  brand: "bg-primary-soft text-primary-on-soft",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2 text-small font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

/** "delivered" is the one status that asks the brand to act, so it gets the brand tone. */
export const orderTone: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  in_progress: "neutral",
  delivered: "brand",
  approved: "success",
  cancelled: "neutral",
};

export const campaignTone: Record<CampaignStatus, BadgeTone> = {
  in_progress: "success",
  completed: "brand",
  cancelled: "neutral",
};
