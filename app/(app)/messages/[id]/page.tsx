import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, EyeOff, ShieldCheck } from "lucide-react";
import { Composer } from "@/components/brand/chat/Composer";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { getCurrentBrand } from "@/lib/currentBrand";
import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { getConversation, markRead } from "@/lib/data/messages";
import { getI18n } from "@/lib/i18n/server";

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const conversation = getConversation(id);
  if (!conversation || conversation.brandId !== (await getCurrentBrand()).id) notFound();
  markRead(conversation.id);
  const { t, f } = await getI18n();
  const creator = getCreator(conversation.creatorId)!;
  const name = f.pick(creator.name);

  return (
    <Card className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden md:h-[calc(100dvh-10rem)]">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" aria-label={t("chat.back")} className="grid size-11 place-items-center rounded-full hover:bg-surface md:hidden">
          <ChevronRight aria-hidden className="size-5 rotate-180 rtl:rotate-0" />
        </Link>
        <Link href={`/creators/${creator.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-md)]">
          <Avatar id={creator.id} name={name} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{name}</span>
            <bdi dir="ltr" className="block truncate text-small text-text-muted">
              @{creator.handle}
            </bdi>
          </span>
        </Link>
        {conversation.orderId && (
          <Link href={`/orders/${conversation.orderId}`} className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-small font-medium text-primary hover:bg-primary-soft">
            {t("chat.viewOrder")}
          </Link>
        )}
      </header>

      {/* Newest at the bottom: column-reverse keeps the view pinned there. */}
      <ol className="flex flex-1 flex-col-reverse gap-2 overflow-y-auto p-4">
        {[...conversation.messages].reverse().map((message) => {
          const mine = message.from === "brand";
          return (
            <li key={message.id} className={cn("flex max-w-[80%] flex-col gap-1", mine ? "self-end items-end" : "self-start items-start")}>
              <p className={cn("whitespace-pre-wrap break-words rounded-[var(--radius-lg)] px-4 py-2", mine ? "bg-primary text-on-primary" : "bg-surface text-text")}>{message.text}</p>
              <span className="flex items-center gap-1 px-1 text-caption text-text-muted">
                {message.masked && (
                  <>
                    <EyeOff aria-hidden className="size-3" />
                    {t("chat.maskedNote")}
                    {t("common.separator")}
                  </>
                )}
                {f.messageTime(message.at, DEMO_TODAY)}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="flex items-center gap-2 border-t border-border bg-surface/60 px-4 py-2 text-caption text-text-muted">
        <ShieldCheck aria-hidden className="size-4 shrink-0" />
        {t("chat.guard")}
      </p>
      <Composer conversationId={conversation.id} />
    </Card>
  );
}
