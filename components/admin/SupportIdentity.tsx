import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { SUPPORT_NAME } from "@/lib/admin/data";

/** The official account's avatar: the logo's play mark on black. Never mirrored. */
export function SupportAvatar({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-[#0A0A0A] dark:border dark:border-border", className)}>
      <svg viewBox="0 0 24 24" className="size-4 translate-x-px">
        <path d="M6 4.5v15l13-7.5z" fill="#FF2E7E" />
      </svg>
    </span>
  );
}

/** "100Clips Support" with the verified tick, as creators see it in their app. */
export function SupportName({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", className)}>
      <bdi dir="ltr">{SUPPORT_NAME}</bdi>
      <BadgeCheck aria-label="Verified" className="size-4 shrink-0 fill-accent text-on-accent" strokeWidth={2} />
    </span>
  );
}
