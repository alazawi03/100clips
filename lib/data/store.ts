import { account, DEMO_TODAY } from "./account";
import { campaigns, getCampaign } from "./campaigns";
import { getCreator, isBookable } from "./creators";
import { getOrder, orders } from "./orders";
import { eventsOf, isOfferExpired, offerExpiresAt } from "@/lib/orderFlow";
import { brandPaid, serviceFee, withFee } from "@/lib/fees";
import type { Campaign, ContentFormat, ProductLogistics, Localized, Order, OrderEventType, OrderItem, VideoStyle, DetailChange } from "./types";

/*
 * In-memory stand-in for the backend. Mutations live as long as the dev server process,
 * so actions show up everywhere (home, lists, counts) until it restarts.
 * Swap these functions for API calls when the backend exists.
 */

// Follows the highest demo order number, so new orders never reuse one.
let orderSeq = Math.max(...orders.filter((o) => o.id.startsWith("ord-1")).map((o) => Number(o.id.slice(4)))) + 1;

/**
 * Freezes an order's derived history into real events. Call before changing the order, so the
 * change isn't derived again on top of the event logged for it.
 */
function keepHistory(order: Order) {
  order.events ??= eventsOf(order);
}

/** Adds to an order's activity history. */
function log(order: Order, type: OrderEventType) {
  keepHistory(order);
  order.events!.push({ type, at: new Date().toISOString() });
}
function nextOrderId() {
  return `ord-${orderSeq++}`;
}

/** In BHD, fee included: what the account paid for orders still running (not approved, declined or cancelled). */
export function heldAmount(): number {
  return orders.filter((o) => o.status === "pending" || o.status === "in_progress" || o.status === "delivered").reduce((sum, o) => sum + brandPaid(o), 0);
}

export function brandOrders(brandId: string): Order[] {
  return orders.filter((o) => o.brandId === brandId);
}

export function brandCampaigns(brandId: string): Campaign[] {
  return campaigns.filter((c) => c.brandId === brandId);
}

/* ---------- Cart: creators the account wants to hire together. The brand is chosen at checkout. ---------- */

export type CartLine = { creatorId: string; items: Array<{ format: ContentFormat; quantity: number }> };
let cart: CartLine[] = [];

/** Swaps the whole cart (the debug account switch), returning what it held. */
export function replaceCart(next: CartLine[]): CartLine[] {
  const prev = cart;
  cart = next;
  checkoutDefault = undefined;
  return prev;
}

export function cartOf(): CartLine[] {
  return cart;
}

/**
 * What checkout starts with: the brand and product ("Find creators for this product"), plus the whole
 * form when running a campaign again (field name → value, like a submitted form).
 */
export type CheckoutDefault = { brandId: string; productId?: string; values?: Record<string, string> };
let checkoutDefault: CheckoutDefault | undefined;

export function getCheckoutDefault() {
  return checkoutDefault;
}

export function setCheckoutDefault(value: typeof checkoutDefault) {
  checkoutDefault = value;
}

/** Replaces this creator's line with one video of one format (one order = one video). Nothing chosen removes the creator. */
export function setCartLine(creatorId: string, items: CartLine["items"]) {
  const creator = getCreator(creatorId);
  if (!creator || !isBookable(creatorId)) return;
  const offered = new Set(creator.formats.map((f) => f.format));
  const pick = items.find((i) => offered.has(i.format) && Number.isInteger(i.quantity) && i.quantity > 0);
  const clean = pick ? [{ format: pick.format, quantity: 1 }] : [];
  const rest = cart.filter((l) => l.creatorId !== creatorId);
  cart = clean.length > 0 ? [...rest, { creatorId, items: clean }] : rest;
}

/** Prices each line from the creator's current price list. */
export function priceCart(lines: CartLine[]) {
  // A creator suspended since they were picked drops out before anything is charged.
  const priced = lines.filter((line) => isBookable(line.creatorId)).map((line) => {
    const creator = getCreator(line.creatorId)!;
    const items: OrderItem[] = line.items.map((i) => ({ ...i, price: creator.formats.find((f) => f.format === i.format)!.price }));
    return { creator, items, clips: items.reduce((n, i) => n + i.quantity, 0), subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0) };
  });
  const total = priced.reduce((sum, l) => sum + l.subtotal, 0);
  return { lines: priced, total, fee: serviceFee(total), toPay: withFee(total) };
}

