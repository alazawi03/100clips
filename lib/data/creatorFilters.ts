import { fromPrice } from "./creators";
import { platformOf, type Creator, type Gender, type Niche, type Platform } from "./types";

export const NICHES: Niche[] = ["general", "food", "beauty", "fashion", "family", "fitness", "travel", "tech", "gaming"];
export const GENDERS: Gender[] = ["male", "female"];
export const PLATFORMS: Platform[] = ["tiktok", "instagram"];
/** Whether the creator's face is in their videos (what they set in the creator app). */
export type Face = "shows" | "faceless";
export const FACES: Face[] = ["shows", "faceless"];

/** Creators who haven't said match neither choice. */
export const matchesFace = (c: Pick<Creator, "showsFace">, faces: Face[]) => faces.length === 0 || (c.showsFace !== undefined && faces.includes(c.showsFace ? "shows" : "faceless"));

export const SORTS = ["rating", "priceLow", "priceHigh", "orders"] as const;
export type Sort = (typeof SORTS)[number];

/** Every filter takes several values (any of them matches). In the URL they are comma-separated: ?niche=food,beauty */
export type CreatorFilters = {
  q?: string;
  niche: Niche[];
  gender: Gender[];
  platform: Platform[];
  face: Face[];
  sort: Sort;
};

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function pickMany<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(","))].filter((v): v is T => (allowed as readonly string[]).includes(v));
}

/** Reads filters from URL search params, ignoring anything unknown. */
export function parseFilters(params: Record<string, string | string[] | undefined>): CreatorFilters {
  const q = typeof params.q === "string" ? params.q.trim() : "";
  return {
    q: q || undefined,
    niche: pickMany(params.niche, NICHES),
    gender: pickMany(params.gender, GENDERS),
    platform: pickMany(params.platform, PLATFORMS),
    face: pickMany(params.face, FACES),
    sort: pick(params.sort, SORTS) ?? "rating",
  };
}

export function filterCreators(all: Creator[], f: CreatorFilters): Creator[] {
  const q = f.q?.toLowerCase();
  const result = all.filter((c) => {
    if (q && ![c.name.ar, c.name.en.toLowerCase(), c.handle].some((s) => s.includes(q))) return false;
    if (f.niche.length && !c.niches.some((n) => f.niche.includes(n))) return false;
    if (f.gender.length && !f.gender.includes(c.gender)) return false;
    if (f.platform.length && !c.formats.some((o) => f.platform.includes(platformOf[o.format]))) return false;
    if (!matchesFace(c, f.face)) return false;
    return true;
  });
  const by: Record<Sort, (a: Creator, b: Creator) => number> = {
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.completedOrders - a.completedOrders,
    // No price yet: last either way.
    priceLow: (a, b) => (fromPrice(a) ?? Infinity) - (fromPrice(b) ?? Infinity),
    priceHigh: (a, b) => (fromPrice(b) ?? -Infinity) - (fromPrice(a) ?? -Infinity),
    orders: (a, b) => b.completedOrders - a.completedOrders,
  };
  return result.sort(by[f.sort]);
}
