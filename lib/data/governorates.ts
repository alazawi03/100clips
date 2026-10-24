import type { Localized } from "./types";

/**
 * The governorates creators pick their city from in the creator app (Bahrain's four, Kuwait's six), Arabic → English.
 * The API keeps only the Arabic name. Same lists as 100clips-creators lib/data/governorates.dart.
 */
const GOVERNORATES: Record<string, string> = {
  العاصمة: "Capital",
  المحرق: "Muharraq",
  الشمالية: "Northern",
  الجنوبية: "Southern",
  حولي: "Hawalli",
  الفروانية: "Farwaniya",
  "مبارك الكبير": "Mubarak Al-Kabeer",
  الأحمدي: "Ahmadi",
  الجهراء: "Jahra",
};

/** A creator's city in both languages: a governorate gets its English name; anything else stays as it was typed. */
export function cityName(city: string | null | undefined): Localized {
  const ar = city?.trim() ?? "";
  return { ar, en: GOVERNORATES[ar] ?? ar };
}