/** Pay for the cart: one campaign, one order per creator, each waiting for that creator to accept. */
export function checkoutCart(input: {
  brandId: string;
  title: Localized;
  promote: "brand" | "products";
  productIds: string[];
  logistics: Record<string, ProductLogistics>;
  brief: Localized;
  videoStyle: VideoStyle;
  deadline?: string;
  details: Pick<Campaign, "keyMessage" | "references" | "mustInclude" | "avoid">;
  notes: Record<string, string>;
  useBalance: boolean;
  /** From "New campaign": the creators picked on the page instead of the cart, and the draft it was opened from. */
  picks?: Array<{ creatorId: string; format: ContentFormat }>;
  draftId?: string;
}): { campaign: Campaign; fromBalance: number; byCard: number; lines: PricedLine[] } | undefined {
  const { lines, total } = input.picks ? pricePicks(input.picks) : priceCart(cartOf());
  if (lines.length === 0) return undefined;
  const campaign: Campaign = {
    id: `cmp-${campaigns.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
    brandId: input.brandId,
    title: input.title,
    brief: input.brief,
    niche: lines[0].creator.niches[0],
    clipsCount: lines.reduce((n, l) => n + l.clips, 0),
    budget: total,
    promote: input.promote,
    productIds: input.productIds,
    logistics: input.logistics,
    videoStyle: input.videoStyle,
    deadline: input.deadline,
    ...input.details,
    createdAt: DEMO_TODAY,
    status: "in_progress",
    deliveredClips: 0,
  };
  // Paying a draft replaces it.
  if (input.draftId) {
    const i = campaigns.findIndex((c) => c.id === input.draftId && c.status === "draft");
    if (i >= 0) campaigns.splice(i, 1);
  }
  campaigns.unshift(campaign);
  sendOffers(campaign, lines, input.notes);
  if (!input.picks) {
    cart = [];
    checkoutDefault = undefined;
  }
  return { campaign, lines, ...charge(total, input.useBalance) };
}

/** Prices picked creators, each for one video in a format they offer. */
export function pricePicks(picks: Array<{ creatorId: string; format: ContentFormat }>) {
  return priceCart(picks.filter((p) => getCreator(p.creatorId)?.formats.some((o) => o.format === p.format)).map((p) => ({ creatorId: p.creatorId, items: [{ format: p.format, quantity: 1 }] })));
}

/**
 * "Save as draft" on New campaign: keeps the form and the chosen creators as they are, nothing checked
 * and nothing sent. Updates the draft it was opened from, or starts a new one. Returns its id.
 */
export function saveCampaignDraft(input: { draftId?: string; brandId: string; title: string; brief: string; values: Record<string, string>; picks: Array<{ creatorId: string; format: ContentFormat }> }): string {
  const existing = input.draftId ? campaigns.find((c) => c.id === input.draftId && c.status === "draft") : undefined;
  const { lines, total } = pricePicks(input.picks);
  const draft = { values: input.values, picks: input.picks, savedAt: new Date().toISOString() };
  const fields = {
    brandId: input.brandId,
    title: { ar: input.title, en: input.title },
    brief: { ar: input.brief, en: input.brief },
    niche: lines[0]?.creator.niches[0] ?? existing?.niche ?? "general",
    clipsCount: lines.length,
    budget: total,
    draft,
  };
  if (existing) {
    Object.assign(existing, fields);
    return existing.id;
  }
  const campaign: Campaign = { id: `draft-${Math.random().toString(36).slice(2, 8)}`, ...fields, createdAt: DEMO_TODAY, status: "draft", deliveredClips: 0 };
  campaigns.unshift(campaign);
  return campaign.id;
}

/** Throws a draft away. */
export function deleteCampaignDraft(id: string) {
  const i = campaigns.findIndex((c) => c.id === id && c.status === "draft");
  if (i >= 0) campaigns.splice(i, 1);
}

type PricedLine = ReturnType<typeof priceCart>["lines"][number];

/** One pending order per line in this campaign, each waiting for its creator to accept. */
function sendOffers(campaign: Campaign, lines: PricedLine[], notes: Record<string, string> = {}) {
  for (const line of lines) {
    orders.unshift({
      id: nextOrderId(),
      brandId: campaign.brandId,
      source: "campaign",
      campaignId: campaign.id,
      creatorId: line.creator.id,
      title: campaign.title,
      note: notes[line.creator.id] || undefined,
      items: line.items,
      clips: line.clips,
      amount: line.subtotal,
      fee: serviceFee(line.subtotal),
      status: "pending",
      createdAt: DEMO_TODAY,
      events: [{ type: "offered", at: new Date().toISOString() }],
    });
  }
}

/** Paid up front, creators' prices plus the service fee: the balance first (if chosen), the rest by card. */
function charge(creatorsTotal: number, useBalance: boolean) {
  const total = withFee(creatorsTotal);
  const fromBalance = useBalance ? Math.min(account.balance, total) : 0;
  account.balance -= fromBalance;
  return { fromBalance, byCard: total - fromBalance };
}

/**
 * "Invite to campaign": creators join an existing campaign with its brief, each for one video in the
 * format chosen for them, paid up front. Returns what was sent, or undefined if nothing valid was picked.
 */
export function inviteToCampaign(campaignId: string, picks: Array<{ creatorId: string; format: ContentFormat }>, useBalance: boolean) {
  const campaign = getCampaign(campaignId);
  if (!campaign) return undefined;
  const { lines, total } = priceCart(
    picks.filter((p) => getCreator(p.creatorId)?.formats.some((o) => o.format === p.format)).map((p) => ({ creatorId: p.creatorId, items: [{ format: p.format, quantity: 1 }] })),
  );
  if (lines.length === 0) return undefined;
  sendOffers(campaign, lines);
  campaign.budget += total;
  campaign.clipsCount += lines.length;
  if (campaign.status === "completed") campaign.status = "in_progress";
  return { campaign, lines, ...charge(total, useBalance) };
}

/**
 * "Run again": a new campaign with the same product, logistics and video style, the brief and extra
 * details as given (the old ones by default), and one offer per pick, paid up front. Not through the cart.
 * Visit dates of a venue have passed, so they're dropped.
 */
export function runCampaignAgain(
  campaignId: string,
  picks: Array<{ creatorId: string; format: ContentFormat }>,
  input: { title: Localized; brief: Localized; deadline?: string; details: Pick<Campaign, "keyMessage" | "references" | "mustInclude" | "avoid"> },
  useBalance: boolean,
) {
  const source = getCampaign(campaignId);
  if (!source) return undefined;
  const { lines, total } = priceCart(
    picks.filter((p) => getCreator(p.creatorId)?.formats.some((o) => o.format === p.format)).map((p) => ({ creatorId: p.creatorId, items: [{ format: p.format, quantity: 1 }] })),
  );
  if (lines.length === 0) return undefined;
  const logistics = Object.fromEntries(
    Object.entries(source.logistics ?? {}).map(([id, l]) => [id, l.type === "venue" ? { type: "venue" as const, included: l.included } : l]),
  );
  const campaign: Campaign = {
    id: `cmp-${campaigns.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
    brandId: source.brandId,
    title: input.title,
    brief: input.brief,
    niche: source.niche,
    clipsCount: lines.length,
    budget: total,
    promote: source.promote,
    productIds: source.productIds,
    logistics,
    videoStyle: source.videoStyle,
    deadline: input.deadline,
    ...input.details,
    createdAt: DEMO_TODAY,
    status: "in_progress",
    deliveredClips: 0,
  };
  campaigns.unshift(campaign);
  sendOffers(campaign, lines);
  return { campaign, lines, ...charge(total, useBalance) };
}

/** Approving releases the payment; a rating and comment can come with it. */
export function approveOrder(orderId: string, rating?: number, review?: string) {
  const order = getOrder(orderId);
  if (!order || order.status !== "delivered") return;
  keepHistory(order);
  order.status = "approved";
  order.revisionRequested = false;
  if (rating && Number.isInteger(rating) && rating >= 1 && rating <= 5) order.rating = rating;
  if (review) order.review = review;
  log(order, "approved");
  log(order, "released");
}

export function requestRevision(orderId: string, note: string) {
  const order = getOrder(orderId);
  if (!order || order.status !== "delivered") return;
  keepHistory(order);
  order.status = "in_progress";
  order.revisionRequested = true;
  order.revisionNote = note;
  log(order, "revisionRequested");
}

/* ---------- Shipping, campaign management, ratings ---------- */

/** The brand sent the product (no tracking number needed; an optional note says how). */
export function markSent(orderId: string, note?: string) {
  const order = getOrder(orderId);
  if (!order || order.status !== "in_progress" || order.shipping?.sentAt) return;
  keepHistory(order);
  order.shipping = { ...order.shipping, sentAt: new Date().toISOString(), note };
  log(order, "sent");
}

/** The brand collected the product back after an approved order where the creator returns it. */
export function markReturned(orderId: string) {
  const order = getOrder(orderId);
  if (!order || order.status !== "approved" || order.shipping?.returnedAt) return;
  keepHistory(order);
  order.shipping = { ...order.shipping, returnedAt: new Date().toISOString() };
  log(order, "returned");
}

/** No creator has accepted yet: every offer is still waiting, or was declined or withdrawn. */
export function nobodyAccepted(campaignId: string): boolean {
  return orders.filter((o) => o.campaignId === campaignId).every((o) => o.status === "pending" || o.status === "cancelled" || o.status === "declined");
}

/** Every order in the campaign was withdrawn, declined or ran out: the campaign is over. */
function closeIfEmpty(campaignId: string | undefined) {
  const campaign = campaignId ? getCampaign(campaignId) : undefined;
  const its = orders.filter((o) => o.campaignId === campaignId);
  if (campaign && its.length > 0 && its.every((o) => o.status === "cancelled" || o.status === "declined")) campaign.status = "cancelled";
}

/**
 * "Withdraw offer": takes back one offer the creator hasn't answered yet. The full amount, service fee
 * included, goes back to the balance (no work was done). Returns false once the creator has answered.
 */
export function withdrawOffer(orderId: string): boolean {
  const order = getOrder(orderId);
  if (!order || order.status !== "pending") return false;
  keepHistory(order);
  order.status = "cancelled";
  account.balance += brandPaid(order);
  log(order, "cancelled");
  closeIfEmpty(order.campaignId);
  return true;
}

/**
 * Offers nobody answered within OFFER_HOURS run out: declined as "expired", money back to the balance.
 * A backend runs this on a schedule; here it runs whenever a page loads.
 */
export function expireOffers(now: string) {
  for (const order of orders) {
    if (!isOfferExpired(order, now)) continue;
    keepHistory(order);
    order.status = "declined";
    order.declineReason = "expired";
    account.balance += brandPaid(order);
    order.events!.push({ type: "expired", at: new Date(offerExpiresAt(order)).toISOString() });
    closeIfEmpty(order.campaignId);
  }
}

/**
 * Changes the extra details (key message, references, must include, avoid) while nobody has accepted,
 * so no creator is held to something they didn't agree to. Logged, so the brief shows it was edited.
 */
export function editCampaignDetails(campaignId: string, details: Pick<Campaign, "keyMessage" | "references" | "mustInclude" | "avoid">): boolean {
  const campaign = getCampaign(campaignId);
  if (!campaign || campaign.status === "cancelled" || !nobodyAccepted(campaignId)) return false;
  // What actually changed, for the activity log. Saving without changes logs nothing.
  const fields = ["keyMessage", "references", "mustInclude", "avoid"] as const;
  const text = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join("\n") : v) || undefined;
  const changes: DetailChange[] = fields
    .map((field) => ({ field, before: text(campaign[field]), after: text(details[field]) }))
    .filter((c) => c.before !== c.after);
  Object.assign(campaign, details);
  if (changes.length > 0) (campaign.events ??= []).push({ type: "detailsEdited", at: new Date().toISOString(), changes });
  return true;
}

