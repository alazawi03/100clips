"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { myBrands } from "@/lib/data/brandsApi";
import { setCheckoutStart } from "@/lib/data/checkoutStart";
import * as lists from "@/lib/data/lists";
import { priceLines, workspace, type PricedLine, type Workspace } from "@/lib/data/live";
import { VIDEO_STYLES, type Campaign, type ContentFormat, type Localized, type Product, type VideoStyle } from "@/lib/data/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { today } from "@/lib/today";

/**
 * errors: field name → translation key of the problem, shown next to each field.
 * values: what was submitted, so the form can show it again (React clears forms after an action).
 */
export type FormState = { errors: Partial<Record<string, MessageKey>>; values: Record<string, string> } | null;

type CampaignRow = components["schemas"]["Campaign"];
type Payment = components["schemas"]["Payment"];

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

/** Logged for whoever runs the dashboard; people see a message in their language. */
function logFailure(what: string, error: unknown) {
  console.error(`${what} failed:`, error instanceof ApiError ? `${error.status} ${error.message}` : error);
}

/* ---------- Lists ---------- */

/** Creates a named list, with the creator in it when saving from a profile. */
export async function createCreatorList(name: string, creatorId?: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  await lists.createList(clean, creatorId);
  revalidatePath("/", "layout");
}

export async function setCreatorInList(listId: string, creatorId: string, on: boolean) {
  await lists.setInList(listId, creatorId, on);
  revalidatePath("/", "layout");
}

/* ---------- Cart ---------- */

/** Hire this creator for one video in the format picked (one order is one video); nothing picked takes them out. */
export async function updateCart(creatorId: string, items: Array<{ format: ContentFormat; quantity: number }>) {
  const pick = items.find((i) => Number.isInteger(i.quantity) && i.quantity > 0);
  try {
    if (pick) await api(`/me/cart/${creatorId}`, { method: "PUT", body: { format: pick.format } });
    else await api(`/me/cart/${creatorId}`, { method: "DELETE" });
  } catch (e) {
    // A creator who can't be booked any more simply doesn't go in.
    logFailure("Updating the cart", e);
  }
  revalidatePath("/", "layout");
}

/** "Find creators for this product": remember the product, then browse creators; checkout starts with it selected. */
export async function hireForProduct(brandId: string, productId: string) {
  await setCheckoutStart({ brandId, productId });
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

/** How the product reaches creators, as the API keeps it: logistics (physical, venue) and secrets (apps). */
type Delivery = { logistics: Record<string, string>; secrets: { access_link: string | null; login_details: string | null; code: string | null } | null };

/** Reads "log-<productId>-<field>" for the campaign's product, by its type. Services need nothing here. */
function parseDelivery(form: FormData, product: Product | undefined, errors: NonNullable<FormState>["errors"]): Delivery {
  const none: Delivery = { logistics: {}, secrets: null };
  if (!product) return none;
  const field = (key: string) => `log-${product.id}-${key}`;
  const get = (key: string) => text(form, field(key));
  switch (product.details.type) {
    case "physical":
      return { logistics: { after: get("after") === "return" ? "return" : "keep" }, secrets: null };
    case "app": {
      const link = get("link");
      if (link && !isUrl(link)) errors[field("link")] = "forms.errors.urlInvalid";
      return { logistics: {}, secrets: { access_link: link || null, login_details: get("account").slice(0, 500) || null, code: get("promo").slice(0, 100) || null } };
    }
    case "venue": {
      // Visit dates are optional; when both are given, "until" can't be before "from".
      const visitFrom = get("from");
      const visitTo = get("to");
      if (visitFrom && !isIsoDate(visitFrom)) errors[field("from")] = "forms.errors.dateInvalid";
      if (visitTo && !isIsoDate(visitTo)) errors[field("to")] = "forms.errors.dateInvalid";
      else if (isIsoDate(visitFrom) && visitTo && visitTo < visitFrom) errors[field("to")] = "forms.errors.visitOrder";
      const included = get("included").slice(0, 300);
      return { logistics: { ...(visitFrom && { visitFrom }), ...(visitTo && { visitTo }), ...(included && { included }) }, secrets: null };
    }
    default:
      return none;
  }
}

/** Checkout's result: field errors, or `paid` with what the success screen shows before moving on. */
export type CheckoutState =
  | (NonNullable<FormState> & {
      paid?: {
        campaignId: string;
        creators: Array<{ id: string; name: Localized }>;
        /** Part was paid by card and waits for the payment to be confirmed: the offers go out then. */
        pending?: boolean;
      };
    })
  | null;

/** Mock card form: checks the shape only, and only when something is left to pay by card. */
function checkCard(form: FormData, byCard: number, errors: NonNullable<FormState>["errors"]) {
  if (byCard <= 0) return;
  if (!text(form, "cardName")) errors.cardName = "forms.errors.cardName";
  if (!/^\d{16}$/.test(text(form, "cardNumber").replace(/\s/g, ""))) errors.cardNumber = "forms.errors.cardNumber";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(text(form, "cardExpiry"))) errors.cardExpiry = "forms.errors.cardExpiry";
  if (!/^\d{3,4}$/.test(text(form, "cardCvc"))) errors.cardCvc = "forms.errors.cardCvc";
}

