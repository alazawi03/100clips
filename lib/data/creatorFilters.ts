import { fromPrice, platformOf, type Creator, type Gender, type Platform } from "./types";

export const GENDERS: Gender[] = ["male", "female"];
export const PLATFORMS: Platform[] = ["tiktok", "instagram"];
/** Whether the creator's face is in their videos (what they set in the creator app). */
export type Face = "shows" | "faceless";
export const FACES: Face[] = ["shows", "faceless"];

/** A creator's area is their governorate, picked in the creator app (kept in Arabic; lib/data/governorates names it in English). The areas to filter by: the ones creators have set, A to Z. */
export const areasOf = (cities: string[]) => [...new Set(cities.map((c) => c.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
/** Creators who haven't set an area match only when none is picked. */
export const matchesArea = (city: string, areas: string[]) => areas.length === 0 || areas.includes(city.trim());

/** Creators who haven't said match neither choice. */
export const matchesFace = (c: Pick<Creator, "showsFace">, faces: Face[]) => faces.length === 0 || (c.showsFace !== undefined && faces.includes(c.showsFace ? "shows" : "faceless"));

export const SORTS = ["rating", "priceLow", "priceHigh", "orders"] as const;
export type Sort = (typeof SORTS)[number];

/** What sorting looks at, so the creators page and the campaign picker sort the same way. */
export type Sortable = { rating?: number; completedOrders: number; fromPrice?: number };
export const bySort: Record<Sort, (a: Sortable, b: Sortable) => number> = {
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.completedOrders - a.completedOrders,
  // No price yet: last either way.
  priceLow: (a, b) => (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity),
  priceHigh: (a, b) => (b.fromPrice ?? -Infinity) - (a.fromPrice ?? -Infinity),
  orders: (a, b) => b.completedOrders - a.completedOrders,
};

/** Every filter takes several values (any of them matches). In the URL they are comma-separated: ?platform=tiktok,instagram */
export type CreatorFilters = {
  q?: string;
  area: string[];
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
    area: typeof params.area === "string" ? [...new Set(params.area.split(",").map((a) => a.trim()).filter(Boolean))] : [],
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
    if (!matchesArea(c.city.ar, f.area)) return false;
    if (f.gender.length && !f.gender.includes(c.gender)) return false;
    if (f.platform.length && !c.formats.some((o) => f.platform.includes(platformOf[o.format]))) return false;
    if (!matchesFace(c, f.face)) return false;
    return true;
  });
  const sortable = (c: Creator): Sortable => ({ rating: c.rating, completedOrders: c.completedOrders, fromPrice: fromPrice(c) });
  return result.sort((a, b) => bySort[f.sort](sortable(a), sortable(b)));
}
