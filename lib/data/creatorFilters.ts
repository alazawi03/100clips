import { fromPrice } from "./creators";
import { platformOf, type ContentLanguage, type Creator, type Gender, type Niche, type Platform } from "./types";

export const NICHES: Niche[] = ["food", "beauty", "fashion", "family", "fitness", "travel", "tech", "gaming"];
export const GENDERS: Gender[] = ["female", "male"];
export const CONTENT_LANGUAGES: ContentLanguage[] = ["ar", "en"];
export const PLATFORMS: Platform[] = ["tiktok", "instagram", "youtube"];

export const SORTS = ["rating", "priceLow", "priceHigh", "orders"] as const;
export type Sort = (typeof SORTS)[number];

/** Every filter takes several values (any of them matches). In the URL they are comma-separated: ?niche=food,beauty */
export type CreatorFilters = {
  q?: string;
  niche: Niche[];
  gender: Gender[];
  lang: ContentLanguage[];
  platform: Platform[];
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
    lang: pickMany(params.lang, CONTENT_LANGUAGES),
    platform: pickMany(params.platform, PLATFORMS),
    sort: pick(params.sort, SORTS) ?? "rating",
  };
}

export function filterCreators(all: Creator[], f: CreatorFilters): Creator[] {
  const q = f.q?.toLowerCase();
  const result = all.filter((c) => {
    if (q && ![c.name.ar, c.name.en.toLowerCase(), c.handle].some((s) => s.includes(q))) return false;
    if (f.niche.length && !c.niches.some((n) => f.niche.includes(n))) return false;
    if (f.gender.length && !f.gender.includes(c.gender)) return false;
    if (f.lang.length && !c.languages.some((l) => f.lang.includes(l))) return false;
    if (f.platform.length && !c.formats.some((o) => f.platform.includes(platformOf[o.format]))) return false;
    return true;
  });
  const by: Record<Sort, (a: Creator, b: Creator) => number> = {
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.completedOrders - a.completedOrders,
    priceLow: (a, b) => fromPrice(a) - fromPrice(b),
    priceHigh: (a, b) => fromPrice(b) - fromPrice(a),
    orders: (a, b) => b.completedOrders - a.completedOrders,
  };
  return result.sort(by[f.sort]);
}
