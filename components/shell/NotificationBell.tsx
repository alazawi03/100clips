"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CircleCheck, Clapperboard, Clock, CreditCard, Hourglass, Megaphone, PackageCheck, RefreshCw, UserX, type LucideIcon } from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";
import type { NotificationKind } from "@/lib/notifications";
import type { StatusTone } from "@/lib/statuses";
import type { NotificationRow } from "./notificationRows";

/** Each kind's icon and status colour: the same pairing the creator app uses for its notifications. */
const looks: Record<NotificationKind, { icon: LucideIcon; tone: StatusTone }> = {
  accepted: { icon: CircleCheck, tone: "blue" },
  declined: { icon: UserX, tone: "red" },
  expired: { icon: Hourglass, tone: "gray" },
  received: { icon: PackageCheck, tone: "blue" },
  clipReady: { icon: Clapperboard, tone: "purple" },
  newVersion: { icon: RefreshCw, tone: "purple" },
  adCode: { icon: Megaphone, tone: "green" },
  late: { icon: Clock, tone: "amber" },
  paymentFailed: { icon: CreditCard, tone: "red" },
};

const tones: Record<StatusTone, string> = {
  gray: "bg-status-gray-bg text-status-gray-text",
  amber: "bg-status-amber-bg text-status-amber-text",
  blue: "bg-status-blue-bg text-status-blue-text",
  purple: "bg-status-purple-bg text-status-purple-text",
  green: "bg-status-green-bg text-status-green-text",
  red: "bg-status-red-bg text-status-red-text",
};

/** The bell in the top bar: how many updates are new, and the latest ones in a panel. */
export function NotificationBell({ rows, unread }: { rows: NotificationRow[]; unread: number }) {
  const { t } = useI18n();
  return (
    <Dropdown
      align="end"
      panelClassName="w-[min(26rem,calc(100vw-2rem))] p-0"
      triggerLabel={unread > 0 ? `${t("notifications.title")} (${unread})` : t("notifications.title")}
      triggerClassName="relative grid size-11 place-items-center rounded-full text-text hover:bg-surface"
      trigger={
        <>
          <Bell aria-hidden className="size-5" strokeWidth={1.75} />
          {unread > 0 && (
            <span aria-hidden className="absolute end-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-caption font-medium text-on-accent tabular-nums">
              {unread}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <div className="flex max-h-[min(34rem,72vh)] flex-col">
          <h2 className="border-b border-border px-4 py-3 font-medium">{t("notifications.title")}</h2>
          <div className="overflow-y-auto">
            <NotificationList rows={rows} onOpen={close} />
          </div>
          <Link href="/notifications" onClick={close} className="border-t border-border px-4 py-3 text-center text-small font-medium hover:bg-surface">
            {t("notifications.seeAll")}
          </Link>
        </div>
      )}
    </Dropdown>
  );
}

/**
 * The updates under Today / Yesterday / This week / Earlier. Like the creator app, opening the list
 * marks everything seen, while what was new stays highlighted until you leave.
 */
export function NotificationList({ rows, onOpen }: { rows: NotificationRow[]; onOpen?: () => void }) {
  const { t } = useI18n();
  // Kept as it was when the list opened, so marking it seen doesn't clear the highlights mid-read.
  const [shown] = useState(rows);
  useEffect(() => {
    if (shown.some((r) => r.unread)) void markAllNotificationsRead();
  }, [shown]);

  if (shown.length === 0) return <p className="px-4 py-8 text-center text-small text-text-muted">{t("notifications.empty")}</p>;
  return (
    <div className="flex flex-col pb-2">
      {shown.map((row, i) => (
        <div key={row.key}>
          {row.section !== shown[i - 1]?.section && (
            <h3 className={cn("px-4 pb-1.5 text-small font-medium text-text-muted", i === 0 ? "pt-3" : "pt-5")}>{t(`notifications.${row.section}`)}</h3>
          )}
          <NotificationItem row={row} onClick={onOpen} />
        </div>
      ))}
    </div>
  );
}

/** One update: its kind (icon in a status colour) with the creator in the corner, what happened, on what, and when. */
function NotificationItem({ row, onClick }: { row: NotificationRow; onClick?: () => void }) {
  const { t } = useI18n();
  const { icon: Icon, tone } = looks[row.kind];
  return (
    <Link href={row.href} onClick={onClick} className={cn("flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface", row.unread && "bg-surface/60")}>
      <span className="relative shrink-0">
        <span className={cn("grid size-11 place-items-center rounded-full", tones[tone])}>
          <Icon aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        {row.creatorId && <Avatar id={row.creatorId} name={row.creatorName ?? ""} size="2xs" className="absolute -bottom-1 -end-1 ring-2 ring-card" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-small font-medium">{row.title}</span>
        <span className="line-clamp-2 text-small text-text-muted">{row.detail}</span>
        <span className="mt-0.5 text-caption text-text-muted">{row.time}</span>
      </span>
      {row.unread && <span role="img" aria-label={t("notifications.unread")} className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
    </Link>
  );
}
