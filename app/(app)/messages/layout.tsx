import { ChatRefresher } from "@/components/brand/chat/ChatRefresher";
import { MessagesShell } from "@/components/brand/chat/MessagesShell";
import { hasManyBrands } from "@/lib/brandFilter";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";
import { today } from "@/lib/today";

export default async function MessagesLayout({ children }: LayoutProps<"/messages">) {
  const { t, f } = await getI18n();
  const ws = await workspace();
  // With several brands, each chat says which brand it's for.
  const many = hasManyBrands(ws.brands);
  const list = ws.chats.map((c) => ({
    id: c.id,
    creatorId: c.creatorId,
    photo: c.creator.photo,
    name: many ? `${f.pick(c.creator.name)} · ${f.pick(ws.brand(c.brandId ?? undefined)?.name ?? { ar: "", en: "" })}` : f.pick(c.creator.name),
    preview: c.last ? `${c.last.from === "brand" ? `${t("chat.you")}: ` : ""}${c.last.text}` : "",
    time: c.last ? f.messageTime(c.last.at, today()) : "",
    unread: c.unread,
  }));
  return (
    <MessagesShell conversations={list}>
      <ChatRefresher />
      {children}
    </MessagesShell>
  );
}
