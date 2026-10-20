import { cache } from "react";
import { api, ApiError } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { serviceFee, withFee } from "@/lib/fees";
import { problemReasonFromApi } from "@/lib/reportReasons";
import { requireBrandAccount } from "@/lib/session";
import { isActiveOrder } from "@/lib/statuses";
import { dayOf } from "@/lib/today";
import { myBrands, myProducts } from "./brandsApi";
import { exploreCreators } from "./creatorsApi";
import { publicUrl } from "./storage";
import type {
  Brand, Campaign, CampaignEvent, Clip, ContentFormat, Creator, DeclineReason, DetailChange, Localized, Niche, Order, OrderEvent, OrderEventType,
  OrderItem, Product, ProductLogistics,
} from "./types";
import { platformOf } from "./types";

/*
 * The signed-in brand owner's account from the API, in the dashboard's shapes (types.ts): brands and
 * products, campaigns, orders, balance and cart, loaded once per request (`workspace()`). Pages and
 * server components read from it; the actions in app/actions/brand.ts change it through the API.
 */

type CampaignRow = components["schemas"]["Campaign"];
type SecretsRow = components["schemas"]["CampaignSecrets"];
type OrderRow = components["schemas"]["Order"];
type CartRow = components["schemas"]["CartLine"];

/** One creator in the cart, for one video (one order is one video). */
export type CartLine = { creatorId: string; items: Array<{ format: ContentFormat; quantity: number }> };

export type Workspace = {
  brands: Brand[];
  products: Product[];
  /** Newest first. */
  campaigns: Campaign[];
  /** Newest first. */
  orders: Order[];
  balance: number;
  cart: CartLine[];
  /** Creators brands may book now (Explore), most completed orders first. */
  bookable: Creator[];
  brand(id: string | undefined): Brand | undefined;
  product(id: string | undefined): Product | undefined;
  productsOf(brandId: string): Product[];
  campaign(id: string | undefined): Campaign | undefined;
  order(id: string | undefined): Order | undefined;
  /** Bookable creators, and everyone the account has an order with. */
  creator(id: string | undefined): Creator | undefined;
  isBookable(id: string): boolean;
};

const PAGE = 100;

/** Every row of a list endpoint, a page at a time. */
async function everything<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await api<T[]>(`${path}${path.includes("?") ? "&" : "?"}limit=${PAGE}&offset=${offset}`);
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const same = (text: string | null | undefined): Localized => ({ ar: text ?? "", en: text ?? "" });
const names = (ar: string | null | undefined, en: string | null | undefined): Localized => ({ ar: ar || en || "", en: en || ar || "" });

/**
 * The cart and balance are brand accounts' only. The layout sends admins and creators elsewhere, but the
 * page renders alongside it: send them the same way here instead of failing on the 403.
 */
function brandOnly<T>(request: Promise<T>): Promise<T> {
  return request.catch(async (e: unknown) => {
    if (e instanceof ApiError && e.status === 403) await requireBrandAccount();
    throw e;
  });
}

/* Each part loads once per request, and all of them at the same time: pages that need less load less. */
const balanceNow = cache(async () => (await brandOnly(api<{ balance: number }>("/me/balance"))).balance);
const cartNow = cache(async (): Promise<CartLine[]> =>
  (await brandOnly(api<CartRow[]>("/me/cart"))).map((r) => ({ creatorId: r.creator_id, items: [{ format: r.format, quantity: 1 }] })),
);
const bookableCreators = cache(exploreCreators);

