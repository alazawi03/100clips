"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { conversations, sendMessage, startConversation } from "@/lib/data/chatApi";
import { workspace } from "@/lib/data/live";
import { API_REPORT_REASON, REPORT_REASONS, type ReportReason } from "@/lib/reportReasons";

/** What the message box shows after sending: on failure, the text again with an error (`suspended`: the account can't start chats). */
export type SendState = { failed: boolean; text?: string; suspended?: boolean } | undefined;

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
 * "Message" on a creator profile, order or campaign: opens the chat with them. `brandId` picks that
 * brand's chat; from a profile (no brand in view) it's the latest chat with them. With none yet, the
 * page to write the first message: a chat starts with it, so creators never get an empty one.
 */
export async function messageCreator(creatorId: string, brandId?: string) {
  const { brands } = await workspace();
  if (brands.length === 0) return;
  const brand = brandId && brands.some((b) => b.id === brandId) ? brandId : undefined;
  const chats = (await conversations()).filter((c) => c.creatorId === creatorId);
  const chat = brand ? chats.find((c) => c.brandId === brand) : chats[0];
  if (chat) redirect(`/messages/${chat.id}`);
  redirect(`/messages/new?creator=${creatorId}${brand ? `&brand=${brand}` : ""}`);
}

/** "Ask for an ad code" on a clip: opens that chat (or a first message) with a ready-made request in the message box. */
export async function requestAdCode(orderId: string) {
  const order = (await workspace()).order(orderId);
  if (!order) return;
  const chat = (await conversations()).find((c) => c.brandId === order.brandId && c.creatorId === order.creatorId);
  const draft = `draft=adCode&order=${order.id}`;
  redirect(chat ? `/messages/${chat.id}?${draft}` : `/messages/new?creator=${order.creatorId}&brand=${order.brandId}&${draft}`);
}

/** The first message to a creator, as one of the account's brands: the chat starts with it. */
export async function startChat(creatorId: string, brandId: string, _prev: SendState, form: FormData): Promise<SendState> {
  const text = String(form.get("text") ?? "").trim().slice(0, 4000);
  if (!text) return undefined;
  let id: string;
  try {
    id = await startConversation(brandId, creatorId, text);
  } catch (e) {
    console.error("Starting a chat failed:", e instanceof ApiError ? `${e.status} ${e.message}` : e);
    return { failed: true, text, suspended: e instanceof ApiError && e.status === 403 };
  }
  revalidatePath("/messages", "layout");
  redirect(`/messages/${id}`);
}

/**
 * "Report" in a chat: saved through the API for the admin to review. Messages stay visible to both
 * sides. "already" while this side's earlier report is still open (nothing new is saved).
 */
export async function reportConversation(conversationId: string, reason: string, details: string): Promise<"sent" | "already" | "failed"> {
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return "failed";
  try {
    await api(`/conversations/${conversationId}/reports`, {
      method: "POST",
      body: { reason: API_REPORT_REASON[reason as ReportReason], details: details.trim().slice(0, 500) || undefined },
    });
    return "sent";
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) return "already";
    console.error("Reporting a chat failed:", e instanceof ApiError ? `${e.status} ${e.message}` : e);
    return "failed";
  }
}
