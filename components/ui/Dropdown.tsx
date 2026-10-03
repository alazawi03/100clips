"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type DropdownProps = {
  /** Contents of the trigger button. */
  trigger: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  /** Which edge the panel lines up with: the trigger's inline start or end. */
  align?: "start" | "end";
  /** Open below the trigger (default) or above it, e.g. at the bottom of the sidebar. */
  placement?: "below" | "above";
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
};

/** Button that opens a panel below it. Closes on outside click, Escape, or when a child calls close(). */
export function Dropdown({ trigger, triggerLabel, triggerClassName, align = "start", placement = "below", panelClassName, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Slide the panel back inside the screen if it would run off either edge.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    const rect = el.getBoundingClientRect();
    const gutter = 8;
    const dx = rect.left < gutter ? gutter - rect.left : rect.right > window.innerWidth - gutter ? window.innerWidth - gutter - rect.right : 0;
    el.style.translate = dx ? `${dx}px 0` : "";
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative min-w-0">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={triggerLabel}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={panel}
          id={panelId}
          className={cn(
            "absolute z-50 min-w-60 max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-border bg-card p-1.5 shadow-lift",
            placement === "below" ? "top-full mt-2" : "bottom-full mb-2",
            align === "start" ? "start-0" : "end-0",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export const menuItemClass =
  "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-start transition-colors duration-[120ms] hover:bg-surface";