/**
 * Tops up the balance by card. The payment waits for the card provider (an admin confirms it until
 * there is one); the balance grows then.
 */
export async function topUpBalance(_prev: FormState, form: FormData): Promise<FormState> {
  const values = Object.fromEntries(Object.entries(submitted(form)).filter(([k]) => !k.startsWith("card")));
  const raw = text(form, "amount").replace(/,/g, "");
  const amount = Number(raw);
  const errors: NonNullable<FormState>["errors"] = {};
  if (!/^\d+(\.\d{1,3})?$/.test(raw) || amount < 1 || amount > 10_000) errors.amount = "forms.errors.topUpAmount";
  checkCard(form, 1, errors);
  if (Object.keys(errors).length) return { errors, values };
  try {
    await api("/me/top-ups", { method: "POST", body: { amount } });
  } catch (e) {
    logFailure("Top-up", e);
    const suspended = e instanceof ApiError && /suspended/i.test(e.message);
    return { errors: { pay: suspended ? "forms.errors.brandSuspended" : "forms.errors.payFailed" }, values };
  }
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

/** What the brand pays now: creators' prices plus the fee; the balance first when chosen, the rest by card. */
function byCardFor(ws: Workspace, toPay: number, useBalance: boolean) {
  return toPay - (useBalance ? Math.min(Math.max(ws.balance, 0), toPay) : 0);
}

/** The API refused the payment: a message in the brand's language on the payment step (or the deadline). */
function payFailed(error: unknown, values: Record<string, string>): CheckoutState {
  logFailure("Payment", error);
  const message = error instanceof ApiError ? error.message : "";
  const [field, key]: [string, MessageKey] = /suspended/i.test(message)
    ? ["pay", "forms.errors.brandSuspended"]
    : /not available|doesn't offer/i.test(message)
      ? ["pay", "forms.errors.creatorUnavailable"]
      : /already has an offer/i.test(message)
        ? ["pay", "forms.errors.alreadyOffered"]
        : /deadline has passed/i.test(message)
          ? ["deadline", "forms.errors.deadlineFuture"]
          : ["pay", "forms.errors.payFailed"];
  return { errors: { [field]: key }, values };
}

/** Pays for offers on a campaign, one per line, each with the brand's note to that creator. */
async function pay(campaignId: string, lines: PricedLine[], notes: Record<string, string>, useBalance: boolean): Promise<Payment> {
  return api<Payment>(`/campaigns/${campaignId}/checkout`, {
    method: "POST",
    body: {
      picks: lines.map((l) => ({ creator_id: l.creator.id, format: l.items[0].format, ...(notes[l.creator.id] ? { note: notes[l.creator.id].slice(0, 500) } : {}) })),
      use_balance: useBalance,
    },
  });
}

const paidState = (campaignId: string, lines: PricedLine[], payment: Payment): CheckoutState => ({
  errors: {},
  values: {},
  paid: { campaignId, creators: lines.map((l) => ({ id: l.creator.id, name: l.creator.name })), pending: payment.status === "pending" },
});

export async function checkout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const ws = await workspace();
  // "New campaign" (mode=new) picks creators on the page instead of the cart, and can be saved as a draft.
  const fromPicker = form.get("mode") === "new";
  const picks = fromPicker ? parsePicks(form) : ws.cart.map((l) => ({ creatorId: l.creatorId, format: l.items[0].format }));
  const draftId = text(form, "draftId") || undefined;
  const errors: NonNullable<FormState>["errors"] = {};
  const brand = ws.brand(text(form, "brandId"));
  // What the brand pays: creators' prices plus the service fee.
  const { lines, toPay } = priceLines(ws, picks);
  if (fromPicker && lines.length === 0) errors.pick = "forms.errors.pickCreators";
  const title = text(form, "title").slice(0, 120);
  const brief = text(form, "brief").slice(0, 2000);
  const productId = text(form, "productId");
  const product = brand ? ws.productsOf(brand.id).find((p) => p.id === productId) : undefined;
  const useBalance = form.get("useBalance") === "on";

  if (!fromPicker && lines.length === 0) errors.title = "forms.errors.cartEmpty";
  if (!title) errors.title = "forms.errors.titleRequired";
  if (!brand) errors.brandId = "forms.errors.pickBrand";
  // One product per campaign.
  else if (!product) errors.productId = "forms.errors.pickProduct";
  const delivery = parseDelivery(form, product, errors);
  if (brief.length < 20) errors.brief = "forms.errors.briefTooShort";
  const videoStyle = text(form, "videoStyle") as VideoStyle;
  // Unboxing needs a box: only for physical products.
  if (!VIDEO_STYLES.includes(videoStyle) || (videoStyle === "unboxing" && product?.details.type !== "physical")) errors.videoStyle = "forms.errors.pickVideoStyle";
  // Optional; when given, it must be a date after today.
  const deadline = text(form, "deadline");
  if (deadline && !isIsoDate(deadline)) errors.deadline = "forms.errors.dateInvalid";
  else if (deadline && deadline <= today()) errors.deadline = "forms.errors.deadlineFuture";
  // Optional upload date: after the deadline when there is one, else after today. Checked here like the
  // form does, but not sent: the API has no field for it yet.
  const uploadDate = text(form, "uploadDate");
  const validDeadline = isIsoDate(deadline) ? deadline : "";
  if (uploadDate && !isIsoDate(uploadDate)) errors.uploadDate = "forms.errors.dateInvalid";
  else if (uploadDate && validDeadline && uploadDate <= validDeadline) errors.uploadDate = "forms.errors.uploadAfterDeadline";
  else if (uploadDate && !validDeadline && uploadDate <= today()) errors.uploadDate = "forms.errors.deadlineFuture";
  // More details (all optional): references must be links.
  const { details, values } = parseDetails(form, errors);
  checkCard(form, byCardFor(ws, toPay, useBalance), errors);
  if (Object.keys(errors).length > 0) return { errors, values };

  const notes = Object.fromEntries(lines.map((l) => [l.creator.id, text(form, `note-${l.creator.id}`)]));
  // A campaign made here (not the draft being filled in) goes again if paying fails.
  let made: string | undefined;
  try {
    // The draft being filled in becomes the campaign (a new one when it was for another brand).
    const draft = fromPicker && draftId ? ws.campaign(draftId) : undefined;
    const fields = {
      product_id: product!.id,
      title,
      brief,
      video_style: videoStyle,
      deadline: deadline || null,
      key_message: details.keyMessage ?? null,
      reference_links: details.references,
      must_include: details.mustInclude ?? null,
      avoid: details.avoid ?? null,
      logistics: delivery.logistics,
    };
    let campaignId: string;
    if (draft?.status === "draft" && draft.brandId === brand!.id) {
      campaignId = draft.id;
      await api(`/campaigns/${campaignId}`, { method: "PATCH", body: fields });
    } else {
      if (draft?.status === "draft") await api(`/campaigns/${draft.id}`, { method: "DELETE" });
      campaignId = (await api<CampaignRow>(`/brands/${brand!.id}/campaigns`, { method: "POST", body: { ...fields, deadline: fields.deadline ?? undefined } })).id;
      if (!fromPicker) made = campaignId;
    }
    await api(`/campaigns/${campaignId}/secrets`, { method: "PUT", body: delivery.secrets ?? {} });
    const payment = await pay(campaignId, lines, notes, useBalance);
    if (!fromPicker) await setCheckoutStart(undefined);
    // No revalidatePath here: refreshing would re-render checkout with an empty cart and redirect away
    // mid-animation. The success screen moves on with a full page load, which brings everything up to date.
    return paidState(campaignId, lines, payment);
  } catch (e) {
    if (made) await api(`/campaigns/${made}`, { method: "DELETE" }).catch(() => undefined);
    return payFailed(e, values);
  }
}

