import { cookies } from "next/headers";
import { brands, getBrand } from "@/lib/data/account";
import type { Brand } from "@/lib/data/types";

export const BRAND_COOKIE = "brand";

/** The brand selected in the header switcher. Everything on screen belongs to it. */
export async function getCurrentBrand(): Promise<Brand> {
  const id = (await cookies()).get(BRAND_COOKIE)?.value;
  return (id && getBrand(id)) || brands[0];
}
