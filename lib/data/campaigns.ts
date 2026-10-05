import type { Campaign } from "./types";

export const campaigns: Campaign[] = [
  {
    id: "seef-branch",
    productIds: ["seef-branch"],
    brandId: "muharraq-roastery",
    title: { ar: "افتتاح فرع السيف", en: "Seef branch opening" },
    brief: {
      ar: "زوروا فرعنا الجديد في السيف، جربوا مشروب واحد من القائمة، وصوروا تجربتكم من الباب إلى أول رشفة.",
      en: "Visit our new Seef branch, try one drink from the menu, and film your visit from the door to the first sip.",
    },
    niche: "food",
    clipsCount: 6,
    budget: 270,
    videoStyle: "routine",
    deadline: "2026-10-25",
    createdAt: "2026-09-12",
    keyMessage: "فرعنا الجديد في السيف مفتوح من الصبح لين آخر الليل.",
    references: ["https://www.tiktok.com/@muharraq.roastery/video/7400000000000000001", "https://www.instagram.com/reel/C9AbCdEfGhI/"],
    mustInclude: "#فرع_السيف، @muharraq.roastery، لقطة للّوحة عند الباب",
    avoid: "لا تصوّرون الزبائن بدون إذنهم.",
    status: "in_progress",
    deliveredClips: 2,
  },
  {
    id: "iced-summer",
    productIds: ["ramadan-blend"],
    brandId: "muharraq-roastery",
    title: { ar: "قهوة الصيف الباردة", en: "Iced summer coffee" },
    brief: {
      ar: "قهوة باردة في يوم حار. صوروا المشروب في السيارة أو على البحر.",
      en: "Iced coffee on a hot day. Film the drink in the car or by the sea.",
    },
    niche: "food",
    clipsCount: 8,
    budget: 320,
    createdAt: "2026-07-18",
    status: "completed",
    deliveredClips: 8,
  },
  {
    id: "winter-collection",
    productIds: ["evening-abaya"],
    brandId: "nouf-abayas",
    title: { ar: "تشكيلة الشتاء", en: "Winter collection" },
    brief: {
      ar: "ورّونا عباية من تشكيلة الشتاء في طلعة عائلية أو عزيمة، مع لقطة قريبة للقماش والتطريز.",
      en: "Show an abaya from the winter collection at a family outing or dinner, with a close-up of the fabric and embroidery.",
    },
    niche: "fashion",
    clipsCount: 3,
    budget: 195,
    videoStyle: "routine",
    deadline: "2026-10-02",
    createdAt: "2026-09-20",
    logistics: { "evening-abaya": { type: "physical", after: "return" } },
    status: "in_progress",
    deliveredClips: 1,
  },
];

export function getCampaign(id: string): Campaign | undefined {
  return campaigns.find((c) => c.id === id);
}
