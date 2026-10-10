"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { brands } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { getOrder } from "@/lib/data/orders";
import { addReport, conversations, getConversation, openConversation, sendMessage } from "@/lib/data/messages";
import { REPORT_REASONS, type ReportReason } from "@/lib/reportReasons";

export async function sendChatMessage(conversationId: string, form: FormData) {
  const text = String(form.get("text") ?? "").trim().slice(0, 2000);
  const conversation = getConversation(conversationId);
  if (!text || !conversation) return;
  sendMessage(conversationId, text, new Date().toISOString());
  revalidatePath("/messages", "layout");
}

/** "Message" on a creator profile: opens the existing chat with them, or starts one. */
/**
 * Opens the chat with a creator, starting one if needed. From an order or campaign, `brandId` picks that
 * brand's chat; from a profile (no brand in view) it's the existing chat if any, else the first brand's.
 */
export async function messageCreator(creatorId: string, brandId?: string) {
  if (!getCreator(creatorId) || brands.length === 0) return;
  const brand = brandId && brands.some((b) => b.id === brandId) ? brandId : (conversations.find((c) => c.creatorId === creatorId)?.brandId ?? brands[0].id);
  const conversation = openConversation(brand, creatorId);
  revalidatePath("/messages", "layout");
  redirect(`/messages/${conversation.id}`);
}

/** "Ask for an ad code" on a clip: opens that chat with a ready-made request in the message box. */
export async function requestAdCode(orderId: string) {
  const order = getOrder(orderId);
  if (!order) return;
  const conversation = openConversation(order.brandId, order.creatorId);
  revalidatePath("/messages", "layout");
  redirect(`/messages/${conversation.id}?draft=adCode&order=${order.id}`);
}

/** "Report" in a chat: the admin reviews it. Messages stay visible to both sides. */
export async function reportConversation(conversationId: string, reason: string, details: string) {
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return;
  addReport(conversationId, reason as ReportReason, details.trim().slice(0, 500) || undefined, new Date().toISOString());
}
