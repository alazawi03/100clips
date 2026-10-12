import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { orders as accountOrders } from "@/lib/data/orders";
import { getCampaign } from "@/lib/data/campaigns";
import type { Brand, ContentFormat, FormatOffer, Gender, Localized, Niche, Order, OrderStatus } from "@/lib/data/types";
import { serviceFee } from "@/lib/fees";
import { eventsOf } from "@/lib/orderFlow";

/*
 * What only 100clips sees: every account on the platform, creators' bank accounts, and the
 * transfers sent to creators. In-memory like lib/data/store.ts, so it resets when the dev server
 * restarts. The demo brand account (lib/data) is one of the accounts; the others live here.
 */

/** Brands from other accounts, so the admin sees more than the one demo account. */
export const otherBrands: Brand[] = [
  { id: "lulu-sweets", name: { ar: "حلويات لولو", en: "Lulu Sweets" }, industry: "food_beverage", countries: ["bh"], registrations: { bh: { crNumber: "88412-2" } } },
  { id: "glow-clinic", name: { ar: "عيادة جلو", en: "Glow Clinic" }, industry: "health", countries: ["bh", "sa"], registrations: { bh: { crNumber: "71250-1" } } },
  { id: "fithub", name: { ar: "نادي فت هب", en: "FitHub Gym" }, industry: "health", countries: ["bh"] },
  { id: "techzone", name: { ar: "تك زون", en: "TechZone" }, industry: "tech", countries: ["bh", "ae"] },
];

const titles: Record<string, Localized> = {
  "lulu-sweets": { ar: "حلويات العيد من لولو", en: "Eid sweets from Lulu" },
  "glow-clinic": { ar: "جلسة تنظيف البشرة", en: "Facial session at Glow" },
  fithub: { ar: "أسبوع تجربة في فت هب", en: "A trial week at FitHub" },
  techzone: { ar: "سماعات تك زون الجديدة", en: "TechZone's new earbuds" },
};

/** One order at the creator's own price for that format, with the 10% fee the brand paid on top. */
function o(id: string, brandId: string, creatorId: string, format: ContentFormat, status: OrderStatus, createdAt: string, extra: Partial<Order> = {}): Order {
  const price = getCreator(creatorId)?.formats.find((f) => f.format === format)?.price ?? 40;
  return { id, brandId, source: "offer", creatorId, title: titles[brandId], items: [{ format, quantity: 1, price }], clips: 1, amount: price, fee: serviceFee(price), status, createdAt, ...extra };
}

