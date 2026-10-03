import { brands, getBrand, products } from "./account";
import type { Brand, Product } from "./types";

/*
 * In-memory brand and product writes, like store.ts: they last until the dev server restarts.
 * Swap for API calls when the backend exists.
 */

function slug(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBrand(input: Omit<Brand, "id">): Brand {
  const brand: Brand = { id: slug("brand"), ...input };
  brands.push(brand);
  return brand;
}

export function updateBrand(id: string, input: Omit<Brand, "id">): Brand | undefined {
  const brand = getBrand(id);
  if (!brand) return undefined;
  Object.assign(brand, input);
  // Clear optional fields the brand removed.
  for (const key of ["logo", "about", "website", "instagram", "tiktok", "cover", "crNumber"] as const) {
    if (input[key] === undefined) delete brand[key];
  }
  return brand;
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function createProduct(input: Omit<Product, "id">): Product {
  const product: Product = { id: slug("product"), ...input };
  products.push(product);
  return product;
}

export function updateProduct(id: string, input: Omit<Product, "id" | "brandId">): Product | undefined {
  const product = getProduct(id);
  if (!product) return undefined;
  Object.assign(product, input);
  if (input.description === undefined) delete product.description;
  if (input.price === undefined) delete product.price;
  return product;
}
