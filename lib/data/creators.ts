import { isActiveMarket } from "./markets";
import { isSuspended } from "./moderation";
import type { Creator } from "./types";

export const creators: Creator[] = [
  {
    id: "noura-alkaabi",
    name: { ar: "نورة الكعبي", en: "Noura Al Kaabi" },
    handle: "noura.kaabi",
    country: "BH",
    instagram: "noura.kaabi",
    tiktok: "noura.kaabi",
    showsFace: true,
    portfolio: [
      { id: "pf-noura-1", videoSrc: "/clips/sample-1.mp4" },
      { id: "pf-noura-2", videoSrc: "/clips/sample-2.mp4" },
    ],
    city: { ar: "الرفاع", en: "Riffa" },
    gender: "female",
    niches: ["beauty", "fashion"],
    formats: [{ format: "tiktok_video", price: 60 }, { format: "instagram_reel", price: 65 }, { format: "instagram_story", price: 36 }],
    rating: 4.9,
    completedOrders: 128,
    bio: {
      ar: "أصوّر روتيني اليومي بصدق، وأحب المنتجات اللي أقدر أجربها قدام الكاميرا.",
      en: "I film my daily routine honestly and love products I can try on camera.",
    },
    hasNewClips: true,
  },
  {
    id: "sultan-alotaibi",
    name: { ar: "سلطان العتيبي", en: "Sultan Al Otaibi" },
    handle: "sultan.eats",
    country: "BH",
    city: { ar: "المنامة", en: "Manama" },
    gender: "male",
    showsFace: true,
    niches: ["food"],
    formats: [{ format: "tiktok_video", price: 45 }, { format: "instagram_reel", price: 50 }],
    rating: 4.8,
    completedOrders: 96,
    bio: {
      ar: "أجرب المطاعم والكافيهات الجديدة في البحرين وأعطيكم الزبدة في 30 ثانية.",
      en: "I try new restaurants and cafés in Bahrain and give you the verdict in 30 seconds.",
    },
    hasNewClips: true,
  },
  {
    id: "reem-alhashimi",
    name: { ar: "ريم الهاشمي", en: "Reem Al Hashimi" },
    handle: "reem.home",
    country: "BH",
    city: { ar: "مدينة عيسى", en: "Isa Town" },
    gender: "female",
    showsFace: true,
    niches: ["general", "family", "food"],
    formats: [{ format: "instagram_reel", price: 40 }, { format: "instagram_story", price: 21 }],
    rating: 4.7,
    completedOrders: 54,
    bio: {
      ar: "أم لثلاثة، أشارك وصفات سريعة وتجارب منتجات البيت.",
      en: "Mum of three sharing quick recipes and home product reviews.",
    },
    hasNewClips: false,
  },
  {
    id: "khalid-almutairi",
    name: { ar: "خالد المطيري", en: "Khalid Al Mutairi" },
    handle: "khalid.tech",
    country: "BH",
    city: { ar: "الجفير", en: "Juffair" },
    gender: "male",
    showsFace: false,
    niches: ["tech"],
    formats: [{ format: "tiktok_video", price: 55 }, { format: "instagram_reel", price: 60 }],
    rating: 4.9,
    completedOrders: 73,
    bio: {
      ar: "مراجعات أجهزة وتطبيقات بلهجة بحرينية وبدون مبالغة.",
      en: "Gadget and app reviews in Bahraini dialect, no hype.",
    },
    hasNewClips: false,
  },
  {
    id: "maryam-alkuwari",
    name: { ar: "مريم الكواري", en: "Maryam Al Kuwari" },
    handle: "maryam.style",
    country: "BH",
    city: { ar: "السيف", en: "Seef" },
    gender: "female",
    showsFace: true,
    niches: ["fashion", "beauty"],
    formats: [{ format: "instagram_reel", price: 75 }, { format: "instagram_story", price: 42 }],
    rating: 4.8,
    completedOrders: 112,
    bio: {
      ar: "تنسيقات محتشمة وأنيقة لكل مناسبة.",
      en: "Modest, elegant outfits for every occasion.",
    },
    hasNewClips: true,
  },
  {
    id: "abdullah-albalushi",
    name: { ar: "عبدالله البلوشي", en: "Abdullah Al Balushi" },
    handle: "abdullah.travels",
    country: "BH",
    city: { ar: "الزلاق", en: "Zallaq" },
    gender: "male",
    showsFace: true,
    niches: ["travel"],
    formats: [{ format: "tiktok_video", price: 40 }],
    rating: 4.6,
    completedOrders: 41,
    bio: {
      ar: "أماكن في البحرين ما تعرفونها، مع نصايح للعوايل.",
      en: "Hidden spots in Bahrain, with tips for families.",
    },
    hasNewClips: false,
  },
  {
    id: "fatima-aldosari",
    name: { ar: "فاطمة الدوسري", en: "Fatima Al Dosari" },
    handle: "fatima.glow",
    country: "BH",
    city: { ar: "سترة", en: "Sitra" },
    gender: "female",
    showsFace: false,
    niches: ["beauty"],
    formats: [{ format: "tiktok_video", price: 38 }, { format: "instagram_reel", price: 43 }, { format: "instagram_story", price: 23 }],
    rating: 4.7,
    completedOrders: 67,
    bio: {
      ar: "عناية بالبشرة بخطوات بسيطة ومنتجات من السوق.",
      en: "Simple skincare steps with products you can actually find.",
    },
    hasNewClips: false,
  },
  {
    id: "yousef-alhammadi",
    name: { ar: "يوسف الحمادي", en: "Yousef Al Hammadi" },
    handle: "yousef.moves",
    country: "BH",
    city: { ar: "مدينة حمد", en: "Hamad Town" },
    gender: "male",
    showsFace: true,
    niches: ["fitness"],
    formats: [{ format: "tiktok_video", price: 50 }, { format: "instagram_reel", price: 55 }],
    rating: 4.8,
    completedOrders: 88,
    bio: {
      ar: "تمارين قصيرة تقدر تسويها في البيت أو المكتب.",
      en: "Short workouts you can do at home or at the office.",
    },
    hasNewClips: true,
  },
  {
    id: "hessa-alajmi",
    name: { ar: "حصة العجمي", en: "Hessa Al Ajmi" },
    handle: "hessa.family",
    country: "BH",
    city: { ar: "عالي", en: "A'ali" },
    gender: "female",
    showsFace: true,
    niches: ["family"],
    formats: [{ format: "instagram_reel", price: 47 }, { format: "instagram_story", price: 25 }],
    completedOrders: 0,
    bio: {
      ar: "يومياتنا كعائلة بحرينية، وتجارب منتجات الأطفال.",
      en: "Daily life of a Bahraini family and kids' product reviews.",
    },
    hasNewClips: false,
  },
  {
    id: "ahmed-bujeiri",
    name: { ar: "أحمد بوجيري", en: "Ahmed Bujeiri" },
    handle: "ahmed.plays",
    country: "BH",
    city: { ar: "المحرق", en: "Muharraq" },
    gender: "male",
    showsFace: false,
    niches: ["gaming", "tech"],
    formats: [{ format: "tiktok_video", price: 30 }],
    completedOrders: 0,
    bio: {
      ar: "ألعاب وإكسسوارات بأسعار معقولة للاعبين في البحرين.",
      en: "Games and affordable gear for players in Bahrain.",
    },
    hasNewClips: false,
  },
  {
    id: "latifa-alshamsi",
    name: { ar: "لطيفة الشامسي", en: "Latifa Al Shamsi" },
    handle: "latifa.kitchen",
    country: "BH",
    city: { ar: "البديع", en: "Budaiya" },
    gender: "female",
    showsFace: true,
    niches: ["food"],
    formats: [{ format: "tiktok_video", price: 48 }, { format: "instagram_reel", price: 53 }, { format: "instagram_story", price: 29 }],
    rating: 4.8,
    completedOrders: 77,
    bio: {
      ar: "قهوة وحلويات بحرينية بلمسة جديدة.",
      en: "Bahraini coffee and sweets with a modern twist.",
    },
    hasNewClips: true,
  },
  {
    id: "fahad-alqahtani",
    name: { ar: "فهد القحطاني", en: "Fahad Al Qahtani" },
    handle: "fahad.outdoors",
    country: "BH",
    city: { ar: "سار", en: "Saar" },
    gender: "male",
    niches: ["general", "travel", "fitness"],
    formats: [{ format: "tiktok_video", price: 52 }, { format: "instagram_reel", price: 57 }],
    rating: 4.7,
    completedOrders: 64,
    bio: {
      ar: "كشتات ومغامرات في البر والبحر حول البحرين.",
      en: "Desert trips and sea adventures around Bahrain.",
    },
    hasNewClips: false,
  },
  // Signed up from Riyadh: on the waitlist, so brands don't see her until 100clips launches in Saudi Arabia.
  {
    id: "reem-alotaibi",
    name: { ar: "ريم العتيبي", en: "Reem Al Otaibi" },
    handle: "reem.cooks",
    country: "SA",
    city: { ar: "الرياض", en: "Riyadh" },
    gender: "female",
    showsFace: false,
    niches: ["food", "family"],
    formats: [{ format: "tiktok_video", price: 40 }, { format: "instagram_reel", price: 45 }],
    completedOrders: 0,
    bio: { ar: "وصفات بيتية سريعة لأيام الدوام.", en: "Quick home recipes for workdays." },
    hasNewClips: false,
  },
];

/** The lowest price this creator charges for one clip, in BHD. */
export function fromPrice(creator: Creator): number {
  return Math.min(...creator.formats.map((f) => f.price));
}

/** Creators brands can find and book: live (approved by 100clips), not suspended, and in a market we run in. */
export function bookableCreators(): Creator[] {
  return creators.filter((c) => !isSuspended("creator", c.id) && isActiveMarket(c.country));
}

export const isBookable = (id: string) => {
  const c = getCreator(id);
  return !!c && !isSuspended("creator", id) && isActiveMarket(c.country);
};

export function getCreator(id: string): Creator | undefined {
  return creators.find((c) => c.id === id);
}
