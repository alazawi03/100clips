import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[var(--radius-xl)] border border-border bg-card shadow-soft", className)} {...props} />;
}

type SectionHeaderProps = {
  title: string;
  hint?: string;
  action?: { href: string; label: string };
  id?: string;
  children?: ReactNode;
};

export function SectionHeader({ title, hint, action, id, children }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="text-h2 font-medium text-balance">
          {title}
        </h2>
        {hint && <p className="mt-1 text-small text-text-muted">{hint}</p>}
      </div>
      {children}
      {action && (
        <Link href={action.href} className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-small font-medium text-primary hover:bg-primary-soft">
          {action.label}
        </Link>
      )}
    </div>
  );
}
