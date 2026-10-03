import type { Localized, Review } from "./types";

function r(id: string, creatorId: string, brand: Localized, rating: number, ar: string, en: string, date: string): Review {
  return { id, creatorId, brand, rating, comment: { ar, en }, date };
}

const roastery = { ar: "محمصة المحرق", en: "Muharraq Roastery" };
const nouf = { ar: "عبايات نوف", en: "Nouf Abayas" };
const shifa = { ar: "صيدلية الشفاء", en: "Al Shifa Pharmacy" };

/** What brands said after approving a clip. Hessa and Ahmed are new and have none yet. */
export const reviews: Review[] = [
  r("rv-01", "noura-alkaabi", shifa, 5, "صوّرت المنتج بطريقة طبيعية جدًا، والمقطع جاب لنا طلبات من أول يوم.", "Filmed the product very naturally, and the clip brought orders on day one.", "2026-09-12"),
  r("rv-02", "noura-alkaabi", roastery, 5, "سريعة في التسليم وفهمت الفكرة من أول مرة.", "Quick to deliver and got the idea first time.", "2026-08-20"),
  r("rv-03", "sultan-alotaibi", roastery, 5, "أسلوبه عفوي ويقنع. صار من المفضلين عندنا.", "His style is relaxed and convincing. He's one of our favourites now.", "2026-08-12"),
  r("rv-04", "sultan-alotaibi", { ar: "برجر الحي", en: "Al Hay Burger" }, 4, "مقطع ممتاز، بس احتجنا تعديل بسيط على الافتتاحية.", "Great clip, we only needed a small change to the opening.", "2026-07-03"),
  r("rv-05", "reem-alhashimi", { ar: "أسواق المنزل", en: "Al Manzil Market" }, 5, "أجواء عائلية حلوة، والعيال أضافوا للمقطع.", "Lovely family feel, and the kids made the clip.", "2026-09-01"),
  r("rv-06", "khalid-almutairi", { ar: "متجر جوالك", en: "Jawalak Store" }, 5, "شرح واضح ومختصر، ومتابعينه يثقون فيه.", "Clear and short explanations, and his followers trust him.", "2026-08-28"),
  r("rv-07", "maryam-alkuwari", nouf, 5, "تنسيقها راقي ويناسب عملاءنا تمامًا.", "Her styling is elegant and fits our customers perfectly.", "2026-08-26"),
  r("rv-08", "maryam-alkuwari", roastery, 4, "حلو، والتسليم كان قبل الموعد.", "Nice, and delivered ahead of time.", "2026-07-15"),
  r("rv-09", "abdullah-albalushi", { ar: "رحلات وجهة", en: "Wejha Trips" }, 5, "لقطات الطبيعة خيالية.", "Stunning nature shots.", "2026-06-30"),
  r("rv-10", "fatima-aldosari", shifa, 4, "واضحة في الخطوات، ونتمنى إضاءة أقوى المرة الجاية.", "Clear steps. We'd like brighter lighting next time.", "2026-09-05"),
  r("rv-11", "yousef-alhammadi", { ar: "نادي حركة", en: "Haraka Gym" }, 5, "طاقة عالية والتمارين سهلة للمتابعين.", "High energy, and the workouts are easy to follow.", "2026-08-18"),
  r("rv-12", "latifa-alshamsi", roastery, 5, "تحضير القهوة كان أجمل من توقعاتنا.", "The coffee prep was better than we hoped.", "2026-07-22"),
  r("rv-13", "latifa-alshamsi", { ar: "حلويات ريحانة", en: "Rayhana Sweets" }, 5, "تفاصيل حلوة ولقطات قريبة ممتازة.", "Lovely details and great close-ups.", "2026-06-14"),
  r("rv-14", "fahad-alqahtani", { ar: "معدات رحلة", en: "Rihla Outdoor" }, 4, "مغامرة حلوة، والمنتج ظاهر بشكل طبيعي.", "A fun adventure, with the product shown naturally.", "2026-08-08"),
];

export function reviewsOf(creatorId: string): Review[] {
  return reviews.filter((x) => x.creatorId === creatorId).sort((a, b) => b.date.localeCompare(a.date));
}
