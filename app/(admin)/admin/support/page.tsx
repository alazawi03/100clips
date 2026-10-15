import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ChatRefresher } from "@/components/brand/chat/ChatRefresher";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { chats } from "@/lib/data/chat";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/today";

/** Creators' chats with 100Clips Support, the most recently active first. Unread ones stand out. */
export default async function AdminSupportPage() {
  const { t, tp, f } = await getI18n();
  const list = await chats("support");
  const day = today();

  return (
    <div className="flex flex-col gap-6">
      <ChatRefresher />
      <PageHeader title={t("admin.support.inboxTitle")} subtitle={t("admin.support.inboxSubtitle")} />
      {list.length === 0 ? (
        <EmptyState title={t("admin.support.inboxEmpty")} />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {list.map((c) => {
              const name = f.pick(c.creator.name);
              const preview = c.last ? (c.last.from === "admin" ? t("admin.support.fromTeam", { text: c.last.text }) : t("admin.support.fromCreator", { name, text: c.last.text })) : "";
              return (
                <li key={c.id}>
                  <Link href={`/admin/users/creators/${c.creatorId}/support`} className="flex items-center gap-3 p-4 hover:bg-surface sm:px-5">
                    <Avatar id={c.creatorId} name={name} src={c.creator.photo} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate", c.unread ? "font-medium" : "")}>{name}</span>
                        {c.last && <span className="shrink-0 text-caption text-text-muted">{f.messageTime(c.last.at, day)}</span>}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-small", c.unread ? "text-text" : "text-text-muted")}>{preview}</span>
                        {c.unread > 0 && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-caption font-medium text-on-primary" aria-label={tp("chat.unread", c.unread)}>
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronLeft aria-hidden className="size-5 rotate-180 text-text-muted rtl:rotate-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