/** The account's data for this request. */
export const workspace = cache(async (): Promise<Workspace> => {
  const [brands, products, campaignRows, orderRows, balance, cart, bookable] = await Promise.all([
    myBrands(),
    myProducts(),
    everything<CampaignRow>("/campaigns"),
    everything<OrderRow>("/orders"),
    balanceNow(),
    cartNow(),
    bookableCreators(),
  ]);
  // Admins can open the dashboard too: only the account's own brands' work shows here.
  const own = new Set(brands.map((b) => b.id));

  const creators = new Map(bookable.map((c) => [c.id, c]));
  for (const row of orderRows) if (row.creator && !creators.has(row.creator_id)) creators.set(row.creator_id, creatorOf(row.creator));
  const orders = orderRows.filter((r) => own.has(r.brand_id)).map(toOrder);
  const campaigns = campaignRows.filter((r) => own.has(r.brand_id)).map((r) => toCampaign(r, { products, orders, creators }));
  const bookableIds = new Set(bookable.map((c) => c.id));

  return {
    brands,
    products,
    campaigns,
    orders,
    balance,
    cart,
    bookable,
    brand: (id) => brands.find((b) => b.id === id),
    product: (id) => products.find((p) => p.id === id),
    productsOf: (brandId) => products.filter((p) => p.brandId === brandId),
    campaign: (id) => campaigns.find((c) => c.id === id),
    order: (id) => orders.find((o) => o.id === id),
    creator: (id) => (id ? creators.get(id) : undefined),
    isBookable: (id) => bookableIds.has(id),
  };
});

export type Shopping = Pick<Workspace, "brands" | "balance" | "cart" | "bookable" | "productsOf" | "creator" | "isBookable">;

/** What the cart and checkout need: the brands and their products, the balance, the cart and who can be booked. No campaigns or orders. */
export const shopping = cache(async (): Promise<Shopping> => {
  const [brands, products, balance, cart, bookable] = await Promise.all([myBrands(), myProducts(), balanceNow(), cartNow(), bookableCreators()]);
  // Only bookable creators can be priced (priceLines), so the ones known from orders aren't needed here.
  const creators = new Map(bookable.map((c) => [c.id, c]));
  return {
    brands,
    balance,
    cart,
    bookable,
    productsOf: (brandId) => products.filter((p) => p.brandId === brandId),
    creator: (id) => (id ? creators.get(id) : undefined),
    isBookable: (id) => creators.has(id),
  };
});

/** A creator known only from an order (no longer on Explore): who they are, without their prices. */
function creatorOf(c: NonNullable<OrderRow["creator"]>): Creator {
  return {
    id: c.id,
    name: names(c.name_ar, c.name_en),
    handle: c.handle,
    city: same(""),
    gender: c.gender ?? "female",
    niches: [],
    formats: [],
    completedOrders: 0,
    bio: same(""),
    hasNewClips: false,
    photo: publicUrl(c.photo_path),
    country: "BH",
  };
}

/* ---------- Orders ---------- */

const DECLINE_REASON: Record<NonNullable<OrderRow["decline_reason"]>, DeclineReason> = {
  busy: "busy",
  not_my_niche: "notMyNiche",
  other: "other",
  expired: "expired",
};

/** The steps the dashboard's timelines show. Approval also releases the payment. */
const EVENT: Partial<Record<OrderRow["events"][number]["type"], OrderEventType>> = {
  offered: "offered",
  accepted: "accepted",
  declined: "declined",
  expired: "expired",
  cancelled: "cancelled",
  sent: "sent",
  received: "received",
  uploaded: "uploaded",
  revision_requested: "revisionRequested",
  approved: "approved",
  returned: "returned",
};

