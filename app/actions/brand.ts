"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { account, productsOf } from "@/lib/data/account";
import { getCurrentBrand } from "@/lib/currentBrand";
import * as store from "@/lib/data/store";
import type { ContentFormat, Niche } from "@/lib/data/types";
import type { MessageKey } from "@/lib/i18n/messages";

/**
 * errors: field name → translation key of the problem, shown next to each field.
 * values: what was submitted, so the form can show it again (React clears forms after an action).
 */
export type FormState = { errors: Partial<Record<string, MessageKey>>; values: Record<string, string> } | null;

const NICHES: Niche[] = ["beauty", "food", "fashion", "tech", "travel", "fitness", "family", "gaming"];

function submitted(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  });
  return values;
}

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function int(form: FormData, name: string) {
  const n = Number(text(form, name));
  return Number.isFinite(n) ? n : NaN;
}

/** Dummy data has no translation step, so typed text is shown as-is in both languages. */
function same(value: string) {
  return { ar: value, en: value };
}

/* ---------- Cart ---------- */

/** Set how many clips of each format to hire this creator for. Used on the profile and in the cart. */
export async function updateCart(creatorId: string, items: Array<{ format: ContentFormat; quantity: number }>) {
  store.setCartLine((await getCurrentBrand()).id, creatorId, items);
  revalidatePath("/", "layout");
}

export async function checkout(_prev: FormState, form: FormData): Promise<FormState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const brand = await getCurrentBrand();
  const { lines, total } = store.priceCart(store.cartOf(brand.id));
  const title = text(form, "title");
  const brief = text(form, "brief");
  const productId = text(form, "productId");
  const useBalance = form.get("useBalance") === "on";
  const byCard = total - (useBalance ? Math.min(account.balance, total) : 0);

  if (lines.length === 0) errors.title = "forms.errors.cartEmpty";
  if (!title) errors.title = "forms.errors.titleRequired";
  if (!productId || !productsOf(brand.id).some((p) => p.id === productId)) errors.productId = "forms.errors.pickProduct";
  if (brief.length < 20) errors.brief = "forms.errors.briefTooShort";
  if (form.get("rules") !== "on") errors.rules = "forms.errors.acceptRules";
  if (byCard > 0) {
    // Mock card form: checks the shape only. Nothing is charged.
    if (!text(form, "cardName")) errors.cardName = "forms.errors.cardName";
    if (!/^\d{16}$/.test(text(form, "cardNumber").replace(/\s/g, ""))) errors.cardNumber = "forms.errors.cardNumber";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(text(form, "cardExpiry"))) errors.cardExpiry = "forms.errors.cardExpiry";
    if (!/^\d{3,4}$/.test(text(form, "cardCvc"))) errors.cardCvc = "forms.errors.cardCvc";
  }
  if (Object.keys(errors).length > 0) return { errors, values: submitted(form) };

  const notes = Object.fromEntries(lines.map((l) => [l.creator.id, text(form, `note-${l.creator.id}`)]));
  const result = store.checkoutCart({ brandId: brand.id, title: same(title), productId, brief: same(brief), notes, useBalance });
  if (!result) return { errors: { title: "forms.errors.cartEmpty" }, values: submitted(form) };
  revalidatePath("/", "layout");
  redirect(`/campaigns/${result.campaign.id}?done=paid`);
}

export async function createCampaign(_prev: FormState, form: FormData): Promise<FormState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const title = text(form, "title");
  const brief = text(form, "brief");
  const niche = text(form, "niche") as Niche;
  const clipsCount = int(form, "clipsCount");
  const budget = Number(text(form, "budget"));
  const publish = form.get("intent") !== "draft";

  if (!title) errors.title = "forms.errors.titleRequired";
  if (brief.length < 20) errors.brief = "forms.errors.briefTooShort";
  if (!NICHES.includes(niche)) errors.niche = "forms.errors.pickNiche";
  if (!Number.isInteger(clipsCount) || clipsCount < 1 || clipsCount > 50) errors.clipsCount = "forms.errors.clipsCountRange";
  if (!Number.isFinite(budget) || budget <= 0) errors.budget = "forms.errors.budgetPositive";
  else if (Number.isInteger(clipsCount) && clipsCount > 0 && budget / clipsCount < 10) errors.budget = "forms.errors.budgetPerClipMin";
  if (publish && form.get("rules") !== "on") errors.rules = "forms.errors.acceptRules";
  if (Object.keys(errors).length > 0) return { errors, values: submitted(form) };

  const campaign = store.createCampaign({ brandId: (await getCurrentBrand()).id, title: same(title), brief: same(brief), niche, clipsCount, budget, publish });
  revalidatePath("/", "layout");
  redirect(`/campaigns/${campaign.id}?done=${publish ? "published" : "draftSaved"}`);
}

export async function publishCampaign(campaignId: string) {
  store.publishCampaign(campaignId);
  revalidatePath("/", "layout");
  redirect(`/campaigns/${campaignId}?done=published`);
}

export async function decideApplication(campaignId: string, creatorId: string, decision: "accepted" | "rejected") {
  store.decideApplication(campaignId, creatorId, decision);
  revalidatePath("/", "layout");
}

export async function approveOrder(orderId: string) {
  store.approveOrder(orderId);
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?done=approved`);
}

export async function requestRevision(orderId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const note = text(form, "note");
  if (note.length < 10) return { errors: { note: "forms.errors.revisionNote" }, values: submitted(form) };
  store.requestRevision(orderId, note);
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?done=revisionSent`);
}
