"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBrand } from "@/lib/data/account";
import * as store from "@/lib/data/brandsStore";
import { isActiveMarket } from "@/lib/data/markets";
import {
  APP_PLATFORMS,
  COUNTRIES,
  INDUSTRIES,
  PRODUCT_TYPES,
  SERVICE_DELIVERIES,
  VENUE_KINDS,
  type AppPlatform,
  type Brand,
  type Country,
  type Industry,
  type Product,
  type ProductDetails,
  type ProductType,
  type ServiceDelivery,
  type VenueKind,
} from "@/lib/data/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES } from "@/lib/images";

/** errors: field → translation key. values: what was sent, so the form can show it again. */
export type BrandFormState = { errors: Partial<Record<string, MessageKey>>; values: Record<string, string | string[]>; createdId?: string } | null;

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function all(form: FormData, name: string) {
  return form.getAll(name).map((v) => String(v).trim());
}

function submitted(form: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    // Files aren't sent back to the form; a browser can't prefill a file field.
    if (key.startsWith("$") || form.get(key) instanceof File) continue;
    const list = all(form, key);
    values[key] = list.length > 1 || ["benefit", "concernQ", "concernA", "photo", "platforms", "delivery", "countries"].includes(key) ? list : list[0];
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
/** google.com/maps, maps.google.*, maps.app.goo.gl or goo.gl/maps links. */
function isGoogleMapsUrl(value: string) {
  if (!isUrl(value)) return false;
  const { hostname, pathname } = new URL(value);
  const host = hostname.replace(/^www\./, "");
  return (/^google\.[a-z.]+$/.test(host) && pathname.startsWith("/maps")) || /^maps\.google\.[a-z.]+$/.test(host) || host === "maps.app.goo.gl" || (host === "goo.gl" && pathname.startsWith("/maps"));
}

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
  const industry = oneOf<Industry>(text(form, "industry"), INDUSTRIES);
  const about = text(form, "about");
  const website = withScheme(text(form, "website"));
  const instagram = handle(text(form, "instagram"));
  const tiktok = handle(text(form, "tiktok"));
  // Only active markets (Bahrain for the MVP) can be picked.
  const countries = all(form, "countries").filter((c): c is Country => (COUNTRIES as string[]).includes(c) && isActiveMarket(c));
  // For each chosen country: its CR number (cr_bh) and VAT certificate (vat_bh), a newly picked
  // file or the one already saved (vat_bhKeep). Both optional.
  const registrations: NonNullable<Brand["registrations"]> = {};
  for (const country of countries) {
    const crNumber = text(form, `cr_${country}`);
    const file = form.get(`vat_${country}`);
    const picked = file instanceof File && file.size > 0 ? file : undefined;
    if (picked && !DOCUMENT_TYPES.includes(picked.type)) errors[`vat_${country}`] = "forms.errors.fileType";
    else if (picked && picked.size > MAX_DOCUMENT_BYTES) errors[`vat_${country}`] = "forms.errors.fileTooBig";
    const vatCertificate = picked ? picked.name : text(form, `vat_${country}Keep`);
    if (crNumber || vatCertificate) registrations[country] = { crNumber: crNumber || undefined, vatCertificate: vatCertificate || undefined };
  }

  if (!nameAr && !nameEn) errors.nameAr = "forms.errors.brandNameRequired";
  if (logo && !isImage(logo)) errors.logo = "forms.errors.imageType";
  if (!industry) errors.industry = "forms.errors.industryRequired";
  if (about.length > 300) errors.about = "forms.errors.aboutTooLong";
  if (website && !isUrl(website)) errors.website = "forms.errors.urlInvalid";
  if (instagram === null) errors.instagram = "forms.errors.handleInvalid";
  if (tiktok === null) errors.tiktok = "forms.errors.handleInvalid";
  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    brand: {
      name: { ar: nameAr || nameEn, en: nameEn || nameAr },
      logo: logo || undefined,
      industry: industry!,
      about: about ? same(about) : undefined,
      website: website || undefined,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
      countries: countries.length > 0 ? countries : undefined,
      registrations: Object.keys(registrations).length > 0 ? registrations : undefined,
    },
  };
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
  revalidatePath("/", "layout");
  // Started from "New campaign" or the cart without a brand: carry on there.
  if (form.get("then") === "campaign") redirect("/campaigns/new");
  if (form.get("then") === "checkout") redirect("/checkout");
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
    const mapUrl = withScheme(text(form, "mapUrl"));
    if (mapUrl && !isGoogleMapsUrl(mapUrl)) errors.mapUrl = "forms.errors.mapUrlInvalid";
    details = { type, kind: oneOf<VenueKind>(text(form, "venueKind"), VENUE_KINDS) ?? "other", location: text(form, "location") || undefined, hours: text(form, "hours") || undefined, mapUrl: mapUrl || undefined };
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

/** Adds a product to a brand. Coming from checkout, it returns there so the cart is still in front of the user. */
export async function createProduct(brandId: string, _prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const { product, errors } = parseProduct(form);
  if (!product) return { errors, values: submitted(form) };
  if (!getBrand(brandId)) redirect("/brands");
  const created = store.createProduct({ brandId, ...product });
  revalidatePath("/", "layout");
  // Inline mode (the checkout drawer): stay on the page and hand the new product back to the form.
  if (form.get("inline") === "1") return { errors: {}, values: {}, createdId: created.id };
  redirect(`/brands?done=productAdded&product=${created.id}`);
}

export async function duplicateProduct(productId: string) {
  const copy = store.duplicateProduct(productId);
  revalidatePath("/", "layout");
  if (copy) redirect(`/brands?done=productDuplicated&product=${copy.id}`);
}

export async function deleteProduct(productId: string) {
  const product = store.getProduct(productId);
  if (!product) return;
  store.deleteProduct(productId);
  revalidatePath("/", "layout");
  redirect(`/brands?done=productDeleted&brand=${product.brandId}`);
}

export async function updateProduct(productId: string, _prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const { product, errors } = parseProduct(form);
  if (!product) return { errors, values: submitted(form) };
  const existing = store.getProduct(productId);
  if (!existing) redirect("/brands");
  store.updateProduct(productId, product);
  revalidatePath("/", "layout");
  redirect(`/brands?done=productSaved&product=${productId}`);
}
