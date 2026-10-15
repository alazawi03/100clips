"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { sendMessage } from "@/lib/data/chat";
import { workspace } from "@/lib/data/live";
import { REPORT_REASONS, type ReportReason } from "@/lib/reportReasons";

/* Chat with creators, on the API. A chat opens when the creator accepts an order: there's none to start before that. */

export async function sendChatMessage(conversationId: string, form: FormData) {
  const text = String(form.get("text") ?? "").trim().slice(0, 4000);
  if (!text) return;
  try {
    await sendMessage(conversationId, text);
  } catch (e) {
    console.error("Sending a message failed:", e instanceof ApiError ? `${e.status} ${e.message}` : e);
  }
  revalidatePath("/messages", "layout");
}

/**
 * Opens the chat with a creator. From an order or campaign, `brandId` picks that brand's chat; from a
 * profile (no brand in view) it's the most recent chat with them. Nothing when there's none yet.
 */
export async function messageCreator(creatorId: string, brandId?: string) {
  const ws = await workspace();
  const chat = brandId ? ws.chatWith(brandId, creatorId) : ws.chats.find((c) => c.creatorId === creatorId);
  if (!chat) return;
  redirect(`/messages/${chat.id}`);
}

/** "Ask for an ad code" on a clip: opens that chat with a ready-made request in the message box. */
export async function requestAdCode(orderId: string) {
  const ws = await workspace();
  const order = ws.order(orderId);
  const chat = order && ws.chatWith(order.brandId, order.creatorId);
  if (!chat) return;
  redirect(`/messages/${chat.id}?draft=adCode&order=${order.id}`);
}

const REASON: Record<ReportReason, string> = { offPlatform: "off_platform", abuse: "abuse", spam: "spam", other: "other" };

/** "Report" in a chat: 100clips reviews it. Messages stay visible to both sides. */
export async function reportConversation(conversationId: string, reason: string, details: string) {
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return;
  const note = details.trim().slice(0, 1000);
  await api(`/conversations/${conversationId}/reports`, { method: "POST", body: { reason: REASON[reason as ReportReason], ...(note ? { details: note } : {}) } });
}
