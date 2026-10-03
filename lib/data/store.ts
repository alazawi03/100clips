import { account, DEMO_TODAY } from "./account";
import { campaigns, getCampaign } from "./campaigns";
import { getCreator } from "./creators";
import { getOrder, orders } from "./orders";
import type { Campaign, ContentFormat, Localized, Niche, Order, OrderItem } from "./types";

/*
 * In-memory stand-in for the backend. Mutations live as long as the dev server process,
 * so actions show up everywhere (home, lists, counts) until it restarts.
 * Swap these functions for API calls when the backend exists.
 */

let orderSeq = 1043;
function nextOrderId() {
  return `ord-${orderSeq++}`;
}

/** Accepted campaign applicants are paid from the balance first; anything beyond it is assumed paid by card. */
function reserve(amount: number) {
  account.balance = Math.max(0, account.balance - amount);
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

/* ---------- Cart: creators the brand wants to hire together, kept per brand ---------- */

export type CartLine = { creatorId: string; items: Array<{ format: ContentFormat; quantity: number }> };
const carts: Record<string, CartLine[]> = {};

export function cartOf(brandId: string): CartLine[] {
  return carts[brandId] ?? [];
}

/** Replaces this creator's line. Zero quantities are dropped; an empty line removes the creator. */
export function setCartLine(brandId: string, creatorId: string, items: CartLine["items"]) {
  const creator = getCreator(creatorId);
  if (!creator) return;
  const offered = new Set(creator.formats.map((f) => f.format));
  const clean = items.filter((i) => offered.has(i.format) && Number.isInteger(i.quantity) && i.quantity > 0).map((i) => ({ ...i, quantity: Math.min(10, i.quantity) }));
  const rest = cartOf(brandId).filter((l) => l.creatorId !== creatorId);
  carts[brandId] = clean.length > 0 ? [...rest, { creatorId, items: clean }] : rest;
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
  productId?: string;
  brief: Localized;
  notes: Record<string, string>;
  useBalance: boolean;
}): { campaign: Campaign; fromBalance: number; byCard: number } | undefined {
  const { lines, total } = priceCart(cartOf(input.brandId));
  if (lines.length === 0) return undefined;
  const campaign: Campaign = {
    id: `cmp-${campaigns.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
    brandId: input.brandId,
    title: input.title,
    brief: input.brief,
    niche: lines[0].creator.niches[0],
    clipsCount: lines.reduce((n, l) => n + l.clips, 0),
    budget: total,
    productId: input.productId,
    status: "in_progress",
    applications: [],
    deliveredClips: 0,
  };
  campaigns.unshift(campaign);
  for (const line of lines) {
    orders.unshift({
      id: nextOrderId(),
      brandId: input.brandId,
      source: "campaign",
      campaignId: campaign.id,
      creatorId: line.creator.id,
      title: input.title,
      note: input.notes[line.creator.id] || undefined,
      items: line.items,
      clips: line.clips,
      amount: line.subtotal,
      status: "pending",
      createdAt: DEMO_TODAY,
    });
  }
  const fromBalance = input.useBalance ? Math.min(account.balance, total) : 0;
  account.balance -= fromBalance;
  carts[input.brandId] = [];
  return { campaign, fromBalance, byCard: total - fromBalance };
}

export function createCampaign(input: {
  brandId: string;
  title: Localized;
  brief: Localized;
  niche: Niche;
  clipsCount: number;
  budget: number;
  publish: boolean;
}): Campaign {
  const campaign: Campaign = {
    id: `cmp-${campaigns.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
    brandId: input.brandId,
    title: input.title,
    brief: input.brief,
    niche: input.niche,
    clipsCount: input.clipsCount,
    budget: input.budget,
    status: input.publish ? "open" : "draft",
    applications: [],
    deliveredClips: 0,
  };
  campaigns.unshift(campaign);
  return campaign;
}

export function publishCampaign(campaignId: string) {
  const campaign = getCampaign(campaignId);
  if (campaign?.status === "draft") campaign.status = "open";
}

/** Accepting turns the application into a one-clip order at the campaign's per-clip rate. */
export function decideApplication(campaignId: string, creatorId: string, decision: "accepted" | "rejected") {
  const campaign = getCampaign(campaignId);
  const application = campaign?.applications.find((a) => a.creatorId === creatorId);
  if (!campaign || !application || application.status !== "pending") return;
  application.status = decision;
  if (decision === "rejected") return;

  const order: Order = {
    id: nextOrderId(),
    brandId: campaign.brandId,
    source: "campaign",
    campaignId: campaign.id,
    creatorId,
    title: campaign.title,
    items: [{ format: getCreator(creatorId)!.formats[0].format, quantity: 1, price: campaignRate(campaign) }],
    clips: 1,
    amount: campaignRate(campaign),
    status: "in_progress",
    createdAt: DEMO_TODAY,
  };
  orders.unshift(order);
  reserve(order.amount);
  if (campaign.status === "open") campaign.status = "in_progress";
}

export function approveOrder(orderId: string) {
  const order = getOrder(orderId);
  if (!order || order.status !== "delivered") return;
  order.status = "approved";
  order.revisionRequested = false;
}

export function requestRevision(orderId: string, note: string) {
  const order = getOrder(orderId);
  if (!order || order.status !== "delivered") return;
  order.status = "in_progress";
  order.revisionRequested = true;
  order.revisionNote = note;
}

/** What one clip pays in a campaign, in BHD. */
export function campaignRate(campaign: Campaign): number {
  return Math.round((campaign.budget / campaign.clipsCount) * 1000) / 1000;
}
