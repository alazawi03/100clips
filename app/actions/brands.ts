"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import * as store from "@/lib/data/brandsApi";
import { pathOfPublicUrl, storeDocument } from "@/lib/data/storage";
import { isActiveMarket } from "@/lib/data/markets";
import {
  APP_PLATFORMS,
  COUNTRIES,
  CURRENCIES,
  INDUSTRIES,
  PRICE_MODELS_BY_TYPE,
  PRICE_PERIODS,
  PRICE_UNITS,
  PRODUCT_TYPES,
  SERVICE_DELIVERIES,
  VENUE_KINDS,
  type AppPlatform,
  type Brand,
  type Country,
  type Currency,
  type Industry,
  type PriceModel,
  type PricePeriod,
  type PriceUnit,
  type Pricing,
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

/** Images arrive as resized data URLs from the browser, or as links to ones already in storage. */
function isImage(value: string) {
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) || pathOfPublicUrl(value) !== undefined;
}

/** The API refused or couldn't be reached: shown on the form's first field, and logged. */
function saveFailed(error: unknown, field: string, form: FormData): BrandFormState {
  console.error("Saving failed:", error instanceof ApiError ? `${error.status} ${error.message}` : error);
  return { errors: { [field]: "forms.errors.saveFailed" }, values: submitted(form) };
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
  // Not asked in the form: new brands are "other", edits keep what the brand has.
  const industry = oneOf<Industry>(text(form, "industry"), INDUSTRIES) ?? "other";
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
  if (about.length > 300) errors.about = "forms.errors.aboutTooLong";
  if (website && !isUrl(website)) errors.website = "forms.errors.urlInvalid";
  if (instagram === null) errors.instagram = "forms.errors.handleInvalid";
  if (tiktok === null) errors.tiktok = "forms.errors.handleInvalid";
  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    brand: {
      // As typed: an empty one stays empty (the API stores each language in its own column).
      name: { ar: nameAr, en: nameEn },
      logo: logo || undefined,
      industry,
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
export async function createBrand(_prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const brandResult = parseBrand(form);
  const withProduct = form.get("intent") !== "skipProduct";
  const productResult = withProduct ? parseProduct(form) : undefined;
  const errors = { ...brandResult.errors, ...productResult?.errors };
  if (!brandResult.brand || (withProduct && !productResult?.product)) return { errors, values: submitted(form) };

  try {
    const created = await store.createBrand(brandResult.brand);
    await saveRegistration(created.id, form, brandResult.brand);
    if (productResult?.product) await store.createProduct(created.id, productResult.product);
  } catch (e) {
    return saveFailed(e, "nameAr", form);
  }
  revalidatePath("/", "layout");
  // Started from "New campaign" or the cart without a brand: carry on there.
  if (form.get("then") === "campaign") redirect("/campaigns/new");
  if (form.get("then") === "checkout") redirect("/checkout");
  redirect("/brands?done=brandCreated");
}

export async function updateBrand(brandId: string, _prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const { brand, errors } = parseBrand(form);
  if (!brand) return { errors, values: submitted(form) };
  try {
    await store.updateBrand(brandId, brand);
    await saveRegistration(brandId, form, brand);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) redirect("/brands");
    return saveFailed(e, "nameAr", form);
  }
  revalidatePath("/", "layout");
  redirect(`/brands?done=brandSaved&brand=${brandId}`);
}

/**
 * Bahrain's CR number and VAT certificate (the MVP's one market). A newly picked certificate is
 * uploaded to private-docs; otherwise the saved one is kept, unless Bahrain was unticked.
 */
async function saveRegistration(brandId: string, form: FormData, brand: Omit<Brand, "id">) {
  const bh = brand.registrations?.bh;
  const file = form.get("vat_bh");
  const picked = file instanceof File && file.size > 0 ? file : undefined;
  const saved = await store.registrationOf(brandId);
  const vatPath = picked ? await storeDocument(picked) : bh?.vatCertificate ? (saved?.vat_certificate_path ?? null) : null;
  const crNumber = bh?.crNumber ?? null;
  if (crNumber === (saved?.cr_number ?? null) && vatPath === (saved?.vat_certificate_path ?? null)) return;
  await store.setRegistration(brandId, crNumber, vatPath);
}

/** An amount typed in the form: undefined when empty, NaN when it isn't a price. */
function amountOf(form: FormData, name: string): number | undefined {
  const value = text(form, name);
  if (!value) return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : NaN;
}

/** The price fields for the chosen model (only the models the type offers); errors under the fields' names. */
function parsePricing(form: FormData, type: ProductType, errors: NonNullable<BrandFormState>["errors"]): Pricing | undefined {
  const model = oneOf<PriceModel>(text(form, "priceModel"), PRICE_MODELS_BY_TYPE[type]);
  if (!model) return undefined;
  if (model === "hidden") return { model };
  const amount = amountOf(form, "price");
  const period = oneOf<PricePeriod>(text(form, "pricePeriod"), PRICE_PERIODS) ?? "month";
  // A free product's paid plan is optional; every other model needs its price.
  if (amount === undefined && model !== "free") errors.price = "forms.errors.priceRequired";
  else if (Number.isNaN(amount)) errors.price = "forms.errors.priceInvalid";
  if (model === "free") {
    if (amount === undefined || Number.isNaN(amount)) return { model };
    const planPeriod = oneOf<PricePeriod>(text(form, "pricePeriod"), PRICE_PERIODS);
    return planPeriod ? { model, amount, period: planPeriod } : { model, amount };
  }
  if (amount === undefined || Number.isNaN(amount)) return undefined;
  if (model === "range") {
    const maxAmount = amountOf(form, "priceMax");
    if (maxAmount === undefined) errors.priceMax = "forms.errors.priceRequired";
    else if (Number.isNaN(maxAmount)) errors.priceMax = "forms.errors.priceInvalid";
    else if (maxAmount <= amount) errors.priceMax = "forms.errors.priceRangeInvalid";
    return maxAmount !== undefined && maxAmount > amount ? { model, amount, maxAmount } : undefined;
  }
  if (model === "subscription") {
    const trialText = text(form, "trialDays");
    const trialDays = trialText ? Number(trialText) : undefined;
    if (trialDays !== undefined && !(Number.isInteger(trialDays) && trialDays >= 1 && trialDays <= 365)) errors.trialDays = "forms.errors.trialInvalid";
    return trialDays ? { model, amount, period, trialDays } : { model, amount, period };
  }
  if (model === "per_unit") return { model, amount, unit: oneOf<PriceUnit>(text(form, "priceUnit"), PRICE_UNITS) ?? "person" };
  return { model, amount };
}

function parseProduct(form: FormData): { product?: Omit<Product, "id" | "brandId">; errors: NonNullable<BrandFormState>["errors"] } {
  const errors: NonNullable<BrandFormState>["errors"] = {};
  const type = oneOf<ProductType>(text(form, "type"), PRODUCT_TYPES);
  const name = text(form, "name");
  const photos = all(form, "photo").filter(isImage).slice(0, 6);
  const description = text(form, "description");
  const currency = oneOf<Currency>(text(form, "currency"), CURRENCIES) ?? "BHD";
  const benefits = all(form, "benefit").filter(Boolean).slice(0, 5);
  // Every question needs its answer; a row left completely empty is dropped.
  const questions = all(form, "concernQ");
  const answers = all(form, "concernA");
  const concerns: Product["concerns"] = [];
  questions.forEach((question, i) => {
    const answer = answers[i] ?? "";
    if (!question && !answer) return;
    if (!question) errors[`concernQ-${i}`] = "forms.errors.concernQuestionRequired";
    if (!answer) errors[`concernA-${i}`] = "forms.errors.concernAnswerRequired";
    concerns.push({ question, answer });
  });

  if (!type) errors.type = "forms.errors.productTypeRequired";
  if (!name) errors.name = "forms.errors.productNameRequired";
  const pricing = type ? parsePricing(form, type, errors) : undefined;

  let details: ProductDetails | undefined;
  if (type === "physical") {
    details = { type, size: text(form, "size") || undefined };
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
      currency,
      pricing,
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
  let created;
  try {
    created = await store.createProduct(brandId, product);
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) redirect("/brands");
    return saveFailed(e, "name", form);
  }
  revalidatePath("/", "layout");
  // Inline mode (the checkout drawer): stay on the page and hand the new product back to the form.
  if (form.get("inline") === "1") return { errors: {}, values: {}, createdId: created.id };
  redirect(`/brands?done=productAdded&product=${created.id}`);
}

export async function duplicateProduct(productId: string) {
  const copy = await store.duplicateProduct(productId);
  revalidatePath("/", "layout");
  if (copy) redirect(`/brands?done=productDuplicated&product=${copy.id}`);
}

export async function deleteProduct(productId: string) {
  const product = await store.getProduct(productId);
  if (!product) return;
  try {
    await store.deleteProduct(productId);
  } catch (e) {
    // A campaign features it (409): it stays, and the page shows it as before.
    if (e instanceof ApiError && e.status === 409) redirect(`/brands?done=productInUse&brand=${product.brandId}`);
    throw e;
  }
  revalidatePath("/", "layout");
  redirect(`/brands?done=productDeleted&brand=${product.brandId}`);
}

export async function updateProduct(productId: string, _prev: BrandFormState, form: FormData): Promise<BrandFormState> {
  const { product, errors } = parseProduct(form);
  if (!product) return { errors, values: submitted(form) };
  try {
    await store.updateProduct(productId, product);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) redirect("/brands");
    return saveFailed(e, "name", form);
  }
  revalidatePath("/", "layout");
  redirect(`/brands?done=productSaved&product=${productId}`);
}
