import Link from "next/link";
import type { Ref } from "react";
import { ChevronRight } from "lucide-react";

type Back = { label: string } & ({ onClick: () => void; href?: never } | { href: string; onClick?: never });

const backClass =
  "-ms-1.5 inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-1.5 text-small font-medium text-text-muted transition-colors hover:bg-surface hover:text-text";

/**
 * Top of a wizard step: the way back on the start side, "Step 2 of 3" on the other, then the step's title.
 * Back lives here rather than beside Next/Pay, so it can't be tapped by mistake.
 */
export function StepHeader({ count, title, back, headingRef }: { count: string; title: string; back?: Back; headingRef?: Ref<HTMLHeadingElement> }) {
  const icon = <ChevronRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" />;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-8 items-center justify-between gap-3">
        {back?.href ? (
          <Link href={back.href} className={backClass}>
            {icon}
            {back.label}
          </Link>
        ) : back ? (
          <button type="button" onClick={back.onClick} className={backClass}>
            {icon}
            {back.label}
          </button>
        ) : (
          <span />
        )}
        <p className="text-small text-text-muted">{count}</p>
      </div>
      <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="text-h2 font-medium outline-none">
        {title}
      </h2>
    </div>
  );
}
