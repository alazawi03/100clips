import type { Clip, Localized, Niche } from "./types";

const videos = ["/clips/sample-1.mp4", "/clips/sample-2.mp4", "/clips/sample-3.mp4"];

const roastery = { ar: "محمصة المحرق", en: "Muharraq Roastery" };
const nouf = { ar: "عبايات نوف", en: "Nouf Abayas" };
const shifa = { ar: "صيدلية الشفاء", en: "Al Shifa Pharmacy" };

/** The brand each finished clip was made for. */
const madeFor: Record<string, Localized> = {
  "clip-01": roastery, "clip-02": roastery, "clip-03": roastery, "clip-04": roastery,
  "clip-05": roastery, "clip-06": roastery, "clip-07": roastery, "clip-08": roastery,
  "clip-09": shifa, "clip-10": { ar: "عطور الندى", en: "Al Nada Perfumes" },
  "clip-11": { ar: "برجر الحي", en: "Al Hay Burger" },
  "clip-12": { ar: "أسواق المنزل", en: "Al Manzil Market" }, "clip-13": { ar: "أسواق المنزل", en: "Al Manzil Market" },
  "clip-14": { ar: "متجر جوالك", en: "Jawalak Store" }, "clip-15": { ar: "متجر جوالك", en: "Jawalak Store" }, "clip-16": { ar: "متجر جوالك", en: "Jawalak Store" },
  "clip-17": nouf, "clip-18": nouf,
  "clip-19": { ar: "رحلات وجهة", en: "Wejha Trips" }, "clip-20": { ar: "رحلات وجهة", en: "Wejha Trips" }, "clip-21": { ar: "رحلات وجهة", en: "Wejha Trips" },
  "clip-22": shifa, "clip-23": shifa, "clip-24": shifa,
  "clip-25": { ar: "نادي حركة", en: "Haraka Gym" }, "clip-26": { ar: "نادي حركة", en: "Haraka Gym" },
  "clip-33": { ar: "حلويات ريحانة", en: "Rayhana Sweets" },
  "clip-34": { ar: "معدات رحلة", en: "Rihla Outdoor" }, "clip-35": { ar: "معدات رحلة", en: "Rihla Outdoor" }, "clip-36": { ar: "معدات رحلة", en: "Rihla Outdoor" },
};

function clip(id: string, creatorId: string, ar: string, en: string, durationSec: number, views: number, from: number, to: number, niche: Niche): Clip {
  const n = Number(id.replace(/\D/g, "")) || 0;
  return { id, creatorId, brand: madeFor[id], title: { ar, en }, durationSec, views, poster: { from, to, niche }, videoSrc: videos[n % videos.length] };
}

