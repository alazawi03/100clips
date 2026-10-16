"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { conversations, openConversation, sendMessage } from "@/lib/data/chatApi";
import { workspace } from "@/lib/data/live";
import { API_REPORT_REASON, REPORT_REASONS, type ReportReason } from "@/lib/reportReasons";

/** What the message box shows after sending: on failure, the text again with an error. */
export type SendState = { failed: boolean; text?: string } | undefined;

export async function sendChatMessage(conversationId: string, _prev: SendState, form: FormData): Promise<SendState> {
  const text = String(form.get("text") ?? "").trim().slice(0, 4000);
  if (!text) return undefined;
  try {
    await sendMessage(conversationId, text);
  } catch (e) {
    console.error("Sending a message failed:", e instanceof ApiError ? `${e.status} ${e.message}` : e);
    return { failed: true, text };
  }
  revalidatePath("/messages", "layout");
  return undefined;
}

/**
 * "Message" on a creator profile, order or campaign: opens the chat with them, starting one if needed.
 * `brandId` picks that brand's chat; from a profile (no brand in view) it's the existing chat if any,
 * else the first brand's.
 */
export async function messageCreator(creatorId: string, brandId?: string) {
  const { brands } = await workspace();
  if (brands.length === 0) return;
  const brand = brandId && brands.some((b) => b.id === brandId)
    ? brandId
    : ((await conversations()).find((c) => c.creatorId === creatorId)?.brandId ?? brands[0].id);
  const id = await openConversation(brand, creatorId);
  revalidatePath("/messages", "layout");
  redirect(`/messages/${id}`);
}

/** "Ask for an ad code" on a clip: opens that chat with a ready-made request in the message box. */
export async function requestAdCode(orderId: string) {
  const order = (await workspace()).order(orderId);
  if (!order) return;
  const id = await openConversation(order.brandId, order.creatorId);
  revalidatePath("/messages", "layout");
  redirect(`/messages/${id}?draft=adCode&order=${order.id}`);
}

/**
 * "Report" in a chat: saved through the API for the admin to review. Messages stay visible to both
 * sides. Reporting again while the first is open counts as sent. False if it couldn't be saved.
 */
export async function reportConversation(conversationId: string, reason: string, details: string): Promise<boolean> {
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return false;
  try {
    await api(`/conversations/${conversationId}/reports`, {
      method: "POST",
      body: { reason: API_REPORT_REASON[reason as ReportReason], details: details.trim().slice(0, 500) || undefined },
    });
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) return true;
    console.error("Reporting a chat failed:", e instanceof ApiError ? `${e.status} ${e.message}` : e);
    return false;
  }
}