export const otherOrders: Order[] = [
  // June to August: finished work, already paid out.
  o("ord-3001", "lulu-sweets", "latifa-alshamsi", "tiktok_video", "approved", "2026-06-03"),
  o("ord-3002", "lulu-sweets", "reem-alhashimi", "instagram_reel", "approved", "2026-06-10"),
  o("ord-3003", "glow-clinic", "fatima-aldosari", "instagram_reel", "approved", "2026-06-14"),
  o("ord-3004", "glow-clinic", "noura-alkaabi", "instagram_reel", "approved", "2026-06-21"),
  o("ord-3005", "techzone", "khalid-almutairi", "tiktok_video", "approved", "2026-07-01"),
  o("ord-3006", "techzone", "ahmed-bujeiri", "tiktok_video", "approved", "2026-07-05"),
  o("ord-3007", "fithub", "yousef-alhammadi", "tiktok_video", "approved", "2026-07-08"),
  o("ord-3008", "fithub", "fahad-alqahtani", "instagram_reel", "declined", "2026-07-12"),
  o("ord-3009", "lulu-sweets", "sultan-alotaibi", "tiktok_video", "approved", "2026-07-18"),
  o("ord-3010", "glow-clinic", "maryam-alkuwari", "instagram_reel", "approved", "2026-07-25"),
  o("ord-3011", "techzone", "khalid-almutairi", "instagram_reel", "approved", "2026-08-02"),
  o("ord-3012", "fithub", "yousef-alhammadi", "instagram_reel", "approved", "2026-08-06"),
  o("ord-3013", "lulu-sweets", "hessa-alajmi", "instagram_story", "approved", "2026-08-11"),
  o("ord-3014", "glow-clinic", "fatima-aldosari", "tiktok_video", "approved", "2026-08-15"),
  o("ord-3015", "techzone", "fahad-alqahtani", "tiktok_video", "cancelled", "2026-08-19"),
  o("ord-3016", "lulu-sweets", "latifa-alshamsi", "instagram_reel", "approved", "2026-08-22"),
  // September: approved recently, waiting for a transfer.
  o("ord-3017", "glow-clinic", "noura-alkaabi", "tiktok_video", "approved", "2026-09-02"),
  o("ord-3018", "fithub", "fahad-alqahtani", "tiktok_video", "approved", "2026-09-05"),
  o("ord-3019", "techzone", "ahmed-bujeiri", "tiktok_video", "approved", "2026-09-09"),
  o("ord-3020", "lulu-sweets", "reem-alhashimi", "instagram_reel", "approved", "2026-09-12"),
  o("ord-3021", "glow-clinic", "maryam-alkuwari", "instagram_story", "approved", "2026-09-16"),
  o("ord-3022", "fithub", "yousef-alhammadi", "tiktok_video", "approved", "2026-09-20"),
  // Still running.
  o("ord-3023", "lulu-sweets", "sultan-alotaibi", "instagram_reel", "delivered", "2026-09-22", { events: [{ type: "offered", at: "2026-09-22" }, { type: "accepted", at: "2026-09-23" }, { type: "uploaded", at: "2026-09-27" }] }),
  o("ord-3024", "techzone", "khalid-almutairi", "tiktok_video", "in_progress", "2026-09-24", {
    shipping: { sentAt: "2026-09-25" },
    events: [{ type: "offered", at: "2026-09-24" }, { type: "accepted", at: "2026-09-24" }, { type: "sent", at: "2026-09-25" }],
  }),
  o("ord-3025", "glow-clinic", "fatima-aldosari", "instagram_reel", "in_progress", "2026-09-26"),
  o("ord-3026", "fithub", "fahad-alqahtani", "instagram_reel", "pending", "2026-09-27"),
  o("ord-3027", "techzone", "ahmed-bujeiri", "tiktok_video", "pending", "2026-10-02"),
  o("ord-3028", "lulu-sweets", "latifa-alshamsi", "tiktok_video", "delivered", "2026-09-28", { events: [{ type: "offered", at: "2026-09-28" }, { type: "accepted", at: "2026-09-28" }, { type: "uploaded", at: "2026-10-02" }] }),
  o("ord-3029", "glow-clinic", "noura-alkaabi", "instagram_reel", "declined", "2026-09-29"),
];

/** Every order on the platform: the demo account's (live, as brands act) and the other accounts'. */
export function platformOrders(): Order[] {
  return [...accountOrders, ...otherOrders];
}

/* ---------- Creators' bank accounts, with every change kept ---------- */

export type BankAccount = { iban: string; accountName: string; bank: string };
/** One version of a creator's bank details: who set it and when. The last one is current. */
export type BankChange = BankAccount & { at: string; by: "creator" | "admin" };

/**
 * Made-up IBANs for the demo. Ahmed hasn't added a bank account yet. Reem changed hers two days ago,
 * the case the transfer list warns about (a changed IBAN right before a payout is a common fraud).
 */
