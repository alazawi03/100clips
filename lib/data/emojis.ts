import type { Industry } from "./types";

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
