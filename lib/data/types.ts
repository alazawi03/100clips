export type Localized = { ar: string; en: string };

/** "general": creators who make all kinds of content. Listed first. */
export type Niche = "general" | "beauty" | "food" | "fashion" | "tech" | "travel" | "fitness" | "family" | "gaming";
export type Gender = "female" | "male";

/** What a creator can deliver. TikTok and Instagram only for now. */
export type ContentFormat = "tiktok_video" | "instagram_reel" | "instagram_story";
export const CONTENT_FORMATS: ContentFormat[] = ["tiktok_video", "instagram_reel", "instagram_story"];
export type Platform = "tiktok" | "instagram";
export const platformOf: Record<ContentFormat, Platform> = {
  tiktok_video: "tiktok",
  instagram_reel: "instagram",
  instagram_story: "instagram",
};

export type FormatOffer = { format: ContentFormat; /** In BHD, per clip. */ price: number };

export type Creator = {
  id: string;
  name: Localized;
  handle: string;
  city: Localized;
  gender: Gender;
  niches: Niche[];
  /** The formats this creator offers, with a price per clip. */
  formats: FormatOffer[];
  /** Undefined for creators with no reviews yet. */
  rating?: number;
  completedOrders: number;
  bio: Localized;
  /** Shows the story ring: the creator posted new sample clips. */
  hasNewClips: boolean;
  /** The creator's own accounts, as they set them in the creator app (handles without "@"). */
  instagram?: string;
  tiktok?: string;
  /** Profile photo URL; the first letter on a tint until there is one. */
  photo?: string;
  /** Where they live (ISO code, BH). Brands only see creators in active markets (lib/data/markets.ts). */
  country: string;
  /** Whether their face is in their videos; undefined until they say. The creator changes it directly (no 100clips review). */
  showsFace?: boolean;
  /** Up to 3 sample videos the creator picked in the app, approved by 100clips. */
  portfolio?: PortfolioClip[];
};

/** A sample video on a creator's profile. */
export type PortfolioClip = { id: string; videoSrc: string };

/** Placeholder poster art until real thumbnails exist. Hues are 0–360. */
export type ClipPoster = { from: number; to: number; niche: Niche };

/** A finished piece of work, shown under "Latest work" on the creator's profile. */
export type Clip = {
  id: string;
  creatorId: string;
  /** The brand it was made for. */
  brand: Localized;
  title: Localized;
  durationSec: number;
  views: number;
  poster: ClipPoster;
  /** Silent placeholder video in public/clips. */
  videoSrc: string;
};

export type Review = {
  id: string;
  creatorId: string;
  brand: Localized;
  rating: number;
  comment: Localized;
  date: string;
};

/** "draft": saved from "New campaign" before paying; nothing sent yet. */
export type CampaignStatus = "draft" | "in_progress" | "completed" | "cancelled";

/** How a featured product reaches the creator. One per product, by product type. */
export type ProductLogistics =
  | { type: "physical"; /** After filming, the creator keeps the item or sends it back. */ after: "keep" | "return" }
  | { type: "app"; link?: string; testAccount?: string; promoCode?: string }
  | { type: "venue"; /** ISO dates, both optional. */ visitFrom?: string; visitTo?: string; included?: string };

/** The kind of clip a campaign asks for. */
export type VideoStyle = "ad" | "review" | "routine" | "unboxing" | "howto" | "other";
export const VIDEO_STYLES: VideoStyle[] = ["ad", "review", "routine", "unboxing", "howto", "other"];

export type Campaign = {
  id: string;
  brandId: string;
  title: Localized;
  brief: Localized;
  niche: Niche;
  clipsCount: number;
  /** What the creators are paid in total, in BHD (the brand pays the service fee on top, lib/fees.ts). */
  budget: number;
  /** What the clips promote: the brand itself, or specific products (productIds). Defaults to products. */
  promote?: "brand" | "products";
  /** The products the campaign features. */
  productIds?: string[];
  /** Logistics per featured product id. */
  logistics?: Record<string, ProductLogistics>;
  videoStyle?: VideoStyle;
  /** Date the clips are due, ISO yyyy-mm-dd. */
  deadline?: string;
  /** Extra brief details, shown to creators with the request (before they accept). */
  keyMessage?: string;
  /** Links to clips the brand likes, at most 3. */
  references?: string[];
  mustInclude?: string;
  avoid?: string;
  /** ISO date the campaign was created (paid, for checkout campaigns). */
  createdAt?: string;
  status: CampaignStatus;
  deliveredClips: number;
  /** A draft's form as it was saved (every field by name) and its chosen creators, to pick up where it was left. */
  draft?: { values: Record<string, string>; picks: Array<{ creatorId: string; format: ContentFormat }>; savedAt: string };
  /** Changes the brand made after paying, for the activity timeline and the "Edited" mark. */
  events?: CampaignEvent[];
};

