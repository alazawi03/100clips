import type { ReactNode } from "react";
import { Clock, Hourglass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * Something the brand has to do, one card per kind ("2 clips waiting for your review"), with one button.
 * Shared by the dashboard and the campaign page so both look the same.
 */
export function ActionCallout({ title, detail, action, icon: Icon = Clock }: { title: ReactNode; detail?: ReactNode; action: ReactNode; icon?: LucideIcon }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 border-warning/40 bg-warning-soft p-4 sm:p-5">
      <p className="flex min-w-0 items-start gap-2">
        <Icon aria-hidden className="mt-1 size-4 shrink-0 text-warning" />
        <span className="min-w-0">
          <span className="block font-medium">{title}</span>
          {detail && <span className="block text-small text-text-muted">{detail}</span>}
        </span>
      </p>
      {action}
    </Card>
  );
}

/** Nothing to do: a quiet card in place of the callouts. */
export function CalmCallout({ children }: { children: ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-4 text-text-muted sm:p-5">
      <Hourglass aria-hidden className="size-5 shrink-0" />
      {children}
    </Card>
  );
}
