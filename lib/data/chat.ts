import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { publicUrl } from "./storage";
import type { Gender, Localized } from "./types";

/*
 * Chat from the API: a brand's chats with creators (opened when a creator accepts an order), and
 * for admins the creators' support chats. Messages are on the API; pages poll for new ones.
 */

type ConversationRow = components["schemas"]["Conversation"];
type MessageRow = components["schemas"]["Message"];

export type ChatMessage = { id: string; from: "brand" | "creator" | "admin"; text: string; at: string };

export type Chat = {
  id: string;
  /** Null for a creator's support chat with the 100clips team. */
  brandId: string | null;
  creatorId: string;
  creator: { name: Localized; handle: string; photo?: string; gender?: Gender };
  orderId?: string;
  /** Messages from the other side the account hasn't read yet. */
  unread: number;
  last?: ChatMessage;
  /** When the other side last read the chat. */
  otherReadAt?: string;
  side: ConversationRow["side"];
  reported: boolean;
};

const names = (ar: string | null | undefined, en: string | null | undefined): Localized => ({ ar: ar || en || "", en: en || ar || "" });

export const toMessage = (m: MessageRow): ChatMessage => ({ id: m.id, from: m.sender, text: m.body, at: m.created_at });

export function toChat(c: ConversationRow): Chat {
  return {
    id: c.id,
    brandId: c.brand?.id ?? null,
    creatorId: c.creator.id,
    creator: { name: names(c.creator.name_ar, c.creator.name_en), handle: c.creator.handle, photo: publicUrl(c.creator.photo_path), gender: c.creator.gender ?? undefined },
    orderId: c.order_id ?? undefined,
    unread: c.unread,
    last: c.last_message ? toMessage(c.last_message) : undefined,
    otherReadAt: c.other_read_at ?? undefined,
    side: c.side,
    reported: c.reported,
  };
}

/** Every chat of one kind, the most recently active first. */
export async function chats(kind: "brand" | "support"): Promise<Chat[]> {
  const rows: ConversationRow[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await api<ConversationRow[]>(`/conversations?kind=${kind}&limit=100&offset=${offset}`);
    rows.push(...page);
    if (page.length < 100) return rows.map(toChat);
  }
}

export async function chat(id: string): Promise<Chat | undefined> {
  try {
    return toChat(await api<ConversationRow>(`/conversations/${id}`));
  } catch {
    return undefined;
  }
}

/** The latest messages, oldest first. */
export async function messagesOf(id: string): Promise<ChatMessage[]> {
  return (await api<MessageRow[]>(`/conversations/${id}/messages?limit=200`)).map(toMessage);
}

export async function sendMessage(id: string, text: string) {
  await api(`/conversations/${id}/messages`, { method: "POST", body: { body: text } });
}

/** The account has read the chat up to now (its own side only). */
export async function markRead(id: string) {
  await api(`/conversations/${id}/read`, { method: "POST" });
}