/** One extra detail that changed in an edit: its value before and after (references one per line). */
export type DetailChange = { field: "keyMessage" | "references" | "mustInclude" | "avoid"; before?: string; after?: string };

/**
 * "detailsEdited": the extra details changed while nobody had accepted yet, with what changed.
 * "deadlineMoved": the deadline moved later (`deadline` is the new date, `from` the old one).
 */
export type CampaignEvent =
  | { type: "detailsEdited"; at: string; changes?: DetailChange[] }
  | { type: "deadlineMoved"; at: string; deadline: string; from?: string };

/**
 * pending      offer sent, waiting for the creator to accept
 * in_progress  creator is filming
 * delivered    clip uploaded and ready for the brand to review (no 100clips check in the MVP)
 * approved     brand approved the clip and the payment is released
 */
/**
 * "declined": the creator turned the offer down (money back to the brand).
 * "cancelled": the offer was withdrawn before the creator accepted (money back to the balance).
 */
export type OrderStatus = "pending" | "in_progress" | "delivered" | "approved" | "declined" | "cancelled";
/** The working pipeline, in order. Declined and cancelled orders sit outside it. */
export type PipelineStatus = Exclude<OrderStatus, "declined" | "cancelled">;
export const ORDER_STATUSES: PipelineStatus[] = ["pending", "in_progress", "delivered", "approved"];

/** Something that happened on an order, for the activity timeline. `at` is an ISO date or date-time. */
/** "expired": nobody answered the offer within OFFER_HOURS (lib/orderFlow.ts), so the money came back. */
export type OrderEventType =
  | "offered"
  | "accepted"
  | "sent"
  | "received"
  | "uploaded"
  | "revisionRequested"
  | "approved"
  | "released"
  | "declined"
  | "expired"
  | "cancelled"
  | "returned";
export type OrderEvent = { type: OrderEventType; at: string };

/**
 * Getting a physical product to the creator: the brand always ships and taps "Sent" (with an optional
 * note instead of a tracking number); the creator taps "Received". When the creator returns it,
 * the brand collects it and taps "Returned".
 */
export type OrderShipping = { sentAt?: string; note?: string; receivedAt?: string; returnedAt?: string };

/**
 * Why a declined order ended: the creator's own reason (the same choices as the creator app), or
 * "expired" when the offer ran out without an answer.
 */
export type DeclineReason = "busy" | "notMyNiche" | "other" | "expired";

/** One uploaded version of the clip. */
export type ClipVersion = { videoSrc: string; uploadedAt: string; durationSec?: number };

/** A copy of the creator's address and phone, made when they accept a physical product: where the brand ships. */
export type ShipTo = { type: "home" | "work"; label?: string; address: string; latitude?: number; longitude?: number; phone?: string };

export type Order = {
  id: string;
  /** Shown as #1043. */
  number?: number;
  brandId: string;
  source: "offer" | "campaign";
  campaignId?: string;
  creatorId: string;
  title: Localized;
  /** What the brand asked for. Campaign orders use the campaign brief. */
  brief?: Localized;
  /** Optional note from the brand to this creator. */
  note?: string;
  items: OrderItem[];
  /** Total number of clips across items. */
  clips: number;
  /** What the creator is paid, in BHD (their price). */
  amount: number;
  /** 100clips' service fee the brand paid on top, in BHD (lib/fees.ts). Missing on older demo orders. */
  fee?: number;
  status: OrderStatus;
  revisionRequested?: boolean;
  revisionNote?: string;
  /** Set when status is "declined". */
  declineReason?: DeclineReason;
  /** The creator's own words when declining, optional. */
  declineNote?: string;
  createdAt: string;
  clipId?: string;
  /** Every version the creator uploaded, oldest first (the last one is `clipId`). Missing means one version. */
  versions?: ClipVersion[];
  /** Spark Ads (TikTok) or Partnership Ads (Instagram) code the creator added with the clip, optional. */
  adCode?: AdCode;
  shipping?: OrderShipping;
  /** Activity history; demo orders without one get it derived from their status (lib/orderFlow.ts). */
  events?: OrderEvent[];
  /** Where to send a physical product, once the creator accepted. */
  shipTo?: ShipTo;
  /** This order's due date: the campaign's, unless 100clips moved it for this creator. */
  deadline?: string;
  /** Approved clips: whether other brands may see it on the creator's card. */
  clipPublic?: boolean;
  views?: number;
  /** 1–5 stars, given by the brand when approving (or later). */
  rating?: number;
  /** The brand's comment when approving. */
  review?: string;
};

export type OrderItem = { format: ContentFormat; quantity: number; /** In BHD, per clip. */ price: number };

export type Industry =
  | "food_beverage"
  | "fashion"
  | "tech"
  | "real_estate"
  | "automotive"
  | "health"
  | "education"
  | "home_living"
  | "other";
