/**
 * Dates are the market's: Bahrain for the MVP (the API counts deadlines the same way). "Today" is
 * the date there, so a deadline passes once that day is over in Bahrain, wherever the server runs.
 */
export const MARKET_TIME_ZONE = "Asia/Bahrain";

/** Today in the market, yyyy-mm-dd. */
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: MARKET_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The market's date of a moment from the API (an ISO date-time), yyyy-mm-dd. */
export const dayOf = (isoDateTime: string): string => (isoDateTime.length > 10 ? today(new Date(isoDateTime)) : isoDateTime);

/** Now, as an ISO date-time (for things counted in hours, like offers running out). */
export const nowIso = () => new Date().toISOString();

/** "2026-10-03" → "2026-10-04". */
export function nextDay(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
