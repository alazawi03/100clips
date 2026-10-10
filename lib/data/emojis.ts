import type { Face } from "./creatorFilters";
import type { Country, Gender, Industry, Niche } from "./types";

/** Flags shown next to country names. */
export const countryFlag: Record<Country, string> = { bh: "🇧🇭", sa: "🇸🇦", ae: "🇦🇪", kw: "🇰🇼", qa: "🇶🇦", om: "🇴🇲" };

/** Shown before industry names in pickers. Emojis read the same in every language. */
export const industryEmoji: Record<Industry, string> = {
  food_beverage: "🍽️",
  fashion: "👕",
  tech: "💻",
  real_estate: "🏠",
  automotive: "🚗",
  health: "🩺",
  education: "🎓",
  home_living: "🛋️",
  other: "✨",
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