export const bankHistory: Record<string, BankChange[]> = {
  "noura-alkaabi": [{ iban: "BH67BMAG00001299123456", accountName: "Noura Al Kaabi", bank: "BBK", at: "2026-05-20T10:00:00Z", by: "creator" }],
  "sultan-alotaibi": [{ iban: "BH29NBOB00000099887766", accountName: "Sultan Al Otaibi", bank: "NBB", at: "2026-05-22T10:00:00Z", by: "creator" }],
  "reem-alhashimi": [
    { iban: "BH71NBOB00000012003400", accountName: "Reem Al Hashimi", bank: "NBB", at: "2026-05-25T10:00:00Z", by: "creator" },
    { iban: "BH02CITI00001077181611", accountName: "Reem Al Hashimi", bank: "Citi", at: "2026-10-01T18:40:00Z", by: "creator" },
  ],
  "khalid-almutairi": [{ iban: "BH86KFHB00000012345678", accountName: "Khalid Al Mutairi", bank: "KFH", at: "2026-06-01T10:00:00Z", by: "creator" }],
  "maryam-alkuwari": [{ iban: "BH51BMAG00001288776655", accountName: "Maryam Al Kuwari", bank: "BBK", at: "2026-06-02T10:00:00Z", by: "creator" }],
  "abdullah-albalushi": [{ iban: "BH44NBOB00000055443322", accountName: "Abdullah Al Balushi", bank: "NBB", at: "2026-06-03T10:00:00Z", by: "creator" }],
  "fatima-aldosari": [{ iban: "BH17ABCO00000011223344", accountName: "Fatima Al Dosari", bank: "Bank ABC", at: "2026-06-05T10:00:00Z", by: "creator" }],
  "yousef-alhammadi": [{ iban: "BH73BMAG00001233445566", accountName: "Yousef Al Hammadi", bank: "BBK", at: "2026-06-06T10:00:00Z", by: "creator" }],
  "hessa-alajmi": [{ iban: "BH38NBOB00000077665544", accountName: "Hessa Al Ajmi", bank: "NBB", at: "2026-06-08T10:00:00Z", by: "creator" }],
  "latifa-alshamsi": [{ iban: "BH95KFHB00000098765432", accountName: "Latifa Al Shamsi", bank: "KFH", at: "2026-06-09T10:00:00Z", by: "creator" }],
  "fahad-alqahtani": [
    { iban: "BH60ABCO00000066554433", accountName: "Fahad Al Qahtani", bank: "Bank ABC", at: "2026-06-10T10:00:00Z", by: "creator" },
    { iban: "BH60ABCO00000066554433", accountName: "Fahad Abdullah Al Qahtani", bank: "Bank ABC", at: "2026-08-14T09:15:00Z", by: "admin" },
  ],
};

/** The creator's current bank details, if any. */
export function currentBank(creatorId: string): BankChange | undefined {
  return bankHistory[creatorId]?.at(-1);
}

/** A bank change this recent gets a warning before money is sent to it. */
export const BANK_CHANGE_WARN_DAYS = 14;

/* ---------- Brand accounts ---------- */

/** Who logs in for each brand from the other demo accounts. The demo account's brands belong to lib/data/account. */
export const brandOwners: Record<string, { name: Localized; email: string; phone: string }> = {
  "lulu-sweets": { name: { ar: "لولوة السعد", en: "Lulwa Al Saad" }, email: "lulwa@example.com", phone: "+973 3311 2200" },
  "glow-clinic": { name: { ar: "د. هالة منصور", en: "Dr. Hala Mansoor" }, email: "hala@example.com", phone: "+973 3622 4100" },
  fithub: { name: { ar: "علي حسن", en: "Ali Hasan" }, email: "ali@example.com", phone: "+973 3988 1020" },
  techzone: { name: { ar: "يوسف المير", en: "Yousif Al Mir" }, email: "yousif@example.com", phone: "+973 3455 7788" },
};

/** Balances of the other demo accounts, in BHD (refunds land here). */
export const otherBalances: Record<string, number> = { "lulu-sweets": 0, "glow-clinic": 25, fithub: 0, techzone: 60 };

/* ---------- Deadlines ---------- */

/** Direct offers from the other accounts have their own deadline. */
const offerDeadlines: Record<string, string> = { "ord-3024": "2026-10-01", "ord-3025": "2026-10-10", "ord-3026": "2026-10-12", "ord-3027": "2026-10-16" };

/** Deadlines an admin moved, per order (the campaign's stays as it was for everyone else). */
export const deadlineOverrides: Record<string, { from?: string; to: string }> = {};

export function deadlineOf(order: Order): string | undefined {
  return deadlineOverrides[order.id]?.to ?? (order.campaignId ? getCampaign(order.campaignId)?.deadline : offerDeadlines[order.id]);
}

/* ---------- Creator applications ---------- */

export type ApplicationStatus = "pending" | "changes_requested" | "rejected" | "approved";
export type Decision = { at: string; status: Exclude<ApplicationStatus, "pending">; note?: string };
export type SampleClip = { id: string; videoSrc: string };

