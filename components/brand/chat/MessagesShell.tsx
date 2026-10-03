"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type ConversationSummary = { id: string; creatorId: string; name: string; preview: string; time: string; unread: number };

/** Inbox beside the open conversation on desktop; one or the other on phones. */
export function MessagesShell({ conversations, children }: { conversations: ConversationSummary[]; children: ReactNode }) {
  const { t, tp } = useI18n();
  const active = useSelectedLayoutSegment();

  return (
    <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)] md:items-start">
      <Card className={cn("overflow-hidden", active && "hidden md:block")}>
        <h1 className="border-b border-border px-5 py-4 text-h2 font-medium">{t("chat.title")}</h1>
        {conversations.length === 0 ? (
          <p className="p-5 text-text-muted">{t("chat.empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  aria-current={active === c.id ? "page" : undefined}
                  className={cn("flex items-center gap-3 px-4 py-3 transition-colors duration-[120ms]", active === c.id ? "bg-primary-soft" : "hover:bg-surface")}
                >
                  <Avatar id={c.creatorId} name={c.name} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate", c.unread ? "font-medium" : "")}>{c.name}</span>
                      <span className="shrink-0 text-caption text-text-muted">{c.time}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-small", c.unread ? "text-text" : "text-text-muted")}>{c.preview}</span>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-caption font-medium text-on-primary" aria-label={tp("chat.unread", c.unread)}>
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className={cn("min-w-0", !active && "hidden md:block")}>{children}</div>
    </div>
  );
}
