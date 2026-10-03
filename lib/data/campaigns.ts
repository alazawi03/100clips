import type { Application, ApplicationStatus, Campaign, Localized } from "./types";

const pitches: Localized[] = [
  { ar: "أقدر أصور التجربة هالأسبوع، وأغلب متابعيني من البحرين.", en: "I can film this week, and most of my followers are in Bahrain." },
  { ar: "صورت لكافيهات قبل، وأحب أبين أجواء المكان من الداخل.", en: "I've filmed cafés before and love showing the space inside." },
  { ar: "أقترح أصور مع أهلي وقت الغبقة عشان يطلع المقطع طبيعي.", en: "I'd film with my family at a ghabga so it feels natural." },
  { ar: "عندي فكرة: من الباب إلى أول رشفة، بدون موسيقى، بس أصوات المكان.", en: "My idea: door to first sip, no music, just the sounds of the place." },
  { ar: "متابعيني يحبون مراجعات الأكل الصادقة، وبكون واضح ومختصر.", en: "My followers like honest food reviews. I'll keep it clear and short." },
  { ar: "أقدر أسلم المقطع خلال 5 أيام مع ترجمة نصية.", en: "I can deliver within 5 days, with captions." },
  { ar: "أحب أعرض المنتج كهدية للأهل، بأسلوب هادي ومرتب.", en: "I'd show it as a gift for family, in a calm, tidy style." },
];

function app(creatorId: string, status: ApplicationStatus, pitch: number, appliedAt: string): Application {
  return { creatorId, status, pitch: pitches[pitch % pitches.length], appliedAt };
}

export const campaigns: Campaign[] = [
  {
    id: "seef-branch",
    productId: "seef-branch",
    brandId: "muharraq-roastery",
    title: { ar: "افتتاح فرع السيف", en: "Seef branch opening" },
    brief: {
      ar: "زوروا فرعنا الجديد في السيف، جربوا مشروب واحد من القائمة، وصوروا تجربتكم من الباب إلى أول رشفة.",
      en: "Visit our new Seef branch, try one drink from the menu, and film your visit from the door to the first sip.",
    },
    niche: "food",
    clipsCount: 6,
    budget: 270,
    status: "in_progress",
    applications: [
      app("sultan-alotaibi", "accepted", 4, "2026-09-12"),
      app("reem-alhashimi", "accepted", 2, "2026-09-12"),
      app("latifa-alshamsi", "accepted", 1, "2026-09-13"),
      app("yousef-alhammadi", "accepted", 5, "2026-09-14"),
      app("ahmed-bujeiri", "pending", 0, "2026-09-29"),
      app("hessa-alajmi", "pending", 6, "2026-10-01"),
    ],
    deliveredClips: 2,
  },
  {
    id: "ramadan-blend",
    productId: "ramadan-blend",
    brandId: "muharraq-roastery",
    title: { ar: "إطلاق خلطة رمضان", en: "Ramadan blend launch" },
    brief: {
      ar: "قدموا خلطة رمضان في جلسة الفطور أو الغبقة. نبي أجواء عائلية دافية، والقهوة في يد الضيف.",
      en: "Feature the Ramadan blend at iftar or a ghabga gathering. Warm family moments, with the coffee in a guest's hand.",
    },
    niche: "family",
    clipsCount: 10,
    budget: 450,
    status: "open",
    applications: [
      app("reem-alhashimi", "pending", 2, "2026-09-26"),
      app("hessa-alajmi", "pending", 6, "2026-09-27"),
      app("latifa-alshamsi", "pending", 1, "2026-09-28"),
      app("noura-alkaabi", "pending", 5, "2026-09-30"),
      app("maryam-alkuwari", "pending", 6, "2026-10-01"),
      app("fatima-aldosari", "pending", 0, "2026-10-02"),
      app("abdullah-albalushi", "pending", 3, "2026-10-02"),
    ],
    deliveredClips: 0,
  },
  {
    id: "national-day",
    productId: "ramadan-blend",
    brandId: "muharraq-roastery",
    title: { ar: "هدايا العيد الوطني", en: "National Day gift boxes" },
    brief: {
      ar: "افتحوا صندوق هدايا العيد الوطني البحريني وورونا وش فيه، ولمن بتهدونه.",
      en: "Unbox the Bahrain National Day gift box, show what is inside, and who you would give it to.",
    },
    niche: "family",
    clipsCount: 5,
    budget: 225,
    status: "open",
    applications: [app("ahmed-bujeiri", "pending", 0, "2026-10-01"), app("reem-alhashimi", "pending", 6, "2026-10-02")],
    deliveredClips: 0,
  },
  {
    id: "iced-summer",
    productId: "ramadan-blend",
    brandId: "muharraq-roastery",
    title: { ar: "قهوة الصيف الباردة", en: "Iced summer coffee" },
    brief: {
      ar: "قهوة باردة في يوم حار. صوروا المشروب في السيارة أو على البحر.",
      en: "Iced coffee on a hot day. Film the drink in the car or by the sea.",
    },
    niche: "food",
    clipsCount: 8,
    budget: 320,
    status: "completed",
    applications: [
      app("sultan-alotaibi", "accepted", 4, "2026-07-10"),
      app("yousef-alhammadi", "accepted", 5, "2026-07-10"),
      app("fahad-alqahtani", "accepted", 0, "2026-07-11"),
      app("latifa-alshamsi", "accepted", 1, "2026-07-12"),
    ],
    deliveredClips: 8,
  },
  {
    id: "winter-offers",
    productId: "roastery-app",
    brandId: "muharraq-roastery",
    title: { ar: "عروض الشتاء", en: "Winter offers" },
    brief: {
      ar: "مشروبات الشتاء الحارة في جلسة برا مع الأهل أو الربع.",
      en: "Hot winter drinks at an outdoor gathering with family or friends.",
    },
    niche: "food",
    clipsCount: 4,
    budget: 160,
    status: "draft",
    applications: [],
    deliveredClips: 0,
  },
  {
    id: "winter-collection",
    productId: "evening-abaya",
    brandId: "nouf-abayas",
    title: { ar: "تشكيلة الشتاء", en: "Winter collection" },
    brief: {
      ar: "ورّونا عباية من تشكيلة الشتاء في طلعة عائلية أو عزيمة، مع لقطة قريبة للقماش والتطريز.",
      en: "Show an abaya from the winter collection at a family outing or dinner, with a close-up of the fabric and embroidery.",
    },
    niche: "fashion",
    clipsCount: 3,
    budget: 195,
    status: "in_progress",
    applications: [
      app("maryam-alkuwari", "accepted", 6, "2026-09-20"),
      app("noura-alkaabi", "accepted", 5, "2026-09-21"),
      app("fatima-aldosari", "pending", 0, "2026-10-01"),
    ],
    deliveredClips: 1,
  },
];

export function getCampaign(id: string): Campaign | undefined {
  return campaigns.find((c) => c.id === id);
}
