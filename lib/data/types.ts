export type Localized = { ar: string; en: string };

export type Niche = "beauty" | "food" | "fashion" | "tech" | "travel" | "fitness" | "family" | "gaming";
export type Gender = "female" | "male";
export type ContentLanguage = "ar" | "en";

/** What a creator can deliver. TikTok and Instagram only for now. */
export type ContentFormat = "tiktok_video" | "instagram_reel" | "instagram_story" | "youtube_video" | "youtube_short";
export const CONTENT_FORMATS: ContentFormat[] = ["tiktok_video", "instagram_reel", "instagram_story", "youtube_video", "youtube_short"];
export type Platform = "tiktok" | "instagram" | "youtube";
export const platformOf: Record<ContentFormat, Platform> = {
  tiktok_video: "tiktok",
  instagram_reel: "instagram",
  instagram_story: "instagram",
  youtube_video: "youtube",
  youtube_short: "youtube",
};

export type FormatOffer = { format: ContentFormat; /** In BHD, per clip. */ price: number };

export type Creator = {
  id: string;
  name: Localized;
  handle: string;
  city: Localized;
  gender: Gender;
  niches: Niche[];
  languages: ContentLanguage[];
  /** The formats this creator offers, with a price per clip. */
  formats: FormatOffer[];
  /** Undefined for creators with no reviews yet. */
  rating?: number;
  completedOrders: number;
  bio: Localized;
  /** Shows the story ring: the creator posted new sample clips. */
  hasNewClips: boolean;
};

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

export type CampaignStatus = "in_progress" | "completed" | "cancelled";

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
  /** Total budget, in BHD. */
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
};

/**
 * pending      offer sent, waiting for the creator to accept
 * in_progress  creator is filming
 * submitted    clip uploaded, 100clips is checking it against the content rules
 * delivered    clip passed the check and is ready for the brand to review
 * approved     brand approved the clip and the payment is released
 */
/** "cancelled": the offer was withdrawn before the creator accepted (money back to the balance). */
export type OrderStatus = "pending" | "in_progress" | "submitted" | "delivered" | "approved" | "cancelled";
/** The working pipeline, in order. Cancelled orders sit outside it. */
export type PipelineStatus = Exclude<OrderStatus, "cancelled">;
export const ORDER_STATUSES: PipelineStatus[] = ["pending", "in_progress", "submitted", "delivered", "approved"];

/** Something that happened on an order, for the activity timeline. `at` is an ISO date or date-time. */
export type OrderEventType = "offered" | "accepted" | "sent" | "received" | "uploaded" | "revisionRequested" | "approved" | "released" | "cancelled" | "returned";
export type OrderEvent = { type: OrderEventType; at: string };

/**
 * Getting a physical product to the creator: the brand always ships and taps "Sent" (with an optional
 * note instead of a tracking number); the creator taps "Received". When the creator returns it,
 * the brand collects it and taps "Returned".
 */
export type OrderShipping = { sentAt?: string; note?: string; receivedAt?: string; returnedAt?: string };

export type Order = {
  id: string;
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
  /** Order total, in BHD. */
  amount: number;
  status: OrderStatus;
  revisionRequested?: boolean;
  revisionNote?: string;
  createdAt: string;
  clipId?: string;
  shipping?: OrderShipping;
  /** Activity history; demo orders without one get it derived from their status (lib/orderFlow.ts). */
  events?: OrderEvent[];
  /** 1–5 stars, given by the brand after approving. */
  rating?: number;
};

export type OrderItem = { format: ContentFormat; quantity: number; /** In BHD, per clip. */ price: number };

export type Industry =
  | "beauty"
  | "food_beverage"
  | "fashion"
  | "tech"
  | "real_estate"
  | "automotive"
  | "health"
  | "education"
  | "home_living"
  | "other";
export const INDUSTRIES: Industry[] = ["beauty", "food_beverage", "fashion", "tech", "real_estate", "automotive", "health", "education", "home_living", "other"];

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
};

export type Brand = {
  id: string;
  name: Localized;
  /** Optional image URL (a resized data URL for uploads until there is a file store). */
  logo?: string;
  industry: Industry;
  city: Localized;
  about?: Localized;
  website?: string;
  instagram?: string;
  tiktok?: string;
  /** Commercial registration number. */
  crNumber?: string;
};

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
