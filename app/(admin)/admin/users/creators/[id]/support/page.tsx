import { notFound } from "next/navigation";
import { ChatRefresher } from "@/components/brand/chat/ChatRefresher";
import { SupportComposer } from "@/components/admin/SupportComposer";
import { SupportAvatar, SupportName } from "@/components/admin/SupportIdentity";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, ApiError } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { markRead, messagesOf, toChat } from "@/lib/data/chat";
import { cn } from "@/lib/cn";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/today";

type ConversationRow = components["schemas"]["Conversation"];

/** The creator's chat with 100Clips Support. Admins write as the official account, never as themselves. */
export default async function AdminSupportChatPage({ params }: PageProps<"/admin/users/creators/[id]/support">) {
  const { id } = await params;
  // Opened here the first time, so 100clips can write first.
  let row: ConversationRow;
  try {
    row = await api<ConversationRow>(`/admin/creators/${id}/support`, { method: "POST" });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
  const chat = toChat(row);
  await markRead(chat.id);
  const messages = await messagesOf(chat.id);
  const { t, f } = await getI18n();
  const name = f.pick(chat.creator.name);
  const day = today();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ChatRefresher />
      <PageHeader title={t("admin.support.title", { name })} back={{ href: "/admin/support", label: t("admin.support.inboxTitle") }} />
      <Card className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <SupportAvatar />
          <div className="min-w-0">
            <SupportName />
            <p className="text-small text-text-muted">{t("admin.support.writingAs")}</p>
          </div>
        </div>
        <ol className="flex min-h-64 flex-col gap-3 p-4">
          {messages.length === 0 && <li className="m-auto max-w-sm text-center text-small text-text-muted">{t("admin.support.empty", { name })}</li>}
          {messages.map((m) => {
            const mine = m.from === "admin";
            return (
              <li key={m.id} className={cn("flex max-w-[80%] items-end gap-2", mine ? "ms-auto flex-row-reverse" : "me-auto")}>
                {mine ? <SupportAvatar className="size-7" /> : <Avatar id={chat.creatorId} name={name} src={chat.creator.photo} size="xs" />}
                <div className={cn("rounded-[var(--radius-lg)] px-3.5 py-2", mine ? "bg-primary text-on-primary" : "bg-surface")}>
                  <p dir="auto" className="whitespace-pre-wrap">{m.text}</p>
                  <p className={cn("mt-1 text-caption", mine ? "opacity-70" : "text-text-muted")}>{f.messageTime(m.at, day)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <SupportComposer creatorId={id} />
      </Card>
    </div>
  );
}
