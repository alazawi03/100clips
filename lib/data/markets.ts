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

/** The countries a brand can pick for where it works (and register in): the active markets only. */
export const brandCountries = (): Country[] => COUNTRIES.filter((c) => isActiveMarket(c));