/** A creator who signed up in the app and waits for 100clips to check their profile and samples. */
export type Application = {
  id: string;
  name: Localized;
  handle: string;
  phone: string;
  /** ISO code, from the phone number until they pick one. */
  country: string;
  city: Localized;
  gender: Gender;
  bio: Localized;
  niches: Niche[];
  formats: FormatOffer[];
  /** Usernames, without @. */
  instagram?: string;
  tiktok?: string;
  samples: SampleClip[];
  appliedAt: string;
  status: ApplicationStatus;
  /** Every decision, oldest first, with the note the creator sees. */
  decisions: Decision[];
};

const sample = (id: string, n: number): SampleClip => ({ id, videoSrc: `/clips/sample-${n}.mp4` });

export const applications: Application[] = [
  {
    id: "dana-alsayed",
    name: { ar: "دانة السيد", en: "Dana Al Sayed" },
    handle: "dana.glow",
    phone: "+973 3900 1122",
    country: "BH",
    city: { ar: "المنامة", en: "Manama" },
    gender: "female",
    bio: { ar: "روتين عناية بسيط وصادق، وأجرب كل منتج أسبوع قبل ما أتكلم عنه.", en: "Simple, honest skincare. I try every product for a week before I talk about it." },
    niches: ["beauty"],
    formats: [{ format: "instagram_reel", price: 35 }, { format: "instagram_story", price: 18 }, { format: "tiktok_video", price: 30 }],
    instagram: "dana.glow",
    tiktok: "dana.glow",
    samples: [sample("s-dana-1", 1), sample("s-dana-2", 2), sample("s-dana-3", 3)],
    appliedAt: "2026-10-02T08:30:00Z",
    status: "pending",
    decisions: [],
  },
  {
    id: "omar-alnaimi",
    name: { ar: "عمر النعيمي", en: "Omar Al Naimi" },
    handle: "omar.eats",
    phone: "+973 3611 8090",
    country: "BH",
    city: { ar: "المحرق", en: "Muharraq" },
    gender: "male",
    bio: { ar: "أجرب مطاعم المحرق القديمة والجديدة، وأقول رأيي بدون مجاملة.", en: "Old and new Muharraq restaurants, reviewed straight." },
    niches: ["food"],
    formats: [{ format: "tiktok_video", price: 40 }, { format: "instagram_reel", price: 42 }],
    tiktok: "omar.eats",
    samples: [sample("s-omar-1", 2), sample("s-omar-2", 3)],
    appliedAt: "2026-10-01T15:10:00Z",
    status: "pending",
    decisions: [],
  },
  {
    id: "majed-alrumaihi",
    name: { ar: "ماجد الرميحي", en: "Majed Al Rumaihi" },
    handle: "majed.plays",
    phone: "+973 3355 6677",
    country: "BH",
    city: { ar: "عيسى", en: "Isa Town" },
    gender: "male",
    bio: { ar: "ألعاب وأجهزة، وأشرح التقنية بلغة بسيطة.", en: "Games and gadgets, tech explained simply." },
    niches: ["gaming", "tech"],
    formats: [{ format: "tiktok_video", price: 28 }],
    tiktok: "majed.plays",
    instagram: "majed.plays",
    samples: [sample("s-majed-1", 1), sample("s-majed-2", 2), sample("s-majed-3", 3)],
    appliedAt: "2026-09-30T19:45:00Z",
    status: "pending",
    decisions: [],
  },
  {
    id: "sara-alhaddad",
    name: { ar: "سارة الحداد", en: "Sara Al Haddad" },
    handle: "sara.styles",
    phone: "+973 3200 4455",
    country: "BH",
    city: { ar: "الرفاع", en: "Riffa" },
    gender: "female",
    bio: { ar: "تنسيقات عبايات للدوام والمناسبات.", en: "Abaya styling for work and occasions." },
    niches: ["fashion"],
    formats: [{ format: "instagram_reel", price: 45 }, { format: "instagram_story", price: 22 }],
    instagram: "sara.styles",
    samples: [sample("s-sara-1", 3), sample("s-sara-2", 1)],
    appliedAt: "2026-09-27T11:00:00Z",
    status: "changes_requested",
    decisions: [{ at: "2026-09-29T09:20:00Z", status: "changes_requested", note: "Both samples have music in the background. Please upload versions without music, or new clips." }],
  },
  {
    id: "jassim-almannai",
    name: { ar: "جاسم المناعي", en: "Jassim Al Mannai" },
    handle: "jassim.trips",
    phone: "+973 3988 3311",
    country: "BH",
    city: { ar: "سترة", en: "Sitra" },
    gender: "male",
    bio: { ar: "رحلات بحرية وصيد.", en: "Boat trips and fishing." },
    niches: ["travel"],
    formats: [{ format: "tiktok_video", price: 35 }],
    tiktok: "jassim.trips",
    samples: [sample("s-jassim-1", 2)],
    appliedAt: "2026-09-22T16:00:00Z",
    status: "rejected",
    decisions: [{ at: "2026-09-24T10:05:00Z", status: "rejected", note: "The sample doesn't follow our content rules (clothing). You're welcome to apply again with new clips." }],
  },
];

