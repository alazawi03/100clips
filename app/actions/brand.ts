"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { account, DEMO_TODAY, getBrand, productsOf } from "@/lib/data/account";
import * as lists from "@/lib/data/lists";
import { getCreator } from "@/lib/data/creators";
import * as store from "@/lib/data/store";
import { VIDEO_STYLES, type ContentFormat, type Localized, type ProductLogistics, type VideoStyle } from "@/lib/data/types";
import type { MessageKey } from "@/lib/i18n/messages";

/**
 * errors: field name → translation key of the problem, shown next to each field.
 * values: what was submitted, so the form can show it again (React clears forms after an action).
 */
export type FormState = { errors: Partial<Record<string, MessageKey>>; values: Record<string, string> } | null;

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

/** Dummy data has no translation step, so typed text is shown as-is in both languages. */
function same(value: string) {
  return { ar: value, en: value };
}

/* ---------- Lists ---------- */

/** Creates a named list, with the creator in it when saving from a profile. */
export async function createCreatorList(name: string, creatorId?: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  lists.createList(clean, creatorId);
  revalidatePath("/", "layout");
}

export async function setCreatorInList(listId: string, creatorId: string, on: boolean) {
  lists.setInList(listId, creatorId, on);
  revalidatePath("/", "layout");
}

/* ---------- Cart ---------- */

/** Set how many clips of each format to hire this creator for. Used on the profile and in the cart. */
export async function updateCart(creatorId: string, items: Array<{ format: ContentFormat; quantity: number }>) {
  store.setCartLine(creatorId, items);
  revalidatePath("/", "layout");
}

/** "Find creators for this product": remember the product, then browse creators; checkout starts with it selected. */
export async function hireForProduct(brandId: string, productId: string) {
  store.setCheckoutDefault({ brandId, productId });
  redirect("/explore");
}

/** A real yyyy-mm-dd date, as DateInput sends it. */
function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDate() === d && date.getUTCMonth() === m - 1;
}

function isUrl(value: string) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Reads "log-<productId>-<field>" for each selected product, by its type. Services need nothing here. */
function parseLogistics(form: FormData, products: ReturnType<typeof productsOf>, errors: NonNullable<FormState>["errors"]) {
  const logistics: Record<string, ProductLogistics> = {};
  for (const p of products) {
    const field = (key: string) => `log-${p.id}-${key}`;
    const get = (key: string) => text(form, field(key));
    if (p.details.type === "physical") {
      logistics[p.id] = { type: "physical", after: get("after") === "return" ? "return" : "keep" };
    } else if (p.details.type === "app") {
      const link = get("link");
      if (link && !isUrl(link)) errors[field("link")] = "forms.errors.urlInvalid";
      logistics[p.id] = { type: "app", link: link || undefined, testAccount: get("account") || undefined, promoCode: get("promo") || undefined };
    } else if (p.details.type === "venue") {
      // Visit dates are optional; when both are given, "until" can't be before "from".
      const visitFrom = get("from");
      const visitTo = get("to");
      if (visitFrom && !isIsoDate(visitFrom)) errors[field("from")] = "forms.errors.dateInvalid";
      if (visitTo && !isIsoDate(visitTo)) errors[field("to")] = "forms.errors.dateInvalid";
      else if (isIsoDate(visitFrom) && visitTo < visitFrom) errors[field("to")] = "forms.errors.visitOrder";
      logistics[p.id] = { type: "venue", visitFrom: visitFrom || undefined, visitTo: visitTo || undefined, included: get("included") || undefined };
    }
  }
  return logistics;
}

/** Checkout's result: field errors, or `paid` with what the success screen shows before moving on. */
export type CheckoutState = (NonNullable<FormState> & { paid?: { campaignId: string; creators: Array<{ id: string; name: Localized }> } }) | null;

/** Mock card form: checks the shape only, and only when something is left to pay by card. Nothing is charged. */
function checkCard(form: FormData, byCard: number, errors: NonNullable<FormState>["errors"]) {
  if (byCard <= 0) return;
  if (!text(form, "cardName")) errors.cardName = "forms.errors.cardName";
  if (!/^\d{16}$/.test(text(form, "cardNumber").replace(/\s/g, ""))) errors.cardNumber = "forms.errors.cardNumber";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(text(form, "cardExpiry"))) errors.cardExpiry = "forms.errors.cardExpiry";
  if (!/^\d{3,4}$/.test(text(form, "cardCvc"))) errors.cardCvc = "forms.errors.cardCvc";
}

