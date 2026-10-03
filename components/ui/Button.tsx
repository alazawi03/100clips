import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "hero" | "primary" | "secondary" | "ghost" | "destructive";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium transition-[background-color,transform] duration-[120ms] ease-out active:scale-[0.98] [&_svg]:size-5 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  hero: "bg-brand-gradient text-on-primary",
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-surface text-text hover:bg-border",
  ghost: "text-primary hover:bg-primary-soft",
  destructive: "text-error hover:bg-error-soft",
};

/** 44px on mobile, 40px from the md breakpoint up (DESIGN.ar.html: Button). */
const size = "h-11 px-4 md:h-10";

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(base, variants[variant], size, className);
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; children: ReactNode };

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