export async function approveOrder(orderId: string, form: FormData) {
  const rating = Number(text(form, "rating"));
  const comment = text(form, "review").slice(0, 500);
  await api(`/orders/${orderId}/approve`, {
    method: "POST",
    body: { ...(Number.isInteger(rating) && rating >= 1 && rating <= 5 ? { rating, ...(comment ? { comment } : {}) } : {}) },
  });
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?done=approved`);
}

export async function requestRevision(orderId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const note = text(form, "note").slice(0, 1000);
  if (note.length < 10) return { errors: { note: "forms.errors.revisionNote" }, values: submitted(form) };
  try {
    await api(`/orders/${orderId}/revision`, { method: "POST", body: { note } });
  } catch (e) {
    logFailure("Asking for a revision", e);
    return { errors: { note: "forms.errors.saveFailed" }, values: submitted(form) };
  }
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?done=revisionSent`);
}

/* ---------- Campaign page ---------- */

export async function markOrderSent(orderId: string, form: FormData) {
  const note = text(form, "note").slice(0, 200);
  await api(`/orders/${orderId}/sent`, { method: "POST", body: note ? { note } : {} });
  revalidatePath("/", "layout");
}

export async function markOrderReturned(orderId: string) {
  await api(`/orders/${orderId}/returned`, { method: "POST" });
  revalidatePath("/", "layout");
}

