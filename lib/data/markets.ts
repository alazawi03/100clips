/*
 * Where 100clips runs, per country (ISO code). Expanding means adding a code here, not touching any page.
 * Active: full access. Creators show in search and brands can order from them.
 * Waitlist (everywhere else): creators can sign up and finish their profile in the app, but brands don't see
 * them and can't order from them. Keep in step with the creator app's lib/data/markets.dart.
 */
import { COUNTRIES, type Country } from "./types";

export type MarketStatus = "active" | "waitlist";

/** Launching in Bahrain only. */
export const ACTIVE_MARKETS: readonly string[] = ["BH"];

export function marketStatus(country: string): MarketStatus {
  return ACTIVE_MARKETS.includes(country.toUpperCase()) ? "active" : "waitlist";
}

export const isActiveMarket = (country: string) => marketStatus(country) === "active";

/** The countries a brand account can be in: the active markets only. */
export const brandCountries = (): Country[] => COUNTRIES.filter((c) => isActiveMarket(c));

/**
 * Each market's money, both with 3 decimals (fils). A brand account is in one country for good (the API's
 * accounts.country), and its balance, prices and payments are all in that country's money.
 */
export type Currency = "BHD" | "KWD";
const CURRENCY: Record<string, Currency> = { BH: "BHD", KW: "KWD" };

/** A country's money; an account from before Kuwait (no country) is Bahraini. */
export const currencyOf = (country?: string | null): Currency => CURRENCY[(country ?? "BH").toUpperCase()] ?? "BHD";

/** The account's country as the dashboard names countries ("bh"). */
export const marketOf = (country?: string | null): Country => ((country ?? "BH").toLowerCase() as Country);

/** Kuwait has no VAT, so no VAT certificate is asked for there. */
export const hasVat = (country: string) => country.toUpperCase() !== "KW";

/** The money's sign as the locale writes it: "د.ب." / "BHD". */
export const currencySign = (currency: Currency, locale: string) => (locale === "ar" ? (currency === "KWD" ? "د.ك." : "د.ب.") : currency);
