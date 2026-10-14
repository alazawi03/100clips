import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCheck, ChevronRight } from "lucide-react";
import { Composer } from "@/components/brand/chat/Composer";
import { ActiveOrders } from "@/components/brand/chat/ActiveOrders";
import { ReportButton } from "@/components/brand/chat/ReportButton";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { markRead, messagesOf } from "@/lib/data/chat";
import { workspace } from "@/lib/data/live";
import { isActiveOrder } from "@/lib/statuses";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/today";

export default async function ConversationPage({ params, searchParams }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const ws = await workspace();
  const conversation = ws.chats.find((c) => c.id === id);
  if (!conversation) notFound();
  // Opening the chat reads it (the brand's side only).
  await markRead(id);
  const messages = await messagesOf(id);
  const i18n = await getI18n();
  const { t, f } = i18n;
  const day = today();
  const creator = ws.creator(conversation.creatorId);
  const name = f.pick(creator?.name ?? conversation.creator.name);
  // Work still going on with this creator for this brand (anything not approved yet), newest first.
  const active = ws.orders
    .filter((o) => o.creatorId === conversation.creatorId && o.brandId === conversation.brandId && isActiveOrder(o) && o.status !== "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // From "Ask for an ad code" on a clip: the request is ready in the box, to edit or send.
  const draftOrder = query.draft === "adCode" && typeof query.order === "string" ? ws.order(query.order) : undefined;
  const draft = draftOrder && draftOrder.creatorId === conversation.creatorId ? t("adCode.requestMessage", { name, title: f.pick(draftOrder.title) }) : undefined;
  // The creator has read up to here: "Seen" under the brand's last message before then.
  const lastMine = messages.findLast((m) => m.from === "brand");
  const seen = !!lastMine && !!conversation.otherReadAt && conversation.otherReadAt >= lastMine.at;

  return (
    <Card className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden md:h-[calc(100dvh-10rem)]">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" aria-label={t("chat.back")} className="grid size-11 place-items-center rounded-full hover:bg-surface md:hidden">
          <ChevronRight aria-hidden className="size-5 rotate-180 rtl:rotate-0" />
        </Link>
        <Link href={`/creators/${conversation.creatorId}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-md)]">
          <Avatar id={conversation.creatorId} name={name} src={conversation.creator.photo} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{name}</span>
            <bdi dir="ltr" className="block truncate text-small text-text-muted">
              @{conversation.creator.handle}
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
              <p dir="auto" className={cn("whitespace-pre-wrap break-words rounded-[var(--radius-lg)] px-4 py-2", mine ? "bg-primary text-on-primary" : "bg-surface text-text")}>{message.text}</p>
              <span className="flex items-center gap-1 px-1 text-caption text-text-muted">
                {f.messageTime(message.at, day)}
                {message.id === lastMine?.id && seen && (
                  <>
                    <CheckCheck aria-hidden className="size-3.5 text-primary" />
                    {t("chat.seen")}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <Composer key={draft ?? "empty"} conversationId={conversation.id} defaultText={draft} />
    </Card>
  );
}
