import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

/** One headline number: a label, the value, a short line under it, and optionally where to act on it. */
export function StatCard({ label, value, hint, action }: { label: string; value: string; hint?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <span className="text-small text-text-muted">{label}</span>
      <span className="text-h1 font-medium">{value}</span>
      {hint && <span className="text-small text-text-muted">{hint}</span>}
      {action && (
        <Link href={action.href} className="mt-auto inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] pt-1 text-small font-medium text-primary hover:underline">
          {action.label}
          <ChevronLeft aria-hidden className="size-4 rotate-180 rtl:rotate-0" />
        </Link>
      )}
    </Card>
  );
}
