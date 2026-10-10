import { Building2, CircleCheck, Clapperboard, Landmark } from "lucide-react";
import type { WaitingOn } from "@/lib/admin/orders";
import type { I18n } from "@/lib/i18n/server";
import { cn } from "@/lib/cn";

const icons = { creator: Clapperboard, brand: Building2, admin: Landmark, nobody: CircleCheck };

/** Who has to act next ("Brand · review the clip"). 100clips' own to-dos stand out in amber. */
export function WaitingOnTag({ waiting, i18n, className }: { waiting: WaitingOn; i18n: I18n; className?: string }) {
  const { t } = i18n;
  const Icon = icons[waiting.who];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-small", waiting.who === "admin" ? "font-medium text-warning" : "text-text-muted", className)}>
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      <span>
        {waiting.who !== "nobody" && <>{t(`admin.who.${waiting.who}`)} · </>}
        {t(`admin.waiting.${waiting.what}`)}
      </span>
    </span>
  );
}