/** "Withdraw offer" on one order the creator hasn't answered yet; the money goes back to the balance. */
export async function withdrawOffer(orderId: string) {
  try {
    await api(`/orders/${orderId}/withdraw`, { method: "POST" });
  } catch (e) {
    // The creator answered meanwhile: the page shows what happened.
    logFailure("Withdrawing an offer", e);
  }
  revalidatePath("/", "layout");
}

/** The most reference links a campaign takes. */
const MAX_REFERENCES = 3;

/** The optional extra details, as checkout and "Edit details" send them. References must be links. */
function parseDetails(form: FormData, errors: NonNullable<FormState>["errors"]) {
  const references = form.getAll("reference").map((r) => String(r).trim());
  references.forEach((r, i) => {
    if (r && !isUrl(r)) errors[`reference-${i}`] = "forms.errors.urlInvalid";
  });
  const details: Pick<Campaign, "keyMessage" | "mustInclude" | "avoid"> & { references: string[] } = {
    keyMessage: text(form, "keyMessage").slice(0, 200) || undefined,
    references: references.filter(Boolean).slice(0, MAX_REFERENCES),
    mustInclude: text(form, "mustInclude").slice(0, 500) || undefined,
    avoid: text(form, "avoid").slice(0, 500) || undefined,
  };
  // The reference links share a name; send them back one per field so they all refill.
  const values = { ...submitted(form), ...Object.fromEntries(references.map((r, i) => [`reference-${i}`, r])) };
  return { details, values };
}

