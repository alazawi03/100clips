"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { account, DEMO_TODAY, getBrand, productsOf } from "@/lib/data/account";
import * as lists from "@/lib/data/lists";
import { getCampaign } from "@/lib/data/campaigns";
import { getCreator } from "@/lib/data/creators";
import { isSuspended } from "@/lib/data/moderation";
import * as store from "@/lib/data/store";
import { switchToDemoData, switchToNewAccount } from "@/lib/data/accountSwitch";
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
  // "New campaign" (mode=new) picks creators on the page instead of the cart, and can be saved as a draft.
  const fromPicker = form.get("mode") === "new";
  const picks = fromPicker ? parsePicks(form) : undefined;
  const draftId = text(form, "draftId") || undefined;
  const errors: NonNullable<FormState>["errors"] = {};
  const brand = getBrand(text(form, "brandId"));
  // What the brand pays: creators' prices plus the service fee.
  const { lines, toPay } = picks ? store.pricePicks(picks) : store.priceCart(store.cartOf());
  if (fromPicker && lines.length === 0) errors.pick = "forms.errors.pickCreators";
  const title = text(form, "title");
  const brief = text(form, "brief");
  const promote = form.get("promote") === "brand" ? "brand" : "products";
  const productIds = promote === "products" ? form.getAll("productId").map(String) : [];
  const useBalance = form.get("useBalance") === "on";
  const byCard = toPay - (useBalance ? Math.min(account.balance, toPay) : 0);

  if (!fromPicker && lines.length === 0) errors.title = "forms.errors.cartEmpty";
  if (!title) errors.title = "forms.errors.titleRequired";
  if (!brand) errors.brandId = "forms.errors.pickBrand";
  // Suspended by 100clips: no new payments until it's lifted.
  else if (isSuspended("brand", brand.id)) errors.brandId = "forms.errors.brandSuspended";
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
  const { details, values } = parseDetails(form, errors);
  checkCard(form, byCard, errors);
  if (Object.keys(errors).length > 0) return { errors, values };

  const notes = Object.fromEntries(lines.map((l) => [l.creator.id, text(form, `note-${l.creator.id}`)]));
  const result = store.checkoutCart({ brandId: brand!.id, title: same(title), promote, productIds, logistics, brief: same(brief), videoStyle, deadline: deadline || undefined, details, notes, useBalance, picks, draftId });
  if (!result) return { errors: { title: "forms.errors.cartEmpty" }, values };
  // No revalidatePath here: refreshing would re-render checkout with an empty cart and redirect away
  // mid-animation. The success screen moves on with a full page load, which brings everything up to date.
  return { errors: {}, values: {}, paid: { campaignId: result.campaign.id, creators: lines.map((l) => ({ id: l.creator.id, name: l.creator.name })) } };
}