export const INDUSTRIES: Industry[] = ["food_beverage", "fashion", "tech", "real_estate", "automotive", "health", "education", "home_living", "other"];

export type ProductType = "physical" | "app" | "service" | "venue";
export const PRODUCT_TYPES: ProductType[] = ["physical", "app", "service", "venue"];

/** One login, one balance. It can own several brands. */
export type Account = {
  id: string;
  name: Localized;
  email: string;
  phone: string;
  /** Shared by every brand on the account, in BHD. */
  balance: number;
  /** Where withdrawals from the balance go. Optional, and can be removed at any time. */
  bankAccount?: BankAccount;
};

/** Same shape and checks as the creator app's bank account (lib/iban.ts). */
export type BankAccount = {
  /** Exactly as the bank has it. */
  holder: string;
  /** Without spaces, upper case (e.g. BH67BMAG00001299123456). */
  iban: string;
};

/**
 * Money the brand asked to take out of its balance to its bank account. It leaves the balance when
 * requested; 100clips sends the transfer by hand ("sent", with the bank's reference and the IBAN it
 * went to), or turns it down ("rejected", the money goes back to the balance).
 */
export type Withdrawal = {
  id: string;
  amount: number;
  /** ISO date-time. */
  requestedAt: string;
  status: "requested" | "sent" | "rejected";
  sentAt?: string;
  bankRef?: string;
  /** The IBAN the transfer went to, kept once sent. Until then it's read fresh from the account. */
  iban?: string;
  /** Why it was rejected, shown to the brand. */
  note?: string;
};

/** What went wrong on an order, as the brand reports it to 100clips support. */
export type ProblemReason = "notDelivered" | "notAsAgreed" | "productIssue" | "creatorConduct" | "payment" | "other";
export const PROBLEM_REASONS: ProblemReason[] = ["notDelivered", "notAsAgreed", "productIssue", "creatorConduct", "payment", "other"];

/** A "Report a problem" from the brand on an order, for the admin to look into. */
export type ProblemReport = {
  id: string;
  orderId: string;
  brandId: string;
  reason: ProblemReason;
  details: string;
  /** ISO date-time. */
  at: string;
  status: "open" | "resolved";
  /** The admin's reply when resolving, shown to the brand. */
  resolution?: string;
  resolvedAt?: string;
};

export type Brand = {
  id: string;
  name: Localized;
  /** Optional image URL (a resized data URL for uploads until there is a file store). */
  logo?: string;
  industry: Industry;
  about?: Localized;
  website?: string;
  instagram?: string;
  tiktok?: string;
  /** Countries the brand works in. */
  countries?: Country[];
  /** Commercial registration and VAT certificate per country the brand works in, both optional. */
  registrations?: Partial<Record<Country, BrandRegistration>>;
};

export type BrandRegistration = {
  /** Commercial registration number. */
  crNumber?: string;
  /** File name of the uploaded VAT certificate (the file itself waits for a file store). */
  vatCertificate?: string;
};

/** GCC countries a brand can work in. */
export type Country = "bh" | "sa" | "ae" | "kw" | "qa" | "om";
export const COUNTRIES: Country[] = ["bh", "sa", "ae", "kw", "qa", "om"];

export type AppPlatform = "ios" | "android" | "web";
export const APP_PLATFORMS: AppPlatform[] = ["ios", "android", "web"];
export type ServiceDelivery = "online" | "at_home" | "at_location";
export const SERVICE_DELIVERIES: ServiceDelivery[] = ["online", "at_home", "at_location"];
export type VenueKind = "cafe" | "restaurant" | "salon" | "gym" | "clinic" | "other";
export const VENUE_KINDS: VenueKind[] = ["cafe", "restaurant", "salon", "gym", "clinic", "other"];

/** Fields that only apply to one product type. */
export type ProductDetails =
  | { type: "physical"; /** Retail value of one unit, in BHD. */ value?: number; size?: string }
  | { type: "app"; downloadLink?: string; platforms: AppPlatform[] }
  | { type: "service"; delivery: ServiceDelivery[] }
  | { type: "venue"; kind: VenueKind; location?: string; hours?: string; /** Google Maps link. */ mapUrl?: string };

export type CustomerConcern = { question: string; answer?: string };

export type Product = {
  id: string;
  brandId: string;
  name: Localized;
  photos: string[];
  description?: Localized;
  /** In BHD. */
  price?: number;
  /** 3–5 short bullets. */
  benefits: string[];
  /** What customers worry about or ask before buying, with optional answers. */
  concerns: CustomerConcern[];
  details: ProductDetails;
};

/** Platforms with an ad code a brand can use to boost the creator's post. */
export type AdPlatform = "tiktok" | "instagram";
export type AdCode = {
  platform: AdPlatform;
  code: string;
  /** ISO date the creator's authorisation ends (they pick 7 to 365 days). */
  expiresAt?: string;
};
