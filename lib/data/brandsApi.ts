import { cache } from "react";
import { api, apiOrNothing } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { publicUrl, storeImage } from "./storage";
import type { Brand, Currency, Localized, Pricing, Product, ProductDetails } from "./types";

/** The signed-in owner's brands and products, from the API, in the dashboard's shapes (types.ts). */

type BrandRow = components["schemas"]["Brand"];
type ProductRow = components["schemas"]["Product"];
type Registration = components["schemas"]["Registration"];

/** Both languages, each falling back to the other (a name may be in one only). */
function localized(ar: string | null | undefined, en: string | null | undefined): Localized {
  return { ar: ar || en || "", en: en || ar || "" };
}

function toBrand(row: BrandRow, registration?: Registration): Brand {
  const registered = registration && (registration.cr_number || registration.vat_certificate_path);
  return {
    id: row.id,
    name: localized(row.name_ar, row.name_en),
    logo: publicUrl(row.logo_path),
    industry: row.industry,
    about: row.about ? localized(row.about, row.about) : undefined,
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    tiktok: row.tiktok ?? undefined,
    // Bahrain only for the MVP: a registration means the brand works there.
    countries: registered ? ["bh"] : undefined,
    registrations: registered
      ? { bh: { crNumber: registration.cr_number ?? undefined, vatCertificate: registration.vat_certificate_path?.split("/").at(-1) } }
      : undefined,
  };
}

function toProduct(row: ProductRow): Product {
  // A product's name and description are one text each, shown as the brand typed them.
  return {
    id: row.id,
    brandId: row.brand_id,
    name: localized(row.name, row.name),
    photos: row.photos.map((p) => publicUrl(p)!),
    description: row.description ? localized(row.description, row.description) : undefined,
    currency: row.currency as Currency,
    pricing: (row.pricing as Pricing | null) ?? undefined,
    benefits: row.benefits,
    concerns: row.concerns.map((c) => ({ question: c.question, answer: c.answer || undefined })),
    details: { type: row.type, ...row.details } as ProductDetails,
  };
}

/** The caller's brands, oldest first. Once per request. */
export const myBrands = cache(async (): Promise<Brand[]> => (await api<BrandRow[]>("/brands")).map((b) => toBrand(b)));

/** One of the caller's brands, with its registration (for the edit form). */
export async function myBrand(id: string): Promise<Brand | undefined> {
  const row = (await api<BrandRow[]>("/brands")).find((b) => b.id === id);
  if (!row) return undefined;
  return toBrand(row, await apiOrNothing<Registration>(`/brands/${id}/registration`));
}

export const productsOf = cache(async (brandId: string): Promise<Product[]> =>
  (await api<ProductRow[]>(`/brands/${brandId}/products`)).map(toProduct));

export async function getProduct(id: string): Promise<Product | undefined> {
  const row = await apiOrNothing<ProductRow>(`/products/${id}`);
  return row && toProduct(row);
}

/** The API's body for a brand: names as typed (an empty one is null). A new logo is uploaded first; removing it sends null. */
async function brandBody(brand: Omit<Brand, "id">) {
  return {
    name_ar: brand.name.ar || null,
    name_en: brand.name.en || null,
    logo_path: brand.logo ? ((await storeImage(brand.logo, "logo")) ?? null) : null,
    industry: brand.industry,
    about: brand.about?.ar || brand.about?.en || null,
    website: brand.website ?? null,
    instagram: brand.instagram ?? null,
    tiktok: brand.tiktok ?? null,
  };
}

export async function createBrand(brand: Omit<Brand, "id">): Promise<Brand> {
  const body = await brandBody(brand);
  // A new brand: leave out what's empty rather than sending nulls.
  const row = await api<BrandRow>("/brands", { method: "POST", body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)) });
  return toBrand(row);
}

export async function updateBrand(id: string, brand: Omit<Brand, "id">): Promise<Brand> {
  const row = await api<BrandRow>(`/brands/${id}`, { method: "PATCH", body: await brandBody(brand) });
  return toBrand(row);
}

/** CR number and VAT certificate path; both null clears them. */
export async function setRegistration(brandId: string, crNumber: string | null, vatCertificatePath: string | null) {
  await api(`/brands/${brandId}/registration`, { method: "PUT", body: { cr_number: crNumber, vat_certificate_path: vatCertificatePath } });
}

export async function registrationOf(brandId: string) {
  return apiOrNothing<Registration>(`/brands/${brandId}/registration`);
}

/** The API's body for a product: new photos uploaded first, details without their type. */
async function productBody(product: Omit<Product, "id" | "brandId">) {
  const photos = (await Promise.all(product.photos.map((p) => storeImage(p, "product_photo")))).filter((p): p is string => !!p);
  const { type, ...details } = product.details;
  return {
    type,
    name: product.name.ar || product.name.en,
    description: product.description?.ar || product.description?.en || null,
    photos,
    currency: product.currency,
    pricing: product.pricing ?? null,
    benefits: product.benefits,
    concerns: product.concerns.map((c) => (c.answer ? c : { question: c.question })),
    // Empty optional fields are left out: the API checks each one it gets.
    details: Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined && v !== "")),
  };
}

export async function createProduct(brandId: string, product: Omit<Product, "id" | "brandId">): Promise<Product> {
  const body = await productBody(product);
  const clean = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null));
  return toProduct(await api<ProductRow>(`/brands/${brandId}/products`, { method: "POST", body: clean }));
}

export async function updateProduct(id: string, product: Omit<Product, "id" | "brandId">): Promise<Product> {
  return toProduct(await api<ProductRow>(`/products/${id}`, { method: "PATCH", body: await productBody(product) }));
}

export async function deleteProduct(id: string) {
  await api(`/products/${id}`, { method: "DELETE" });
}

/** A copy next to the original, named "(copy)", with the same photos. */
export async function duplicateProduct(id: string): Promise<Product | undefined> {
  const source = await getProduct(id);
  if (!source) return undefined;
  const name = source.name.ar === source.name.en ? source.name.ar : source.name.en;
  const copyName = /[؀-ۿ]/.test(name) ? `${name} (نسخة)` : `${name} (copy)`;
  return createProduct(source.brandId, { ...source, name: { ar: copyName, en: copyName } });
}