export async function checkout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const brand = getBrand(text(form, "brandId"));
  const { lines, total } = store.priceCart(store.cartOf());
  const title = text(form, "title");
  const brief = text(form, "brief");
  const promote = form.get("promote") === "brand" ? "brand" : "products";
  const productIds = promote === "products" ? form.getAll("productId").map(String) : [];
  const useBalance = form.get("useBalance") === "on";
  const byCard = total - (useBalance ? Math.min(account.balance, total) : 0);

  if (lines.length === 0) errors.title = "forms.errors.cartEmpty";
  if (!title) errors.title = "forms.errors.titleRequired";
  if (!brand) errors.brandId = "forms.errors.pickBrand";
  // One product per campaign.
  else if (promote === "products" && (productIds.length !== 1 || !productsOf(brand.id).some((p) => p.id === productIds[0]))) errors.productId = "forms.errors.pickProduct";
  const logistics = brand ? parseLogistics(form, productsOf(brand.id).filter((p) => productIds.includes(p.id)), errors) : {};
  if (brief.length < 20) errors.brief = "forms.errors.briefTooShort";
  const videoStyle = text(form, "videoStyle") as VideoStyle;
  // Unboxing needs a box: only for physical products.
  const physical = brand ? productsOf(brand.id).some((p) => productIds.includes(p.id) && p.details.type === "physical") : false;
  if (!VIDEO_STYLES.includes(videoStyle) || (videoStyle === "unboxing" && !physical)) errors.videoStyle = "forms.errors.pickVideoStyle";
  // Optional; when given, it must be a date after today.
  const deadline = text(form, "deadline");
  if (deadline && !isIsoDate(deadline)) errors.deadline = "forms.errors.dateInvalid";
  else if (deadline && deadline <= DEMO_TODAY) errors.deadline = "forms.errors.deadlineFuture";
  // More details (all optional): references must be links.
  const references = form.getAll("reference").map((r) => String(r).trim());
  references.forEach((r, i) => {
    if (r && !isUrl(r)) errors[`reference-${i}`] = "forms.errors.urlInvalid";
  });
  const details = {
    keyMessage: text(form, "keyMessage").slice(0, 200) || undefined,
    references: references.filter(Boolean).slice(0, 5),
    mustInclude: text(form, "mustInclude").slice(0, 500) || undefined,
    avoid: text(form, "avoid").slice(0, 500) || undefined,
  };
  checkCard(form, byCard, errors);
  // The reference links share a name; send them back one per field so they all refill.
  const values = () => ({ ...submitted(form), ...Object.fromEntries(references.map((r, i) => [`reference-${i}`, r])) });
  if (Object.keys(errors).length > 0) return { errors, values: values() };

  const notes = Object.fromEntries(lines.map((l) => [l.creator.id, text(form, `note-${l.creator.id}`)]));
  const result = store.checkoutCart({ brandId: brand!.id, title: same(title), promote, productIds, logistics, brief: same(brief), videoStyle, deadline: deadline || undefined, details, notes, useBalance });
  if (!result) return { errors: { title: "forms.errors.cartEmpty" }, values: values() };
  // No revalidatePath here: refreshing would re-render checkout with an empty cart and redirect away
  // mid-animation. The success screen moves on with a full page load, which brings everything up to date.
  return { errors: {}, values: {}, paid: { campaignId: result.campaign.id, creators: lines.map((l) => ({ id: l.creator.id, name: l.creator.name })) } };
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

/* ---------- Campaign page ---------- */

export async function markOrderSent(orderId: string, form: FormData) {
  store.markSent(orderId, text(form, "note").slice(0, 200) || undefined);
  revalidatePath("/", "layout");
}

export async function markOrderReturned(orderId: string) {
  store.markReturned(orderId);
  revalidatePath("/", "layout");
}

export async function cancelCampaign(campaignId: string) {
  store.cancelCampaign(campaignId);
  revalidatePath("/", "layout");
}

export async function rateOrder(orderId: string, rating: number) {
  store.rateOrder(orderId, rating);
  revalidatePath("/", "layout");
}

/* ---------- Invite creators to an existing campaign ---------- */

/**
 * Invites the picked creators (each "creatorId|format") to this campaign, paid up front.
 * Same result shape as checkout, so the same success screen follows.
 */
export async function inviteToCampaign(campaignId: string, _prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const picks = form
    .getAll("pick")
    .map(String)
    .map((v) => v.split("|"))
    .filter((p): p is [string, string] => p.length === 2)
    .map(([creatorId, format]) => ({ creatorId, format: format as ContentFormat }));
  const total = store.priceCart(picks.map((p) => ({ creatorId: p.creatorId, items: [{ format: p.format, quantity: 1 }] })).filter((l) => getCreator(l.creatorId))).total;
  const useBalance = form.get("useBalance") === "on";
  if (picks.length === 0) errors.pick = "forms.errors.pickCreators";
  checkCard(form, total - (useBalance ? Math.min(account.balance, total) : 0), errors);
  if (Object.keys(errors).length > 0) return { errors, values: submitted(form) };
  const result = store.inviteToCampaign(campaignId, picks, useBalance);
  if (!result) return { errors: { pick: "forms.errors.pickCreators" }, values: submitted(form) };
  // No revalidatePath: the success screen moves on with a full page load, like checkout.
  return { errors: {}, values: {}, paid: { campaignId, creators: result.lines.map((l) => ({ id: l.creator.id, name: l.creator.name })) } };
}

/** Copies the campaign's brief into checkout, then lets the brand pick creators. */
export async function duplicateCampaign(campaignId: string) {
  store.duplicateCampaign(campaignId);
  redirect("/explore?done=duplicated");
}