/** Moves the deadline later (never earlier: creators agreed to the old one). Only campaigns that have one. */
export function extendDeadline(campaignId: string, deadline: string): boolean {
  const campaign = getCampaign(campaignId);
  if (!campaign?.deadline || campaign.status === "cancelled" || deadline <= campaign.deadline || deadline <= DEMO_TODAY) return false;
  const from = campaign.deadline;
  campaign.deadline = deadline;
  (campaign.events ??= []).push({ type: "deadlineMoved", at: new Date().toISOString(), deadline, from });
  return true;
}

/** The creators who worked on a campaign (not the ones who declined or were withdrawn), each with the format they made. */
export function campaignCreators(campaignId: string): Array<{ creatorId: string; format: ContentFormat }> {
  return orders
    .filter((o) => o.campaignId === campaignId && o.status !== "declined" && o.status !== "cancelled")
    .map((o) => ({ creatorId: o.creatorId, format: o.items[0].format }))
    .filter((p, i, all) => all.findIndex((q) => q.creatorId === p.creatorId) === i);
}

export function rateOrder(orderId: string, rating: number) {
  const order = getOrder(orderId);
  if (!order || order.status !== "approved" || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
  order.rating = rating;
}

/** What one clip pays in a campaign, in BHD. */
export function campaignRate(campaign: Campaign): number {
  return Math.round((campaign.budget / campaign.clipsCount) * 1000) / 1000;
}


/* ---------- Notifications ---------- */

/** When the brand last pressed "Mark all as read" (ISO). Older activity counts as read. */
let notificationsSeenAt = "2026-09-26";

export function getNotificationsSeenAt() {
  return notificationsSeenAt;
}

export function markNotificationsRead() {
  notificationsSeenAt = new Date().toISOString();
}
