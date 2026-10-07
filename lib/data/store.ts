import { account, DEMO_TODAY } from "./account";
import { campaigns, getCampaign } from "./campaigns";
import { getCreator } from "./creators";
import { getOrder, orders } from "./orders";
import { eventsOf } from "@/lib/orderFlow";
import type { Campaign, ContentFormat, ProductLogistics, Localized, Order, OrderEventType, OrderItem, VideoStyle } from "./types";

/*
 * In-memory stand-in for the backend. Mutations live as long as the dev server process,
 * so actions show up everywhere (home, lists, counts) until it restarts.
 * Swap these functions for API calls when the backend exists.
 */

let orderSeq = 1043;

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

/** In BHD: every order the account hasn't approved yet, across all brands. */
export function heldAmount(): number {
  return orders.filter((o) => o.status !== "approved").reduce((sum, o) => sum + o.amount, 0);
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

export function cartOf(): CartLine[] {
  return cart;
}

/** What checkout starts with: the brand and product, set by "Find creators for this product". */
export type CheckoutDefault = { brandId: string; productId: string };
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
  if (!creator) return;
  const offered = new Set(creator.formats.map((f) => f.format));
  const pick = items.find((i) => offered.has(i.format) && Number.isInteger(i.quantity) && i.quantity > 0);
  const clean = pick ? [{ format: pick.format, quantity: 1 }] : [];
  const rest = cart.filter((l) => l.creatorId !== creatorId);
  cart = clean.length > 0 ? [...rest, { creatorId, items: clean }] : rest;
}

/** Prices each line from the creator's current price list. */
export function priceCart(lines: CartLine[]) {
  const priced = lines.map((line) => {
    const creator = getCreator(line.creatorId)!;
    const items: OrderItem[] = line.items.map((i) => ({ ...i, price: creator.formats.find((f) => f.format === i.format)!.price }));
    return { creator, items, clips: items.reduce((n, i) => n + i.quantity, 0), subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0) };
  });
  return { lines: priced, total: priced.reduce((sum, l) => sum + l.subtotal, 0) };
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
}): { campaign: Campaign; fromBalance: number; byCard: number } | undefined {
  const { lines, total } = priceCart(cartOf());
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
  campaigns.unshift(campaign);
  sendOffers(campaign, lines, input.notes);
  cart = [];
  checkoutDefault = undefined;
  return { campaign, ...charge(total, input.useBalance) };
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
      status: "pending",
      createdAt: DEMO_TODAY,
      events: [{ type: "offered", at: new Date().toISOString() }],
    });
  }
}

/** Paid up front: the balance first (if chosen), the rest by card. */
function charge(total: number, useBalance: boolean) {
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

/**
 * Cancels a campaign whose offers nobody has accepted yet: every order is withdrawn and its money
 * goes back to the balance. Returns false (and changes nothing) once any creator has accepted.
 */
export function cancelCampaign(campaignId: string): boolean {
  const campaign = getCampaign(campaignId);
  const its = orders.filter((o) => o.campaignId === campaignId);
  if (!campaign || its.some((o) => o.status !== "pending" && o.status !== "cancelled")) return false;
  for (const order of its) {
    if (order.status !== "pending") continue;
    keepHistory(order);
    order.status = "cancelled";
    account.balance += order.amount;
    log(order, "cancelled");
  }
  campaign.status = "cancelled";
  return true;
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

