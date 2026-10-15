import { api, apiOrNothing } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { privateLink, publicUrl } from "./storage";
import type { Creator, Localized, Review } from "./types";

/**
 * Creators from the API, in the dashboard's shapes (types.ts): Explore's cards and a profile with
 * its reviews. The API only returns creators brands may see (approved, complete, not suspended).
 */

type ExploreRow = components["schemas"]["ExploreCreator"];
type ProfileRow = components["schemas"]["CreatorProfile"];

const same = (text: string | null | undefined): Localized => ({ ar: text ?? "", en: text ?? "" });
const names = (ar: string | null, en: string | null): Localized => ({ ar: ar || en || "", en: en || ar || "" });

/** Explore: bookable creators, most completed orders first. Filters run on the page (lib/data/creatorFilters). */
export async function exploreCreators(): Promise<Creator[]> {
  const rows = await api<ExploreRow[]>("/creators?limit=100");
  return rows.map((r) => ({
    id: r.id,
    name: names(r.name_ar, r.name_en),
    handle: r.handle,
    city: same(r.city),
    // Gender is asked at sign-up; a missing one only drops them from gender filters.
    gender: (r.gender ?? "female") as Creator["gender"],
    niches: r.niches,
    formats: r.formats,
    rating: r.rating ?? undefined,
    completedOrders: r.completed_orders,
    bio: same(r.bio),
    hasNewClips: false,
    photo: publicUrl(r.photo_path),
    country: r.country,
    showsFace: r.shows_face ?? undefined,
  }));
}

/** One creator's profile and reviews, or undefined if the brand can't see them. */
/** A clip the creator made for a brand, approved and shown publicly: plays through a link for an hour. */
export type BrandClip = { id: string; brand: Localized; videoSrc: string };

export async function creatorProfile(id: string): Promise<{ creator: Creator; reviews: Review[]; clips: BrandClip[] } | undefined> {
  const p = await apiOrNothing<ProfileRow>(`/creators/${id}`);
  if (!p) return undefined;
  const c = p.creator;
  const socials = Object.fromEntries(p.socials.map((s) => [s.platform, s.username]));
  const creator: Creator = {
    id: c.id,
    name: names(c.name_ar, c.name_en),
    handle: c.handle,
    city: same(c.city),
    gender: (c.gender ?? "female") as Creator["gender"],
    niches: c.niches,
    formats: p.formats,
    rating: p.rating?.rating ?? undefined,
    completedOrders: c.completed_orders,
    bio: same(c.bio),
    hasNewClips: false,
    instagram: socials.instagram,
    tiktok: socials.tiktok,
    photo: publicUrl(c.photo_path),
    country: c.country,
    showsFace: c.shows_face ?? undefined,
    portfolio: p.portfolio.map((s) => ({ id: s.id, videoSrc: publicUrl(s.video_path)! })),
  };
  const reviews: Review[] = p.reviews.map((r) => ({
    id: r.order_id,
    creatorId: c.id,
    brand: names(r.brand_name_ar, r.brand_name_en),
    rating: r.rating,
    comment: same(r.review),
    date: r.rated_at.slice(0, 10),
  }));
  // Clips stay in private storage; a public one gets a link for anyone signed in. One that fails is left out.
  const clips = (
    await Promise.all(
      p.clips.map(async (c): Promise<BrandClip | undefined> => {
        const videoSrc = await privateLink("clips", c.video_path).catch(() => undefined);
        return videoSrc ? { id: c.order_id, brand: names(c.brand_name_ar, c.brand_name_en), videoSrc } : undefined;
      }),
    )
  ).filter((c): c is BrandClip => !!c);
  return { creator, reviews, clips };
}
