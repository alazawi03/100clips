import { cn } from "@/lib/cn";

export type ButtonVariant = "hero" | "primary" | "secondary" | "ghost" | "destructive";

/** Pressed: shrinks a little. Working (aria-busy): its icon gives way to the spinner the button shows (ActionButton.tsx). */
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium transition-[background-color,transform] duration-[120ms] ease-out active:scale-[0.98] disabled:cursor-not-allowed aria-busy:[&>svg:not(.animate-spin)]:hidden [&_svg]:size-5 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  /** The page's main action. In Laqta it's black like primary: pink buttons are for marketing only (DESIGN.md). */
  hero: "bg-primary text-on-primary hover:bg-primary-hover",
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-border bg-button-secondary text-text hover:bg-button-secondary-hover",
  ghost: "text-text hover:bg-surface",
  destructive: "text-error hover:bg-error-soft",
};

/** 44px on mobile, 40px from the md breakpoint up (DESIGN.md: Button). */
const size = "h-11 px-4 md:h-10";

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(base, variants[variant], size, className);
}
