import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  /** Short line under the title. */
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  /** Badges or buttons shown beside the title. */
  children?: ReactNode;
};

export function PageHeader({ title, subtitle, back, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      {back && (
        <Link href={back.href} className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] text-small text-text-muted hover:text-text">
          <ChevronRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1 font-medium text-balance">{title}</h1>
          {subtitle && <div className="text-text-muted">{subtitle}</div>}
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-12 text-center">
      <p className="text-h2 font-medium text-balance">{title}</p>
      {hint && <p className="max-w-md text-text-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