function toOrder(row: OrderRow): Order {
  const events = row.events.flatMap((e): OrderEvent[] => {
    const type = EVENT[e.type];
    if (!type) return [];
    return type === "approved" ? [{ type, at: e.at }, { type: "released", at: e.at }] : [{ type, at: e.at }];
  });
  const shipping =
    row.sent_at || row.received_at || row.returned_at
      ? { sentAt: row.sent_at ?? undefined, note: row.ship_note ?? undefined, receivedAt: row.received_at ?? undefined, returnedAt: row.returned_at ?? undefined }
      : undefined;
  const ship = row.ship_to;
  // Admins see both sides' reports; the dashboard shows the brand's latest.
  const problem = row.reports.filter((r) => r.reporter === "brand").at(-1);
  return {
    id: row.id,
    number: row.number,
    brandId: row.brand_id,
    source: "campaign",
    campaignId: row.campaign_id,
    creatorId: row.creator_id,
    title: same(row.campaign.title),
    note: row.note ?? undefined,
    items: [{ format: row.format, quantity: 1, price: row.amount }],
    clips: 1,
    amount: row.amount,
    fee: row.fee ?? undefined,
    status: row.status,
    revisionRequested: !!row.revision_requested_at,
    revisionNote: row.revision_note ?? undefined,
    declineReason: row.decline_reason ? DECLINE_REASON[row.decline_reason] : undefined,
    declineNote: row.decline_note ?? undefined,
    createdAt: row.created_at,
    // The latest version is the clip; every version can be watched (links last an hour).
    clipId: row.clips.at(-1)?.id,
    versions: row.clips.filter((c) => c.url).map((c) => ({ videoSrc: c.url!, uploadedAt: c.uploaded_at, durationSec: c.duration_sec ?? undefined })),
    adCode: row.ad_code ? { platform: platformOf[row.format], code: row.ad_code, expiresAt: row.ad_code_expires_at?.slice(0, 10) } : undefined,
    shipping,
    shipTo: ship
      ? { type: ship.type, label: ship.label ?? undefined, address: ship.address, latitude: ship.latitude ?? undefined, longitude: ship.longitude ?? undefined, phone: ship.phone ?? undefined }
      : undefined,
    deadline: row.deadline ?? undefined,
    clipPublic: row.clip_public,
    views: row.views ?? undefined,
    events,
    rating: row.rating ?? undefined,
    review: row.review ?? undefined,
    problem: problem && {
      id: problem.id,
      reason: problemReasonFromApi(problem.reason),
      details: problem.details ?? undefined,
      at: problem.created_at,
      status: problem.status,
      resolution: problem.resolution ?? undefined,
      resolvedAt: problem.resolved_at ?? undefined,
    },
  };
}

/** Tones for a clip's stand-in poster, steady per clip. */
function posterHues(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { from: h, to: (h + 40) % 360 };
}

/** The order's latest clip, ready for posters and players. Undefined before the first upload. */
export function clipOf(order: Order, ws: Pick<Workspace, "brand" | "creator">): Clip | undefined {
  const latest = order.versions?.at(-1);
  if (!latest || !order.clipId) return undefined;
  const niche: Niche = ws.creator(order.creatorId)?.niches[0] ?? "general";
  return {
    id: order.clipId,
    creatorId: order.creatorId,
    brand: ws.brand(order.brandId)?.name ?? same(""),
    title: order.title,
    durationSec: latest.durationSec ?? 0,
    views: order.views ?? 0,
    poster: { ...posterHues(order.clipId), niche },
    videoSrc: latest.videoSrc,
  };
}

/* ---------- Campaigns ---------- */

/** A draft's saved form, as New campaign keeps it in the API's `draft` column. */
type DraftForm = NonNullable<Campaign["draft"]>;

/** How the product reaches creators: by product type, from the campaign's logistics and (apps) its secrets. */
export function logisticsOf(product: Product | undefined, row: Pick<CampaignRow, "logistics">, secrets?: SecretsRow | null): Record<string, ProductLogistics> | undefined {
  if (!product) return undefined;
  const l = row.logistics;
  switch (product.details.type) {
    case "physical":
      return { [product.id]: { type: "physical", after: l.after === "return" ? "return" : "keep" } };
    case "app":
      return { [product.id]: { type: "app", link: secrets?.access_link ?? undefined, testAccount: secrets?.login_details ?? undefined, promoCode: secrets?.code ?? undefined } };
    case "venue":
      return { [product.id]: { type: "venue", visitFrom: l.visitFrom, visitTo: l.visitTo, included: l.included } };
    default:
      return undefined;
  }
}

/** "references" changes are lists in the API; the dashboard shows them one per line. */
const asText = (v: unknown) => (Array.isArray(v) ? v.join("\n") : typeof v === "string" ? v : undefined) || undefined;

function toEvent(e: Record<string, unknown>): CampaignEvent[] {
  if (e.type === "deadline_moved") return [{ type: "deadlineMoved", at: String(e.at), deadline: String(e.to), from: e.from ? String(e.from) : undefined }];
  if (e.type === "details_edited") {
    const changes = ((e.changes as Array<Record<string, unknown>>) ?? []).map((c) => ({ field: c.field as DetailChange["field"], before: asText(c.before), after: asText(c.after) }));
    return [{ type: "detailsEdited", at: String(e.at), changes }];
  }
  return [];
}

