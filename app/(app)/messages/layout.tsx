import { MessagesShell } from "@/components/brand/chat/MessagesShell";
import { conversations } from "@/lib/data/chatApi";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/today";

export default async function MessagesLayout({ children }: LayoutProps<"/messages">) {
  const { t, f } = await getI18n();
  const day = today();
  const list = (await conversations()).map((c) => ({
    id: c.id,
    creatorId: c.creatorId,
    name: f.pick(c.creator.name),
    photo: c.creator.photo,
    preview: c.last ? `${c.last.from === "brand" ? `${t("chat.you")}: ` : ""}${c.last.text}` : "",
    time: c.last ? f.messageTime(c.last.at, day) : "",
    unread: c.unread,
  }));
  return <MessagesShell conversations={list}>{children}</MessagesShell>;
}
