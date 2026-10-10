import { brands } from "@/lib/data/account";

/** More than one brand on the account: this is when brand columns and filters are shown. */
export const hasManyBrands = () => brands.length > 1;

/** The brand id from ?brand=, if it is one of the account's brands and there is more than one. */
export function brandFilterOf(raw: unknown): string | undefined {
  return hasManyBrands() && brands.some((b) => b.id === raw) ? (raw as string) : undefined;
}

/** Builds "/path?status=x&brand=y", leaving out empty values. */
export function href(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  return query ? `${path}?${query}` : path;
}
