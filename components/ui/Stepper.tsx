import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Numbered steps of a flow. `current` is zero-based; earlier steps show a check and, with `onStep`,
 * can be tapped to go back to them. Later steps can't be reached from here.
 */
export function Stepper({ steps, current, label, onStep }: { steps: string[]; current: number; label: string; onStep?: (index: number) => void }) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const body = (
            <>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-small font-medium tabular-nums",
                  done && "bg-primary text-on-primary",
                  active && "border-2 border-primary text-primary",
                  !done && !active && "bg-surface text-text-muted",
                )}
              >
                {done ? <Check aria-hidden className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("hidden truncate text-small sm:inline", active ? "font-medium" : "text-text-muted")}>{step}</span>
            </>
          );
          return (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              {done && onStep ? (
                <button
                  type="button"
                  onClick={() => onStep(i)}
                  className="-m-1 flex min-w-0 items-center gap-2 rounded-full p-1 pe-2 transition-colors hover:bg-surface [&>span:last-child]:hover:text-text"
                >
                  {body}
                </button>
              ) : (
                body
              )}
              {i < steps.length - 1 && <span aria-hidden className={cn("h-0.5 min-w-3 flex-1 rounded-full", done ? "bg-primary" : "bg-border")} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