/** What creators are paid in total for these picks (their current prices), and how many. */
function pricePicks(picks: DraftForm["picks"], creators: Map<string, Creator>) {
  const prices = picks.flatMap((p) => creators.get(p.creatorId)?.formats.find((f) => f.format === p.format)?.price ?? []);
  return { count: prices.length, total: prices.reduce((s, p) => s + p, 0) };
}

function toCampaign(row: CampaignRow, { products, orders, creators }: { products: Product[]; orders: Order[]; creators: Map<string, Creator> }): Campaign {
  const draft = (row.draft as DraftForm | null) ?? undefined;
  const isDraft = row.status === "draft";
  const its = orders.filter((o) => o.campaignId === row.id && isActiveOrder(o));
  const picked = isDraft ? pricePicks(draft?.picks ?? [], creators) : undefined;
  const productId = row.product_id ?? draft?.values.productId;
  const product = products.find((p) => p.id === productId);
  // A draft keeps what was typed in its form until it's paid.
  const title = row.title ?? draft?.values.title ?? "";
  const brief = row.brief ?? draft?.values.brief ?? "";
  const firstCreator = isDraft ? draft?.picks[0]?.creatorId : orders.find((o) => o.campaignId === row.id)?.creatorId;
  return {
    id: row.id,
    brandId: row.brand_id,
    title: same(title),
    brief: same(brief),
    niche: creators.get(firstCreator ?? "")?.niches[0] ?? "general",
    clipsCount: picked ? picked.count : its.length,
    budget: picked ? picked.total : its.reduce((s, o) => s + o.amount, 0),
    promote: "products",
    productIds: productId ? [productId] : [],
    logistics: logisticsOf(product, row),
    videoStyle: row.video_style ?? undefined,
    deadline: row.deadline ?? undefined,
    keyMessage: row.key_message ?? undefined,
    references: row.reference_links,
    mustInclude: row.must_include ?? undefined,
    avoid: row.avoid ?? undefined,
    createdAt: dayOf(row.launched_at ?? row.created_at),
    status: row.status === "live" ? "in_progress" : row.status,
    deliveredClips: its.filter((o) => o.status === "delivered" || o.status === "approved").length,
    draft,
    events: (row.events as Array<Record<string, unknown>>).flatMap(toEvent),
  };
}

/** A campaign's app link, test account and promo code (the owner reads them on the campaign's page). */
export async function campaignSecrets(id: string): Promise<SecretsRow | null> {
  const row = await api<components["schemas"]["CampaignWithSecrets"]>(`/campaigns/${id}`);
  return row.secrets;
}

/* ---------- Prices ---------- */

export type PricedLine = { creator: Creator; items: OrderItem[]; clips: number; subtotal: number };

/**
 * Prices creators at their current prices, one video each in the format picked. Creators who can't
 * be booked now (suspended, or no longer offering that format) drop out before anything is charged.
 */
export function priceLines(ws: Pick<Workspace, "creator" | "isBookable">, picks: Array<{ creatorId: string; format: ContentFormat }>) {
  const lines: PricedLine[] = picks.flatMap((p) => {
    const creator = ws.creator(p.creatorId);
    const offer = creator?.formats.find((f) => f.format === p.format);
    if (!creator || !offer || !ws.isBookable(p.creatorId)) return [];
    return [{ creator, items: [{ format: p.format, quantity: 1, price: offer.price }], clips: 1, subtotal: offer.price }];
  });
  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  return { lines, total, fee: serviceFee(total), toPay: withFee(total) };
}

/** The cart, priced. */
export const priceCart = (ws: Pick<Workspace, "cart" | "creator" | "isBookable">) => priceLines(ws, ws.cart.map((l) => ({ creatorId: l.creatorId, format: l.items[0].format })));

/** Campaigns with a card payment still waiting, and that payment's id: their offers go out once it's paid. */
export const pendingPayments = cache(async (): Promise<Map<string, string>> => {
  const rows = await api<components["schemas"]["Payment"][]>("/me/payments?status=pending");
  return new Map(rows.flatMap((p) => (p.campaign_id ? [[p.campaign_id, p.id] as const] : [])));
});

/** Card parts are paid online on Gate-E's page; false: laqta sends a payment link and confirms it by hand. */
export const cardOnline = cache(async (): Promise<boolean> => (await api<components["schemas"]["Settings"]>("/settings")).card_online === true);