/** "Edit details": only while nobody has accepted (the API checks again). */
export async function editCampaignDetails(campaignId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const errors: NonNullable<FormState>["errors"] = {};
  const { details, values } = parseDetails(form, errors);
  if (Object.keys(errors).length > 0) return { errors, values };
  try {
    await api(`/campaigns/${campaignId}/details`, {
      method: "PUT",
      body: { key_message: details.keyMessage ?? null, reference_links: details.references, must_include: details.mustInclude ?? null, avoid: details.avoid ?? null },
    });
  } catch (e) {
    logFailure("Editing details", e);
    return { errors: { form: e instanceof ApiError && e.status === 409 ? "forms.errors.editLocked" : "forms.errors.saveFailed" }, values };
  }
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

/** "Extend deadline": a real date, later than the current deadline. */
export async function extendDeadline(campaignId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const deadline = text(form, "deadline");
  if (!isIsoDate(deadline)) return { errors: { deadline: "forms.errors.dateInvalid" }, values: submitted(form) };
  try {
    await api(`/campaigns/${campaignId}/deadline`, { method: "PUT", body: { deadline } });
  } catch (e) {
    logFailure("Extending the deadline", e);
    return { errors: { deadline: e instanceof ApiError && e.status === 400 ? "forms.errors.deadlineLater" : "forms.errors.saveFailed" }, values: submitted(form) };
  }
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

/**
 * "Run again": a new campaign from this one (the API copies the brief and secrets), paid up front,
 * without the cart. The picks are the creators ticked on the page; title, brief, deadline and extra
 * details start as before and can be changed. Visit dates of a venue have passed, so they're dropped.
 */
export async function payCampaignAgain(campaignId: string, _prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const ws = await workspace();
  const errors: NonNullable<FormState>["errors"] = {};
  const { lines, toPay } = priceLines(ws, parsePicks(form));
  const title = text(form, "title").slice(0, 120);
  const brief = text(form, "brief").slice(0, 2000);
  const deadline = text(form, "deadline");
  const useBalance = form.get("useBalance") === "on";
  if (lines.length === 0) errors.pick = "forms.errors.pickCreators";
  if (!title) errors.title = "forms.errors.titleRequired";
  if (brief.length < 20) errors.brief = "forms.errors.briefTooShort";
  if (deadline && !isIsoDate(deadline)) errors.deadline = "forms.errors.dateInvalid";
  else if (deadline && deadline <= today()) errors.deadline = "forms.errors.deadlineFuture";
  const { details, values } = parseDetails(form, errors);
  checkCard(form, byCardFor(ws, toPay, useBalance), errors);
  if (Object.keys(errors).length > 0) return { errors, values };

  let copyId: string | undefined;
  try {
    const copy = await api<CampaignRow>(`/campaigns/${campaignId}/copy`, { method: "POST" });
    copyId = copy.id;
    const logistics = { ...copy.logistics };
    delete logistics.visitFrom;
    delete logistics.visitTo;
    await api(`/campaigns/${copy.id}`, {
      method: "PATCH",
      body: {
        title,
        brief,
        deadline: deadline || null,
        key_message: details.keyMessage ?? null,
        reference_links: details.references,
        must_include: details.mustInclude ?? null,
        avoid: details.avoid ?? null,
        logistics,
      },
    });
    const payment = await pay(copy.id, lines, {}, useBalance);
    return paidState(copy.id, lines, payment);
  } catch (e) {
    // Nothing was paid: the copy goes rather than lingering as a draft.
    if (copyId) await api(`/campaigns/${copyId}`, { method: "DELETE" }).catch(() => undefined);
    return payFailed(e, values);
  }
}

/**
 * New campaign saves itself as a draft while it's filled in: the form as it is (never card details) and
 * the chosen creators, in the campaign's `draft`. Returns the draft's id, so the page keeps updating the
 * same one. A draft belongs to one brand: choosing another brand starts a new draft.
 */
export async function autosaveCampaignDraft(form: FormData): Promise<{ id: string }> {
  const values = Object.fromEntries(Object.entries(submitted(form)).filter(([k]) => !k.startsWith("card") && !["pick", "mode", "draftId", "reference"].includes(k)));
  values.references = form.getAll("reference").map(String).filter(Boolean).join("\n");
  const draft = { values, picks: parsePicks(form), savedAt: new Date().toISOString() };
  const draftId = text(form, "draftId");
  const brandId = text(form, "brandId") || (await myBrands())[0]?.id;
  if (!brandId) return { id: draftId };
  const existing = draftId ? await api<CampaignRow>(`/campaigns/${draftId}`).catch(() => undefined) : undefined;
  if (existing?.status === "draft" && existing.brand_id === brandId) {
    await api(`/campaigns/${existing.id}`, { method: "PATCH", body: { draft } });
    return { id: existing.id };
  }
  if (existing?.status === "draft") await api(`/campaigns/${existing.id}`, { method: "DELETE" }).catch(() => undefined);
  const made = await api<CampaignRow>(`/brands/${brandId}/campaigns`, { method: "POST", body: { draft } });
  return { id: made.id };
}

/** Throws a draft away, from its page or its card on Campaigns. */
export async function deleteCampaignDraft(id: string) {
  await api(`/campaigns/${id}`, { method: "DELETE" });
  revalidatePath("/", "layout");
  redirect("/campaigns?done=draftDeleted");
}

/** The bell's "Mark all as read". */
export async function markAllNotificationsRead() {
  await api("/me/notifications-seen", { method: "POST" });
  revalidatePath("/", "layout");
}

export async function rateOrder(orderId: string, rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
  try {
    await api(`/orders/${orderId}/rating`, { method: "POST", body: { rating } });
  } catch (e) {
    logFailure("Rating", e);
  }
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
  const ws = await workspace();
  const errors: NonNullable<FormState>["errors"] = {};
  const { lines, toPay } = priceLines(ws, parsePicks(form));
  const useBalance = form.get("useBalance") === "on";
  if (lines.length === 0) errors.pick = "forms.errors.pickCreators";
  checkCard(form, byCardFor(ws, toPay, useBalance), errors);
  if (Object.keys(errors).length > 0) return { errors, values: submitted(form) };
  try {
    const payment = await pay(campaignId, lines, {}, useBalance);
    // No revalidatePath: the success screen moves on with a full page load, like checkout.
    return paidState(campaignId, lines, payment);
  } catch (e) {
    return payFailed(e, submitted(form));
  }
}
