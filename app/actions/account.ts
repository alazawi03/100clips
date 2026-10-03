"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getBrand } from "@/lib/data/account";
import { BRAND_COOKIE } from "@/lib/currentBrand";

export async function selectBrand(brandId: string) {
  if (!getBrand(brandId)) return;
  (await cookies()).set(BRAND_COOKIE, brandId, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