/** Finished work, newest first per creator. clip-01 to clip-08 and clip-17/18 are also attached to orders. */
export const clips: Clip[] = [
  clip("clip-01", "latifa-alshamsi", "قهوة الصباح مع تمر خلاص", "Morning coffee with khalas dates", 28, 12400, 28, 12, "food"),
  clip("clip-02", "sultan-alotaibi", "جربت فرعكم الجديد في السيف", "I tried your new Seef branch", 45, 3100, 20, 345, "food"),
  clip("clip-03", "reem-alhashimi", "قهوة العصرية مع العيال", "Afternoon coffee with the kids", 32, 1800, 38, 18, "family"),
  clip("clip-04", "noura-alkaabi", "روتيني قبل الدوام", "My routine before work", 38, 22600, 330, 290, "beauty"),
  clip("clip-05", "yousef-alhammadi", "كوب قهوة بعد التمرين", "A cup of coffee after training", 24, 5600, 190, 160, "fitness"),
  clip("clip-06", "maryam-alkuwari", "إطلالة لقعدة القهوة", "An outfit for coffee with friends", 30, 9800, 300, 260, "fashion"),
  clip("clip-07", "sultan-alotaibi", "قهوة باردة بالهيل", "Iced cardamom coffee", 22, 15100, 200, 28, "food"),
  clip("clip-08", "latifa-alshamsi", "طريقة تحضير القهوة العربية", "How to make Arabic coffee", 52, 31200, 40, 20, "food"),

  clip("clip-09", "noura-alkaabi", "مكياج خفيف للدوام", "Light makeup for work", 41, 18200, 350, 310, "beauty"),
  clip("clip-10", "noura-alkaabi", "عطري المفضل للصيف", "My summer perfume pick", 26, 9400, 20, 330, "beauty"),
  clip("clip-11", "sultan-alotaibi", "أطيب برجر في المنامة؟", "Best burger in Manama?", 34, 27800, 30, 0, "food"),
  clip("clip-12", "reem-alhashimi", "فطور سريع للعيال", "Quick breakfast for the kids", 29, 4100, 60, 30, "family"),
  clip("clip-13", "reem-alhashimi", "ترتيب مطبخي", "Organising my kitchen", 47, 2600, 150, 110, "family"),
  clip("clip-14", "khalid-almutairi", "تجربة سماعات جديدة", "Testing new earbuds", 39, 14300, 240, 210, "tech"),
  clip("clip-15", "khalid-almutairi", "تطبيق يوفر عليك وقت", "An app that saves you time", 31, 8700, 220, 260, "tech"),
  clip("clip-16", "khalid-almutairi", "جوال بأقل من 100 دينار", "A phone under 100 dinars", 44, 21500, 200, 240, "tech"),
  clip("clip-17", "maryam-alkuwari", "عباية للعيد", "An abaya for Eid", 36, 16900, 280, 320, "fashion"),
  clip("clip-18", "maryam-alkuwari", "ثلاث إطلالات بشنطة وحدة", "Three looks, one bag", 42, 11200, 310, 270, "fashion"),
  clip("clip-19", "abdullah-albalushi", "شروق في جزر حوار", "Sunrise at the Hawar Islands", 33, 7600, 180, 210, "travel"),
  clip("clip-20", "abdullah-albalushi", "مخيم في الصخير", "Camping in Sakhir", 48, 5200, 45, 20, "travel"),
  clip("clip-21", "abdullah-albalushi", "أكل شعبي في سوق المنامة", "Street food in Manama souq", 37, 6100, 25, 200, "travel"),
  clip("clip-22", "fatima-aldosari", "روتين ترطيب بخطوتين", "Two-step moisturising routine", 27, 10300, 340, 20, "beauty"),
  clip("clip-23", "fatima-aldosari", "واقي شمس للبشرة الدهنية", "Sunscreen for oily skin", 35, 8800, 50, 340, "beauty"),
  clip("clip-24", "fatima-aldosari", "منتجات تحت 5 دنانير", "Products under 5 dinars", 40, 13700, 320, 350, "beauty"),
  clip("clip-25", "yousef-alhammadi", "تمرين 10 دقايق في المكتب", "A 10-minute office workout", 30, 9900, 160, 200, "fitness"),
  clip("clip-26", "yousef-alhammadi", "سناك صحي قبل الجيم", "A healthy pre-gym snack", 23, 4700, 120, 170, "fitness"),
  clip("clip-33", "latifa-alshamsi", "حلا الزعفران", "Saffron dessert", 31, 19800, 50, 30, "food"),
  clip("clip-34", "fahad-alqahtani", "مشي عند شجرة الحياة", "A walk to the Tree of Life", 44, 8200, 30, 150, "travel"),
  clip("clip-35", "fahad-alqahtani", "كشتة نهاية الأسبوع", "Weekend desert trip", 50, 11500, 40, 15, "travel"),
  clip("clip-36", "fahad-alqahtani", "تمرين قبل الرحلة", "Warm-up before a hike", 25, 3900, 140, 190, "fitness"),
];

export function getClip(id: string): Clip | undefined {
  return clips.find((c) => c.id === id);
}

export function clipsByCreator(creatorId: string): Clip[] {
  return clips.filter((c) => c.creatorId === creatorId);
}
