"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as store from "@/lib/data/brandsStore";
import {
  APP_PLATFORMS,
  INDUSTRIES,
  PRODUCT_TYPES,
  SERVICE_DELIVERIES,
  VENUE_KINDS,
  type AppPlatform,
  type Brand,
  type Industry,
  type Product,
  type ProductDetails,
  type ProductType,
  type ServiceDelivery,
  type VenueKind,
} from "@/lib/data/types";
import { BRAND_COOKIE, getCurrentBrand } from "@/lib/currentBrand";
import type { MessageKey } from "@/lib/i18n/messages";

/** errors: field → translation key. values: what was sent, so the form can show it again. */
export type BrandFormState = { errors: Partial<Record<string, MessageKey>>; values: Record<string, string | string[]> } | null;

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function all(form: FormData, name: string) {
  return form.getAll(name).map((v) => String(v).trim());
}

function submitted(form: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    if (key.startsWith("$")) continue;
    const list = all(form, key);
    values[key] = list.length > 1 || ["benefit", "concernQ", "concernA", "photo", "platforms", "delivery"].includes(key) ? list : list[0];
  }
  return values;
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Images arrive as resized data URLs from the browser, or as existing placeholder paths. */
function isImage(value: string) {
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) || /^\/placeholders\/[\w-]+\.svg$/.test(value);
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** "example.com" → "https://example.com"; anything with a scheme is left as typed. */
function withScheme(value: string) {
  return value && !/^[a-z]+:\/\//i.test(value) && /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(value) ? `https://${value}` : value;
}

/** "@nouf.abayas", "nouf.abayas" or a profile link → "nouf.abayas". */
function handle(value: string): string | null {
  if (!value) return "";
  const fromUrl = isUrl(value) ? new URL(value).pathname.split("/").filter(Boolean).at(-1) ?? "" : value;
  const clean = fromUrl.replace(/^@/, "");
  return /^[\w.]{1,30}$/.test(clean) ? clean : null;
}

/** Typed text is the same in both languages until there is a translation step. */
function same(value: string) {
  return { ar: value, en: value };
}

function parseBrand(form: FormData): { brand?: Omit<Brand, "id">; errors: NonNullable<BrandFormState>["errors"] } {
  const errors: NonNullable<BrandFormState>["errors"] = {};
  const nameAr = text(form, "nameAr");
  const nameEn = text(form, "nameEn");
  const logo = text(form, "logo");
  const cover = text(form, "cover");
  const industry = oneOf<Industry>(text(form, "industry"), INDUSTRIES);
  const city = text(form, "city");
  const about = text(form, "about");
  const website = withScheme(text(form, "website"));
  const instagram = handle(text(form, "instagram"));
  const tiktok = handle(text(form, "tiktok"));
  const crNumber = text(form, "crNumber");

  if (!nameAr && !nameEn) errors.nameAr = "forms.errors.brandNameRequired";
  if (logo && !isImage(logo)) errors.logo = "forms.errors.imageType";
  if (!industry) errors.industry = "forms.errors.industryRequired";
  if (about.length > 300) errors.about = "forms.errors.aboutTooLong";
  if (website && !isUrl(website)) errors.website = "forms.errors.urlInvalid";
  if (instagram === null) errors.instagram = "forms.errors.handleInvalid";
  if (tiktok === null) errors.tiktok = "forms.errors.handleInvalid";
  if (cover && !isImage(cover)) errors.cover = "forms.errors.imageType";
  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    brand: {
      name: { ar: nameAr || nameEn, en: nameEn || nameAr },
      logo: logo || undefined,
      cover: cover || undefined,
      industry: industry!,
      city: same(city),
      about: about ? same(about) : undefined,
      website: website || undefined,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
      crNumber: crNumber || undefined,
    },
  };
}

