/*
 * Chat between a brand and its creators. A conversation opens once the creator accepts an order,
 * or when the brand messages a creator from their profile.
 * In-memory like the rest of the dummy data; swap for an API later.
 */

import type { ReportReason } from "@/lib/reportReasons";

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
  orderId?: string;
  unread: number;
  messages: ChatMessage[];
};

let seq = 100;
const m = (from: ChatMessage["from"], text: string, at: string): ChatMessage => ({ id: `msg-${seq++}`, from, text, at: `${at}:00+03:00` });

export const conversations: Conversation[] = [
  {
    id: "chat-sultan",
    brandId: "muharraq-roastery",
    creatorId: "sultan-alotaibi",
    orderId: "ord-1042",
    unread: 1,
    messages: [
      m("brand", "هلا سلطان، نبي التركيز على أول رشفة واسم الفرع ظاهر.", "2026-09-29T10:12"),
      m("creator", "أبشر، بصور من الباب للطاولة وبوضح اللوحة.", "2026-09-29T10:30"),
      m("creator", "رفعت المقطع، إن شاء الله يعجبكم.", "2026-10-02T21:05"),
    ],
  },
  {
    id: "chat-maryam",
    brandId: "muharraq-roastery",
    creatorId: "maryam-alkuwari",
    orderId: "ord-1037",
    unread: 0,
    messages: [
      m("brand", "مقطعك حلو، بس الكوب ما يبان في أول 3 ثواني.", "2026-09-30T13:00"),
      m("creator", "تمام، بعيد أول لقطة وأرسله لكم بكرة.", "2026-09-30T13:20"),
    ],
  },
  {
    id: "chat-latifa",
    brandId: "muharraq-roastery",
    creatorId: "latifa-alshamsi",
    orderId: "ord-1036",
    unread: 2,
    messages: [
      m("creator", "مرحبا، أقدر أصور في الفرع يوم السبت الصبح؟", "2026-10-02T09:15"),
      m("creator", "وهل في مشروب معين تحبون أركز عليه؟", "2026-10-02T09:16"),
    ],
  },
  {
    id: "chat-khalid",
    brandId: "muharraq-roastery",
    creatorId: "khalid-almutairi",
    orderId: "ord-1035",
    unread: 0,
    messages: [
      m("creator", "نزلت التطبيق وجربت الطلب، التجربة سهلة.", "2026-09-27T18:40"),
      m("brand", "ممتاز، وضّح خطوة الاستلام من الفرع لو تكرمت.", "2026-09-27T19:02"),
    ],
  },
  {
    id: "chat-maryam-nouf",
    brandId: "nouf-abayas",
    creatorId: "maryam-alkuwari",
    orderId: "ord-2003",
    unread: 1,
    messages: [
      m("brand", "يا هلا مريم، العباية وصلتك؟", "2026-09-24T11:00"),
      m("creator", "وصلت، روعة التطريز. المقطع جاهز الحين.", "2026-10-01T20:30"),
    ],
  },
  {
    id: "chat-noura-nouf",
    brandId: "nouf-abayas",
    creatorId: "noura-alkaabi",
    orderId: "ord-2002",
    unread: 0,
    messages: [m("creator", "بصور في عزيمة العايلة الجمعة.", "2026-09-28T16:45")],
  },
];

export function conversationsOf(): Conversation[] {
  const last = (c: Conversation) => c.messages.at(-1)?.at ?? "";
  return conversations.slice().sort((a, b) => last(b).localeCompare(last(a)));
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}

export function unreadCount(): number {
  return conversations.filter((c) => c.unread > 0).length;
}

export function markRead(id: string) {
  const c = getConversation(id);
  if (c) c.unread = 0;
}

export function sendMessage(conversationId: string, text: string, at: string) {
  const c = getConversation(conversationId);
  if (!c) return;
  c.messages.push({ id: `msg-${seq++}`, from: "brand", text, at });
}

/** The conversation with a creator, started empty if there isn't one yet. */
export function openConversation(brandId: string, creatorId: string): Conversation {
  // One chat per brand and creator.
  const existing = conversations.find((c) => c.creatorId === creatorId && c.brandId === brandId);
  if (existing) return existing;
  const created: Conversation = { id: `chat-${creatorId}-${brandId}`, brandId, creatorId, unread: 0, messages: [] };
  conversations.push(created);
  return created;
}

/** A report about a conversation, for the admin to review. */
export type ChatReport = { id: string; conversationId: string; reason: ReportReason; details?: string; at: string };
export const reports: ChatReport[] = [];

export function addReport(conversationId: string, reason: ReportReason, details: string | undefined, at: string) {
  if (!getConversation(conversationId)) return;
  reports.push({ id: `rep-${seq++}`, conversationId, reason, details, at });
}