export function getApplication(id: string): Application | undefined {
  return applications.find((a) => a.id === id);
}

/* ---------- Transfers to creators ---------- */

/** One bank transfer to a creator, covering one or more approved orders. */
export type Payout = { id: string; creatorId: string; orderIds: string[]; amount: number; iban: string; bankRef: string; paidAt: string };

/** The day an order was approved (and its payment released to the creator), if it was. */
export function approvedOn(order: Order): string | undefined {
  return eventsOf(order).find((e) => e.type === "approved")?.at.slice(0, 10);
}

/**
 * Demo history: everything approved before September was paid out on the 1st of the next month,
 * one transfer per creator. September's approvals are still owed.
 */
function seedPayouts(): Payout[] {
  const batches = new Map<string, Order[]>();
  for (const order of platformOrders()) {
    const day = approvedOn(order);
    if (order.status !== "approved" || !day || day >= "2026-09-01") continue;
    const key = `${order.creatorId}|${day.slice(0, 7)}`;
    batches.set(key, [...(batches.get(key) ?? []), order]);
  }
  let n = 1;
  return [...batches.entries()].map(([key, list]) => {
    const [creatorId, month] = key.split("|");
    const [y, m] = month.split("-").map(Number);
    const paidAt = new Date(Date.UTC(y, m, 1, 9)).toISOString();
    return {
      id: `pay-${String(n).padStart(3, "0")}`,
      creatorId,
      orderIds: list.map((x) => x.id),
      amount: list.reduce((sum, x) => sum + x.amount, 0),
      iban: currentBank(creatorId)?.iban ?? "",
      bankRef: `TRF${paidAt.slice(2, 10).replace(/-/g, "")}${String(n++).padStart(3, "0")}`,
      paidAt,
    };
  });
}

export const payouts: Payout[] = seedPayouts();

/* ---------- What admins did ---------- */

export type AdminTarget = { kind: "order" | "creator" | "brand" | "application" | "account"; id: string };
export type AdminActionType =
  | "payoutSent"
  | "creatorApproved"
  | "changesRequested"
  | "creatorRejected"
  | "suspended"
  | "unsuspended"
  | "loginReset"
  | "deadlineExtended"
  | "orderCancelled"
  | "withdrawalSent"
  | "withdrawalRejected"
  | "problemResolved";
/** One thing an admin did, kept for the activity log. `detail` holds the reference, new date or amount. */
export type AdminAction = { id: string; at: string; type: AdminActionType; target: AdminTarget; note?: string; detail?: string };
export const adminLog: AdminAction[] = [
  { id: "log-0", at: "2026-09-29T09:20:00Z", type: "changesRequested", target: { kind: "application", id: "sara-alhaddad" }, note: applications[3].decisions[0].note },
  { id: "log-00", at: "2026-09-24T10:05:00Z", type: "creatorRejected", target: { kind: "application", id: "jassim-almannai" }, note: applications[4].decisions[0].note },
];

