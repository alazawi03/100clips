"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBrand } from "@/lib/currentBrand";
import { getConversation, sendMessage } from "@/lib/data/messages";

export async function sendChatMessage(conversationId: string, form: FormData) {
  const text = String(form.get("text") ?? "").trim().slice(0, 2000);
  const conversation = getConversation(conversationId);
  if (!text || !conversation || conversation.brandId !== (await getCurrentBrand()).id) return;
  sendMessage(conversationId, text, new Date().toISOString());
  revalidatePath("/messages", "layout");
}