async function select(brandId: string) {
  (await cookies()).set(BRAND_COOKIE, brandId, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

/**
 * The brand wizard sends everything at once: brand fields from steps 1–3 and, unless skipped,
 * the first product from step 4. Nothing is saved until both are valid.
 */
export async function createBrand(mode: "onboarding" | "add", _prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const brandResult = parseBrand(form);
  const withProduct = form.get("intent") !== "skipProduct";
  const productResult = withProduct ? parseProduct(form) : undefined;
  const errors = { ...brandResult.errors, ...productResult?.errors };
  if (!brandResult.brand || (withProduct && !productResult?.product)) return { errors, values: submitted(form) };

  const created = store.createBrand(brandResult.brand);
  if (productResult?.product) store.createProduct({ brandId: created.id, ...productResult.product });
  await select(created.id);
  revalidatePath("/", "layout");
  redirect(mode === "onboarding" ? "/dashboard" : "/brands?done=brandCreated");
}

export async function updateBrand(brandId: string, _prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const { brand, errors } = parseBrand(form);
  if (!brand) return { errors, values: submitted(form) };
  if (!store.updateBrand(brandId, brand)) redirect("/brands");
  revalidatePath("/", "layout");
  redirect(`/brands?done=brandSaved&brand=${brandId}`);
}

function parseProduct(form: FormData): { product?: Omit<Product, "id" | "brandId">; errors: NonNullable<BrandFormState>["errors"] } {
  const errors: NonNullable<BrandFormState>["errors"] = {};
  const type = oneOf<ProductType>(text(form, "type"), PRODUCT_TYPES);
  const name = text(form, "name");
  const photos = all(form, "photo").filter(isImage).slice(0, 6);
  const description = text(form, "description");
  const priceText = text(form, "price");
  const price = priceText ? Number(priceText) : undefined;
  const benefits = all(form, "benefit").filter(Boolean).slice(0, 5);
  const answers = all(form, "concernA");
  const concerns = all(form, "concernQ")
    .map((question, i) => ({ question, answer: answers[i] || undefined }))
    .filter((c) => c.question);

  if (!type) errors.type = "forms.errors.productTypeRequired";
  if (!name) errors.name = "forms.errors.productNameRequired";
  if (price !== undefined && !(Number.isFinite(price) && price >= 0)) errors.price = "forms.errors.priceInvalid";

  let details: ProductDetails | undefined;
  if (type === "physical") {
    const valueText = text(form, "value");
    const value = valueText ? Number(valueText) : undefined;
    if (value !== undefined && !(Number.isFinite(value) && value >= 0)) errors.value = "forms.errors.priceInvalid";
    details = { type, value, size: text(form, "size") || undefined };
  } else if (type === "app") {
    const downloadLink = withScheme(text(form, "downloadLink"));
    if (downloadLink && !isUrl(downloadLink)) errors.downloadLink = "forms.errors.urlInvalid";
    details = { type, downloadLink: downloadLink || undefined, platforms: all(form, "platforms").filter((p): p is AppPlatform => !!oneOf(p, APP_PLATFORMS)) };
  } else if (type === "service") {
    details = { type, delivery: all(form, "delivery").filter((d): d is ServiceDelivery => !!oneOf(d, SERVICE_DELIVERIES)) };
  } else if (type === "venue") {
    details = { type, kind: oneOf<VenueKind>(text(form, "venueKind"), VENUE_KINDS) ?? "other", location: text(form, "location") || undefined, hours: text(form, "hours") || undefined };
  }
  if (Object.keys(errors).length > 0 || !details) return { errors };

  return {
    errors,
    product: {
      name: same(name),
      photos,
      description: description ? same(description) : undefined,
      price,
      benefits,
      concerns,
      details,
    },
  };
}

/** Adds a product to the selected brand. */
export async function createProduct(_prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const { product, errors } = parseProduct(form);
  if (!product) return { errors, values: submitted(form) };
  const brand = await getCurrentBrand();
  const created = store.createProduct({ brandId: brand.id, ...product });
  revalidatePath("/", "layout");
  redirect(`/brands?done=productAdded&product=${created.id}`);
}

export async function updateProduct(productId: string, _prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const { product, errors } = parseProduct(form);
  if (!product) return { errors, values: submitted(form) };
  const existing = store.getProduct(productId);
  if (!existing || existing.brandId !== (await getCurrentBrand()).id) redirect("/brands");
  store.updateProduct(productId, product);
  revalidatePath("/", "layout");
  redirect(`/brands?done=productSaved&product=${productId}`);
}
