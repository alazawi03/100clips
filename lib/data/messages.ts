/*
 * Chat between a brand and its creators. A conversation opens once the creator accepts an order.
 * In-memory like the rest of the dummy data; swap for an API later.
 */

export type ChatMessage = {
  id: string;
  from: "brand" | "creator";
  text: string;
  /** ISO date-time. */
  at: string;
  /** Contact details were hidden from this message. */
  masked?: boolean;
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

export function conversationsOf(brandId: string): Conversation[] {
  const last = (c: Conversation) => c.messages.at(-1)?.at ?? "";
  return conversations.filter((c) => c.brandId === brandId).sort((a, b) => last(b).localeCompare(last(a)));
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}

export function unreadCount(brandId: string): number {
  return conversations.filter((c) => c.brandId === brandId && c.unread > 0).length;
}

export function markRead(id: string) {
  const c = getConversation(id);
  if (c) c.unread = 0;
}

const CONTACT_PATTERNS = [
  /[\w.+-]+@[\w-]+\.[\w.]+/g, // emails
  /(https?:\/\/|www\.)\S+/gi, // links
  /\b[\w-]+\.(com|net|org|me|io|co|bh|sa|ae|kw|qa|om)\b\S*/gi, // bare domains
  /\+?\d[\d\s-]{6,}\d/g, // phone numbers
];

/** Keeps deals on 100clips: phone numbers, emails and links are replaced with •••. */
export function maskContacts(text: string): { text: string; masked: boolean } {
  let masked = false;
  const out = CONTACT_PATTERNS.reduce(
    (acc, re) =>
      acc.replace(re, () => {
        masked = true;
        return "•••";
      }),
    text,
  );
  return { text: out, masked };
}

export function sendMessage(conversationId: string, text: string, at: string) {
  const c = getConversation(conversationId);
  if (!c) return;
  const clean = maskContacts(text);
  c.messages.push({ id: `msg-${seq++}`, from: "brand", text: clean.text, at, masked: clean.masked || undefined });
}