export async function approveOrder(orderId: string, form: FormData) {
  store.approveOrder(orderId, Number(text(form, "rating")) || undefined, text(form, "review").slice(0, 500) || undefined);
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

/** "Withdraw offer" on one order the creator hasn't answered yet; the money goes back to the balance. */
export async function withdrawOffer(orderId: string) {
  store.withdrawOffer(orderId);
  revalidatePath("/", "layout");
}

/** The optional extra details, as checkout and "Edit details" send them. References must be links. */
function parseDetails(form: FormData, errors: NonNullable<FormState>["errors"]) {
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
  // The reference links share a name; send them back one per field so they all refill.
  const values = { ...submitted(form), ...Object.fromEntries(references.map((r, i) => [`reference-${i}`, r])) };
  return { details, values };
}

/** "Edit details": only while nobody has accepted (the store checks again). */
export async function editCampaignDetails(campaignId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const { details, values } = parseDetails(form, errors);
  if (Object.keys(errors).length > 0) return { errors, values };
  if (!store.editCampaignDetails(campaignId, details)) return { errors: { form: "forms.errors.editLocked" }, values };
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

/** "Extend deadline": a real date, later than the current deadline. */
export async function extendDeadline(campaignId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const deadline = text(form, "deadline");
  const current = getCampaign(campaignId)?.deadline;
  if (!isIsoDate(deadline)) return { errors: { deadline: "forms.errors.dateInvalid" }, values: submitted(form) };
  if (!current || deadline <= current || deadline <= DEMO_TODAY) return { errors: { deadline: "forms.errors.deadlineLater" }, values: submitted(form) };
  store.extendDeadline(campaignId, deadline);
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

/**
 * "Run again": a new campaign from this one, paid up front, without the cart. The picks are the
 * creators ticked on the page (this campaign's or from a list); title, brief, deadline and extra
 * details start as before and can be changed.
 */
export async function payCampaignAgain(campaignId: string, _prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const picks = parsePicks(form);
  const title = text(form, "title");
  const brief = text(form, "brief");
  const deadline = text(form, "deadline");
  const { toPay } = store.priceCart(picks.map((p) => ({ creatorId: p.creatorId, items: [{ format: p.format, quantity: 1 }] })).filter((l) => getCreator(l.creatorId)));
  const useBalance = form.get("useBalance") === "on";
  if (picks.length === 0) errors.pick = "forms.errors.pickCreators";
  else if (isSuspended("brand", getCampaign(campaignId)?.brandId ?? "")) errors.pick = "forms.errors.brandSuspended";
  if (!title) errors.title = "forms.errors.titleRequired";
  if (brief.length < 20) errors.brief = "forms.errors.briefTooShort";
  if (deadline && !isIsoDate(deadline)) errors.deadline = "forms.errors.dateInvalid";
  else if (deadline && deadline <= DEMO_TODAY) errors.deadline = "forms.errors.deadlineFuture";
  const { details, values } = parseDetails(form, errors);
  checkCard(form, toPay - (useBalance ? Math.min(account.balance, toPay) : 0), errors);
  if (Object.keys(errors).length > 0) return { errors, values };
  const result = store.runCampaignAgain(campaignId, picks, { title: same(title), brief: same(brief), deadline: deadline || undefined, details }, useBalance);
  if (!result) return { errors: { pick: "forms.errors.pickCreators" }, values };
  // No revalidatePath: the success screen moves on with a full page load, like checkout.
  return { errors: {}, values: {}, paid: { campaignId: result.campaign.id, creators: result.lines.map((l) => ({ id: l.creator.id, name: l.creator.name })) } };
}

/** Debug: the dashboard's switch between the demo account and a brand-new, empty one. */
export async function switchDebugAccount(to: "new" | "demo") {
  if (process.env.NODE_ENV === "production") return;
  if (to === "new") switchToNewAccount();
  else switchToDemoData();
  revalidatePath("/", "layout");
}

/**
 * New campaign saves itself as a draft while it's filled in: the form as it is (never card details) and
 * the chosen creators. Returns the draft's id, so the page keeps updating the same one.
 */
export async function autosaveCampaignDraft(form: FormData): Promise<{ id: string }> {
  const values = Object.fromEntries(Object.entries(submitted(form)).filter(([k]) => !k.startsWith("card") && !["pick", "mode", "draftId", "reference"].includes(k)));
  values.references = form.getAll("reference").map(String).filter(Boolean).join("\n");
  const id = store.saveCampaignDraft({
    draftId: text(form, "draftId") || undefined,
    brandId: text(form, "brandId"),
    title: text(form, "title"),
    brief: text(form, "brief"),
    values,
    picks: parsePicks(form),
  });
  return { id };
}

/** Throws a draft away, from its page or its card on Campaigns. */
export async function deleteCampaignDraft(id: string) {
  store.deleteCampaignDraft(id);
  revalidatePath("/", "layout");
  redirect("/campaigns?done=draftDeleted");
}

/** The bell's "Mark all as read". */
export async function markAllNotificationsRead() {
  store.markNotificationsRead();
  revalidatePath("/", "layout");
}

export async function rateOrder(orderId: string, rating: number) {
  store.rateOrder(orderId, rating);
  revalidatePath("/", "layout");
}

/* ---------- Invite creators to an existing campaign ---------- */

/** The ticked creators, each "creatorId|format". One platform per creator: the first one sent counts. */
function parsePicks(form: FormData) {
  return form
    .getAll("pick")
    .map(String)
    .map((v) => v.split("|"))
    .filter((p): p is [string, string] => p.length === 2)
    .map(([creatorId, format]) => ({ creatorId, format: format as ContentFormat }))
    .filter((p, i, all) => all.findIndex((q) => q.creatorId === p.creatorId) === i);
}

/**
 * Invites the picked creators (each "creatorId|format") to this campaign, paid up front.
 * Same result shape as checkout, so the same success screen follows.
 */
export async function inviteToCampaign(campaignId: string, _prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const picks = parsePicks(form);
  const { toPay } = store.priceCart(picks.map((p) => ({ creatorId: p.creatorId, items: [{ format: p.format, quantity: 1 }] })).filter((l) => getCreator(l.creatorId)));
  const useBalance = form.get("useBalance") === "on";
  if (picks.length === 0) errors.pick = "forms.errors.pickCreators";
  else if (isSuspended("brand", getCampaign(campaignId)?.brandId ?? "")) errors.pick = "forms.errors.brandSuspended";
  checkCard(form, toPay - (useBalance ? Math.min(account.balance, toPay) : 0), errors);
  if (Object.keys(errors).length > 0) return { errors, values: submitted(form) };
  const result = store.inviteToCampaign(campaignId, picks, useBalance);
  if (!result) return { errors: { pick: "forms.errors.pickCreators" }, values: submitted(form) };
  // No revalidatePath: the success screen moves on with a full page load, like checkout.
  return { errors: {}, values: {}, paid: { campaignId, creators: result.lines.map((l) => ({ id: l.creator.id, name: l.creator.name })) } };
}