export function logAction(type: AdminActionType, target: AdminTarget, extra: { note?: string; detail?: string } = {}) {
  adminLog.push({ id: `log-${adminLog.length + 1}`, at: new Date().toISOString(), type, target, ...extra });
}

/** What admins did to one order, creator or brand, newest first. A creator's history includes their application. */
export function activityFor(kind: AdminTarget["kind"], id: string): AdminAction[] {
  return adminLog.filter((a) => a.target.id === id && (a.target.kind === kind || (kind === "creator" && a.target.kind === "application"))).sort((a, b) => b.at.localeCompare(a.at));
}

/** Records a transfer to a creator for these orders. */
export function addPayout(creatorId: string, orderIds: string[], amount: number, bankRef: string): Payout {
  // On the demo's "today", so it lands in the same periods as everything else.
  const paidAt = `${DEMO_TODAY}${new Date().toISOString().slice(10)}`;
  const payout: Payout = { id: `pay-${String(payouts.length + 1).padStart(3, "0")}`, creatorId, orderIds, amount, iban: currentBank(creatorId)?.iban ?? "", bankRef, paidAt };
  payouts.push(payout);
  logAction("payoutSent", { kind: "creator", id: creatorId }, { detail: `${amount}|${bankRef}` });
  return payout;
}

/* ---------- 100Clips Support chats ---------- */

/** The official account admins write as. Creators see it with a verified tick, pinned above brand chats. */
export const SUPPORT_NAME = "100Clips Support";

export type SupportMessage = { id: string; from: "support" | "creator"; text: string; at: string };

/** One support chat per creator, oldest message first. */
export const supportThreads: Record<string, SupportMessage[]> = {
  "reem-alhashimi": [
    { id: "sup-1", from: "support", text: "مرحبا ريم، لاحظنا إنك غيّرتي الحساب البنكي يوم 1 أكتوبر. ممكن تأكدين إن التغيير منك قبل ما نحوّل لك 40 د.ب.؟", at: "2026-10-02T09:12:00Z" },
    { id: "sup-2", from: "creator", text: "إيه أنا غيرته، فتحت حساب جديد في سيتي بنك. شكرًا على التأكيد!", at: "2026-10-02T10:03:00Z" },
  ],
};

export function addSupportMessage(creatorId: string, text: string) {
  const thread = (supportThreads[creatorId] ??= []);
  thread.push({ id: `sup-${Date.now()}`, from: "support", text, at: new Date().toISOString() });
}

/* ---------- Countries waiting for launch ---------- */

/**
 * "Not in Bahrain?" requests from the creator app's sign-up: where they are and how to reach them.
 * Each one is a vote for that country; when a country goes active (lib/data/markets.ts) these are who we tell.
 */
export type WaitlistRequest = { country: string; contact: string; at: string };

export const countryWaitlist: WaitlistRequest[] = [
  { country: "SA", contact: "reem.cooks@example.com", at: "2026-10-01T09:12:00Z" },
  { country: "SA", contact: "+966 55 120 4471", at: "2026-10-03T17:40:00Z" },
  { country: "SA", contact: "faisal.reviews@example.com", at: "2026-10-06T11:05:00Z" },
  { country: "SA", contact: "+966 50 882 1903", at: "2026-10-08T20:21:00Z" },
  { country: "KW", contact: "+965 9911 2040", at: "2026-10-02T13:30:00Z" },
  { country: "KW", contact: "dalal.style@example.com", at: "2026-10-07T08:55:00Z" },
  { country: "AE", contact: "+971 50 334 7781", at: "2026-10-05T15:10:00Z" },
  { country: "QA", contact: "m.alkuwari@example.com", at: "2026-10-04T10:00:00Z" },
];

/** Requests per country, most wanted first; ties go to the newest request. */
export function waitlistByCountry(): Array<{ country: string; count: number; latest: string }> {
  const by = new Map<string, { count: number; latest: string }>();
  for (const r of countryWaitlist) {
    const row = by.get(r.country) ?? { count: 0, latest: r.at };
    by.set(r.country, { count: row.count + 1, latest: r.at > row.latest ? r.at : row.latest });
  }
  return [...by].map(([country, v]) => ({ country, ...v })).sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest));
}
