import type { Order } from "@/lib/data/types";

/*
 * 100clips' revenue: brands pay each creator's price plus a service fee on top. Creators get their
 * full price. A declined, expired or cancelled offer refunds the fee too, so the fee only counts as
 * revenue once the clip is approved.
 */

export const SERVICE_FEE_RATE = 0.1;

/** BHD has 3 decimals (fils). */
const fils = (n: number) => Math.round(n * 1000) / 1000;

/** The service fee on top of what creators are paid, in BHD. */
export function serviceFee(creatorsTotal: number): number {
  return fils(creatorsTotal * SERVICE_FEE_RATE);
}

/** What the brand pays for creators costing `creatorsTotal`: their prices plus the fee. */
export function withFee(creatorsTotal: number): number {
  return fils(creatorsTotal + serviceFee(creatorsTotal));
}

/**
 * A creator's price as brands see it: with the service fee already in. Brands never see the fee on its
 * own; every price, total and refund they see includes it.
 */
export const priceForBrand = (creatorPrice: number) => withFee(creatorPrice);

/** The fee charged on this order. Orders from before the fee was stored get it worked out. */
export function feeOf(order: Order): number {
  return order.fee ?? serviceFee(order.amount);
}

/** What the brand paid for this order (the creator's pay plus the fee). */
export function brandPaid(order: Order): number {
  return fils(order.amount + feeOf(order));
}
