import type { Account, Brand, Product } from "./types";

/** Fixed "today" so dummy dates and relative times stay stable on server and client. */
export const DEMO_TODAY = "2026-10-03";
/** The demo's "now": midday in Bahrain on DEMO_TODAY, for things counted in hours (offers expiring). */
export const DEMO_NOW = `${DEMO_TODAY}T12:00:00+03:00`;

export const account: Account = {
  id: "acc-mona",
  name: { ar: "منى الكعبي", en: "Mona Al Kaabi" },
  email: "mona@example.com",
  phone: "+973 3300 0000",
  balance: 40,
};

export const brands: Brand[] = [
  {
    id: "muharraq-roastery",
    name: { ar: "محمصة المحرق", en: "Muharraq Roastery" },
    logo: "/placeholders/logo-roastery.svg",
    industry: "food_beverage",
    about: {
      ar: "محمصة قهوة مختصة في المحرق، نحمّص كل أسبوع ونقدّم القهوة العربية والمختصة.",
      en: "A specialty coffee roastery in Muharraq. We roast weekly and serve Arabic and specialty coffee.",
    },
    website: "https://example.com/roastery",
    instagram: "muharraq.roastery",
    countries: ["bh"],
    registrations: { bh: { crNumber: "123456-1" } },
  },
  {
    id: "nouf-abayas",
    name: { ar: "عبايات نوف", en: "Nouf Abayas" },
    logo: "/placeholders/logo-nouf.svg",
    industry: "fashion",
    about: {
      ar: "متجر عبايات أونلاين بتصاميم محتشمة وأقمشة خفيفة، مع توصيل لكل دول الخليج.",
      en: "An online abaya store with modest designs and light fabrics, delivering across the Gulf.",
    },
    website: "https://example.com/nouf",
    instagram: "nouf.abayas",
    tiktok: "nouf.abayas",
  },
];

export const products: Product[] = [
  {
    id: "ramadan-blend",
    brandId: "muharraq-roastery",
    name: { ar: "خلطة رمضان", en: "Ramadan blend" },
    photos: ["/placeholders/p-ramadan-1.svg", "/placeholders/p-ramadan-2.svg"],
    description: { ar: "قهوة عربية بالهيل والزعفران، كيس 250 غرام.", en: "Arabic coffee with cardamom and saffron, 250 g bag." },
    currency: "BHD",
    pricing: { model: "one_time", amount: 4.5 },
    benefits: ["محمّصة طازجة كل أسبوع", "زعفران أصلي", "تكفي 25 فنجان"],
    concerns: [
      { question: "هل الطعم قوي؟", answer: "متوسط، والهيل واضح بدون ما يغطي على القهوة." },
      { question: "كم تبقى طازجة بعد الفتح؟", answer: "أسبوعين إذا انحفظت في علبة محكمة." },
    ],
    details: { type: "physical", size: "250 غرام" },
  },
  {
    id: "roastery-app",
    brandId: "muharraq-roastery",
    name: { ar: "تطبيق المحمصة", en: "Roastery app" },
    photos: ["/placeholders/p-app-1.svg"],
    currency: "BHD",
    pricing: { model: "free" },
    description: { ar: "اطلب واستلم من الفرع بدون انتظار، واجمع نقاط على كل طلب.", en: "Order ahead, skip the queue, and collect points on every order." },
    benefits: ["استلام بدون انتظار", "نقاط على كل طلب", "عروض للأعضاء"],
    concerns: [{ question: "هل التسجيل مجاني؟", answer: "إيه، والتطبيق مجاني بالكامل." }],
    details: { type: "app", downloadLink: "https://example.com/app", platforms: ["ios", "android"] },
  },
  {
    id: "seef-branch",
    brandId: "muharraq-roastery",
    name: { ar: "فرع السيف", en: "Seef branch" },
    photos: ["/placeholders/p-seef-1.svg", "/placeholders/p-seef-2.svg"],
    currency: "BHD",
    pricing: { model: "per_unit", amount: 3, unit: "person" },
    description: { ar: "فرعنا الجديد في السيف مع جلسات داخلية وخارجية.", en: "Our new Seef branch with indoor and outdoor seating." },
    benefits: ["جلسات خارجية في الشتاء", "مواقف قريبة", "مناسب للعوايل"],
    concerns: [{ question: "هل فيه مكان للعوايل؟" }],
    details: { type: "venue", kind: "cafe", location: "السيف، المنامة", hours: "7 صباحًا – 12 منتصف الليل" },
  },
  {
    id: "linen-abaya",
    brandId: "nouf-abayas",
    name: { ar: "عباية الكتان الصيفية", en: "Summer linen abaya" },
    photos: ["/placeholders/p-linen-1.svg", "/placeholders/p-linen-2.svg", "/placeholders/p-linen-3.svg"],
    description: { ar: "عباية كتان خفيفة بأكمام واسعة، متوفرة بثلاثة ألوان.", en: "A light linen abaya with wide sleeves, in three colours." },
    currency: "BHD",
    pricing: { model: "one_time", amount: 38 },
    benefits: ["قماش يتنفس في الحر", "ما يحتاج كوي", "توصيل خلال يومين"],
    concerns: [
      { question: "هل القماش شفاف؟", answer: "لا، الكتان مزدوج ومبطّن من الأكتاف." },
      { question: "كيف أعرف مقاسي؟", answer: "جدول المقاسات بالطول، والتبديل مجاني." },
    ],
    details: { type: "physical", size: "52–60" },
  },
  {
    id: "evening-abaya",
    brandId: "nouf-abayas",
    name: { ar: "عباية السهرة المطرزة", en: "Embroidered evening abaya" },
    photos: ["/placeholders/p-evening-1.svg"],
    description: { ar: "عباية سهرة بتطريز يدوي للمناسبات والأعراس.", en: "An evening abaya with hand embroidery for weddings and occasions." },
    currency: "BHD",
    pricing: { model: "one_time", amount: 85 },
    benefits: ["تطريز يدوي", "قماش كريب فاخر", "علبة هدية"],
    concerns: [],
    details: { type: "physical", size: "54–60" },
  },
  {
    id: "custom-tailoring",
    brandId: "nouf-abayas",
    name: { ar: "التفصيل حسب المقاس", en: "Made-to-measure tailoring" },
    photos: ["/placeholders/p-tailor-1.svg"],
    description: { ar: "نأخذ المقاسات عن طريق مكالمة فيديو ونفصّل العباية خلال أسبوع.", en: "We take measurements over a video call and tailor the abaya within a week." },
    currency: "BHD",
    pricing: { model: "from", amount: 60 },
    benefits: ["مقاسات عن بعد", "اختيار القماش واللون", "جاهزة خلال أسبوع"],
    concerns: [{ question: "إذا ما ضبط المقاس؟", answer: "نعدّلها مجانًا مرة وحدة." }],
    details: { type: "service", delivery: ["online", "at_home"] },
  },
];

export function getBrand(id: string): Brand | undefined {
  return brands.find((b) => b.id === id);
}

export function productsOf(brandId: string): Product[] {
  return products.filter((p) => p.brandId === brandId);
}

/** Dummy top-ups, in BHD, for the balance history. */
export const walletTopUps: Array<{ id: string; amount: number; date: string }> = [
  { id: "top-0902", amount: 1000, date: "2026-09-02" },
  { id: "top-0701", amount: 1500, date: "2026-07-01" },
];
