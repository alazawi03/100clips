import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Composer } from "@/components/brand/chat/Composer";
import { ActiveOrders } from "@/components/brand/chat/ActiveOrders";
import { ReportButton } from "@/components/brand/chat/ReportButton";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { getConversation, markRead, messagesOf } from "@/lib/data/chatApi";
import { workspace } from "@/lib/data/live";
import { isActiveOrder } from "@/lib/statuses";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/today";

export default async function ConversationPage({ params, searchParams }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const conversation = await getConversation(id);
  const messages = conversation && (await messagesOf(conversation.id));
  if (!conversation || !messages) notFound();
  // Opening it reads everything so far (the inbox hides this chat's badge meanwhile).
  if (conversation.unread > 0) await markRead(conversation.id);
  const [i18n, ws] = await Promise.all([getI18n(), workspace()]);
  const { t, f } = i18n;
  const day = today();
  const creator = { id: conversation.creatorId, ...conversation.creator };
  // Work still going on with this creator for this brand (anything not approved yet), newest first.
  const active = ws.orders
    .filter((o) => o.creatorId === creator.id && o.brandId === conversation.brandId && isActiveOrder(o) && o.status !== "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const name = f.pick(creator.name);
  // From "Ask for an ad code" on a clip: the request is ready in the box, to edit or send.
  const draftOrder = query.draft === "adCode" && typeof query.order === "string" ? ws.order(query.order) : undefined;
  const draft = draftOrder && draftOrder.creatorId === creator.id ? t("adCode.requestMessage", { name, title: f.pick(draftOrder.title) }) : undefined;

  return (
    <Card className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden md:h-[calc(100dvh-10rem)]">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" aria-label={t("chat.back")} className="grid size-11 place-items-center rounded-full hover:bg-surface md:hidden">
          <ChevronRight aria-hidden className="size-5 rotate-180 rtl:rotate-0" />
        </Link>
        <Link href={`/creators/${creator.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-md)]">
          <Avatar id={creator.id} name={name} src={creator.photo} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{name}</span>
            <bdi dir="ltr" className="block truncate text-small text-text-muted">
              @{creator.handle}
            </bdi>
          </span>
        </Link>
        <ReportButton conversationId={conversation.id} />
      </header>
      <ActiveOrders orders={active} i18n={i18n} />

      {/* Newest at the bottom: column-reverse keeps the view pinned there. */}
      <ol className="flex flex-1 flex-col-reverse gap-2 overflow-y-auto p-4">
        {[...messages].reverse().map((message) => {
          const mine = message.from === "brand";
          return (
            <li key={message.id} className={cn("flex max-w-[80%] flex-col gap-1", mine ? "self-end items-end" : "self-start items-start")}>
              <p className={cn("whitespace-pre-wrap break-words rounded-[var(--radius-lg)] px-4 py-2", mine ? "bg-primary text-on-primary" : "bg-surface text-text")}>{message.text}</p>
              <span className="flex items-center gap-1 px-1 text-caption text-text-muted">
                {f.messageTime(message.at, day)}
              </span>
            </li>
          );
        })}
      </ol>

      <Composer key={draft ?? "empty"} conversationId={conversation.id} defaultText={draft} />
    </Card>
  );
}
