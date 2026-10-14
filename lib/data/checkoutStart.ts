import { cookies } from "next/headers";

/**
 * What checkout starts with after "Find creators for this product": the brand and product, kept in
 * a cookie for the browsing in between (per browser, never shared between accounts).
 */
export type CheckoutStart = { brandId: string; productId?: string };

const COOKIE = "100clips-checkout-start";

export async function getCheckoutStart(): Promise<CheckoutStart | undefined> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as CheckoutStart;
    return typeof value.brandId === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** From Server Actions only (cookies can't change while a page renders). */
export async function setCheckoutStart(value: CheckoutStart | undefined) {
  const jar = await cookies();
  if (value) jar.set(COOKIE, JSON.stringify(value), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  else jar.delete(COOKIE);
}
