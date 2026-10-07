import type { Country, Industry } from "./types";

/** Flags shown next to country names. */
export const countryFlag: Record<Country, string> = { bh: "🇧🇭", sa: "🇸🇦", ae: "🇦🇪", kw: "🇰🇼", qa: "🇶🇦", om: "🇴🇲" };

/** Shown before industry names in pickers. Emojis read the same in every language. */
export const industryEmoji: Record<Industry, string> = {
  beauty: "💄",
  food_beverage: "🍽️",
  fashion: "👗",
  tech: "💻",
  real_estate: "🏠",
  automotive: "🚗",
  health: "🩺",
  education: "🎓",
  home_living: "🛋️",
  other: "✨",
};
