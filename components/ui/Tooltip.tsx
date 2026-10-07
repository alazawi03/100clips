import type { ReactNode } from "react";

/**
 * A short label shown above an icon button on hover or keyboard focus. Visual only: the button keeps
 * its own accessible name. Hidden while the button's menu is open, so it doesn't sit over the panel.
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 rounded-[var(--radius-sm)] bg-text px-2 py-1 text-caption font-medium whitespace-nowrap text-card opacity-0 shadow-soft transition-opacity duration-[120ms] group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:opacity-100 group-has-[[aria-expanded=true]]/tip:hidden"
      >
        {label}
      </span>
    </span>
  );
}
