import { MessagesShell } from "@/components/brand/chat/MessagesShell";
import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { conversationsOf } from "@/lib/data/messages";
import { getI18n } from "@/lib/i18n/server";

export default async function MessagesLayout({ children }: LayoutProps<"/messages">) {
  const { t, f } = await getI18n();
  const list = conversationsOf().map((c) => {
    const last = c.messages.at(-1);
    return {
      id: c.id,
      creatorId: c.creatorId,
      name: f.pick(getCreator(c.creatorId)!.name),
      preview: last ? `${last.from === "brand" ? `${t("chat.you")}: ` : ""}${last.text}` : "",
      time: last ? f.messageTime(last.at, DEMO_TODAY) : "",
      unread: c.unread,
    };
  });
  return <MessagesShell conversations={list}>{children}</MessagesShell>;
}
