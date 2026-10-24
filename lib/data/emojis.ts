import type { Face } from "./creatorFilters";
import type { Country, Gender, Niche, VenueKind } from "./types";

/** Flags shown next to country names. */
export const countryFlag: Record<Country, string> = { bh: "🇧🇭", sa: "🇸🇦", ae: "🇦🇪", kw: "🇰🇼", qa: "🇶🇦", om: "🇴🇲" };

/** Before venue kinds in the product form. */
export const venueEmoji: Record<VenueKind, string> = {
  cafe: "☕",
  restaurant: "🍽️",
  salon: "💇",
  gym: "🏋️",
  clinic: "🩺",
  other: "📍",
};

/** Before creator category names; the same emojis as the creator app (creator_app/lib/ui/niches.dart). */
export const nicheEmoji: Record<Niche, string> = {
  general: "🌐",
  food: "🍔",
  beauty: "💄",
  fashion: "👕",
  family: "👨‍👩‍👧",
  fitness: "💪",
  travel: "✈️",
  tech: "📱",
  gaming: "🎮",
};

/** Next to gender names; the same as the creator app. */
export const genderEmoji: Record<Gender, string> = { female: "👩", male: "👨" };

/** Face in their videos or not; the same as the creator app's profile. */
export const faceEmoji: Record<Face, string> = { shows: "🤳", faceless: "👤" };

/** Any country's flag from its two-letter code (BH → 🇧🇭). */
export const flagOf = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
