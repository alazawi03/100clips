import { cache } from "react";
import { api, apiOrNothing } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { publicUrl } from "./storage";
import type { Localized } from "./types";

/*
 * Chat between the account's brands and creators, from the API. A chat opens once a creator accepts
 * an order, or when the brand messages a creator from their profile or an order.
 */

type ConversationRow = components["schemas"]["Conversation"];
type MessageRow = components["schemas"]["ChatMessage"];

export type ChatMessage = {
  id: string;
  from: "brand" | "creator";
  text: string;
  /** ISO date-time. */
  at: string;
};

export type Conversation = {
  id: string;
  brandId: string;
  creatorId: string;
  creator: { name: Localized; handle: string; photo?: string };
  /** Creator messages since the brand last opened it. */
  unread: number;
  last?: ChatMessage;
};

const names = (ar: string | null, en: string | null): Localized => ({ ar: ar || en || "", en: en || ar || "" });

function toMessage(row: MessageRow): ChatMessage {
  return { id: row.id, from: row.sender === "creator" ? "creator" : "brand", text: row.body, at: row.created_at };
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    brandId: row.brand_id!,
    creatorId: row.creator_id,
    creator: { name: names(row.creator.name_ar, row.creator.name_en), handle: row.creator.handle, photo: publicUrl(row.creator.photo_path) },
    unread: row.unread,
    last: row.last_message ? toMessage(row.last_message) : undefined,
  };
}

/** The account's chats, latest message first. Once per request. */
export const conversations = cache(async (): Promise<Conversation[]> => (await api<ConversationRow[]>("/conversations")).map(toConversation));

export async function getConversation(id: string): Promise<Conversation | undefined> {
  return (await conversations()).find((c) => c.id === id);
}

/** Chats with something new, for the badge in the header. */
export async function unreadCount(): Promise<number> {
  return (await conversations()).filter((c) => c.unread > 0).length;
}

/** The latest messages, oldest first; undefined if the chat isn't the account's. */
export async function messagesOf(id: string): Promise<ChatMessage[] | undefined> {
  return (await apiOrNothing<MessageRow[]>(`/conversations/${id}/messages?limit=200`))?.map(toMessage);
}

export async function markRead(id: string): Promise<void> {
  await api(`/conversations/${id}/read`, { method: "POST" });
}

export async function sendMessage(id: string, text: string): Promise<void> {
  await api(`/conversations/${id}/messages`, { method: "POST", body: { body: text } });
}

/** Sends `text` to a creator as a brand: in their chat, or as the first message of a new one. The chat's id. */
export async function startConversation(brandId: string, creatorId: string, text: string): Promise<string> {
  return (await api<ConversationRow>("/conversations", { method: "POST", body: { brand_id: brandId, creator_id: creatorId, body: text } })).id;
}
