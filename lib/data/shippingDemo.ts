import type { Localized, Order, OrderStatus, OrderShipping, ShipTo } from "./types";

/*
 * Sample products for the Shipping page, shown only while the account has no physical products to ship,
 * so the page can be seen with something in every tab. Dates count back from today so they never go stale.
 */

export type DemoShipment = {
  order: Order;
  creator: Localized;
  product: Localized;
  /** The creator sends the product back after filming. */
  returns: boolean;
};

const daysAgo = (today: string, days: number) => {
  const d = new Date(`${today}T09:30:00+03:00`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
};

type Sample = {
  creator: Localized;
  product: Localized;
  campaign: Localized;
  returns: boolean;
  status: OrderStatus;
  /** Days ago each step happened. */
  accepted: number;
  sent?: number;
  received?: number;
  returned?: number;
  note?: string;
  shipTo?: ShipTo;
};

const abaya: Localized = { ar: "عباية سهرة مطرّزة", en: "Embroidered evening abaya" };
const linen: Localized = { ar: "عباية كتان صيفية", en: "Summer linen abaya" };
const serum: Localized = { ar: "سيروم فيتامين سي", en: "Vitamin C serum" };
const beans: Localized = { ar: "حبوب قهوة إثيوبية ٢٥٠ غ", en: "Ethiopian coffee beans 250 g" };
const headphones: Localized = { ar: "سماعات لاسلكية", en: "Wireless headphones" };

const winter: Localized = { ar: "تشكيلة الشتاء", en: "Winter collection" };
const summer: Localized = { ar: "تشكيلة الصيف", en: "Summer collection" };
const glow: Localized = { ar: "روتين النضارة", en: "Glow routine" };
const roast: Localized = { ar: "محمصة الموسم", en: "Roast of the season" };
const sound: Localized = { ar: "صوت بلا أسلاك", en: "Sound, no wires" };

const samples: Sample[] = [
  // To send
  {
    creator: { ar: "نورة الكعبي", en: "Noura Al Kaabi" },
    product: abaya,
    campaign: winter,
    returns: true,
    status: "in_progress",
    accepted: 3,
    shipTo: { type: "home", address: "Villa 214, Road 4115, Block 941\nRiffa, Bahrain", phone: "+973 3300 1122", latitude: 26.13, longitude: 50.555 },
  },
  {
    creator: { ar: "مريم الكواري", en: "Maryam Al Kuwari" },
    product: serum,
    campaign: glow,
    returns: false,
    status: "in_progress",
    accepted: 1,
    shipTo: { type: "home", address: "Flat 32, Building 1450, Road 4626\nSeef, Manama, Bahrain", phone: "+973 3611 4455", latitude: 26.2335, longitude: 50.5316 },
  },
  {
    creator: { ar: "يوسف الحمادي", en: "Yousef Al Hammadi" },
    product: headphones,
    campaign: sound,
    returns: true,
    status: "in_progress",
    accepted: 0,
    shipTo: { type: "home", address: "House 88, Road 2803, Block 428\nJuffair, Manama, Bahrain", phone: "+973 3988 7766", latitude: 26.2125, longitude: 50.6045 },
  },
  // On the way
  {
    creator: { ar: "سلطان العتيبي", en: "Sultan Al Otaibi" },
    product: beans,
    campaign: roast,
    returns: false,
    status: "in_progress",
    accepted: 4,
    sent: 2,
    note: "Aramex AWB 4471 2290 18",
  },
  {
    creator: { ar: "ريم الهاشمي", en: "Reem Al Hashimi" },
    product: linen,
    campaign: summer,
    returns: true,
    status: "in_progress",
    accepted: 2,
    sent: 0,
    note: "Our driver delivers it this evening.",
  },
  // With creators
  {
    creator: { ar: "فاطمة الدوسري", en: "Fatima Al Dosari" },
    product: abaya,
    campaign: winter,
    returns: true,
    status: "approved",
    accepted: 12,
    sent: 10,
    received: 9,
  },
  {
    creator: { ar: "خالد المطيري", en: "Khalid Al Mutairi" },
    product: headphones,
    campaign: sound,
    returns: true,
    status: "in_progress",
    accepted: 8,
    sent: 7,
    received: 5,
  },
  {
    creator: { ar: "حصة العجمي", en: "Hessa Al Ajmi" },
    product: linen,
    campaign: summer,
    returns: true,
    status: "delivered",
    accepted: 9,
    sent: 8,
    received: 6,
  },
  // Picked up
  {
    creator: { ar: "لطيفة الشامسي", en: "Latifa Al Shamsi" },
    product: abaya,
    campaign: winter,
    returns: true,
    status: "approved",
    accepted: 24,
    sent: 22,
    received: 21,
    returned: 4,
  },
  {
    creator: { ar: "أحمد بوجيري", en: "Ahmed Bujeiri" },
    product: headphones,
    campaign: sound,
    returns: true,
    status: "approved",
    accepted: 30,
    sent: 28,
    received: 27,
    returned: 11,
  },
];

export function demoShipments(today: string): DemoShipment[] {
  return samples.map((s, i) => {
    const at = (days?: number) => (days === undefined ? undefined : daysAgo(today, days));
    const shipping: OrderShipping = { sentAt: at(s.sent), note: s.note, receivedAt: at(s.received), returnedAt: at(s.returned) };
    const order: Order = {
      id: `demo-shipment-${i + 1}`,
      number: 2101 + i,
      brandId: "demo",
      source: "campaign",
      creatorId: `demo-creator-${i + 1}`,
      title: s.campaign,
      items: [{ format: "tiktok_video", quantity: 1, price: 45 }],
      clips: 1,
      amount: 45,
      status: s.status,
      createdAt: at(s.accepted)!.slice(0, 10),
      events: [{ type: "accepted", at: at(s.accepted)! }],
      shipping: s.sent === undefined ? undefined : shipping,
      shipTo: s.shipTo,
    };
    return { order, creator: s.creator, product: s.product, returns: s.returns };
  });
}
