import type { Localized } from "@/lib/data/types";
import type { Locale } from "./config";

/** Western digits and the Gregorian calendar in both languages (see DESIGN.ar.html). */
function tag(locale: Locale) {
  return locale === "ar" ? "ar-BH-u-nu-latn-ca-gregory" : "en-BH-u-ca-gregory";
}


/**
 * `currency` is the brand account's money (BHD, or KWD in Kuwait: lib/data/markets.ts): what its balance, creators'
 * prices and payments are in.
 */
export function createFormatters(locale: Locale, currency: string = "BHD") {
  // Whole dinars show no decimals; anything else shows all three fils digits (1,240.500).
  const wholeMoney = new Intl.NumberFormat(tag(locale), { style: "currency", currency, maximumFractionDigits: 0 });
  const money = new Intl.NumberFormat(tag(locale), { style: "currency", currency, minimumFractionDigits: 3 });
  const signedWhole = new Intl.NumberFormat(tag(locale), { style: "currency", currency, maximumFractionDigits: 0, signDisplay: "exceptZero" });
  const signed = new Intl.NumberFormat(tag(locale), { style: "currency", currency, minimumFractionDigits: 3, signDisplay: "exceptZero" });
  const number = new Intl.NumberFormat(tag(locale));
  const compact = new Intl.NumberFormat(tag(locale), { notation: "compact", maximumFractionDigits: 1 });
  const shortDate = new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", timeZone: "Asia/Bahrain" });
  const clock = new Intl.DateTimeFormat(tag(locale), { hour: "numeric", minute: "2-digit", timeZone: "Asia/Bahrain" });
  const dateTime = new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Bahrain" });

  // Other currencies (a product's price): whole amounts without decimals, the rest with the currency's own digits.
  const byCurrency = new Map<string, { whole: Intl.NumberFormat; exact: Intl.NumberFormat }>();
  const inCurrency = (currency: string) => {
    let formats = byCurrency.get(currency);
    if (!formats) {
      formats = {
        whole: new Intl.NumberFormat(tag(locale), { style: "currency", currency, maximumFractionDigits: 0 }),
        exact: new Intl.NumberFormat(tag(locale), { style: "currency", currency }),
      };
      byCurrency.set(currency, formats);
    }
    return formats;
  };

  return {
    /** Amount in the account's money, or in another currency when given (a product's price). */
    money: (amount: number, other = currency) => {
      if (other === currency) return (Number.isInteger(amount) ? wholeMoney : money).format(amount);
      const { whole, exact } = inCurrency(other);
      return (Number.isInteger(amount) ? whole : exact).format(amount);
    },
    /** Amount in the account's money with a + or − sign placed the way the locale expects. */
    signedMoney: (amount: number) => (Number.isInteger(amount) ? signedWhole : signed).format(amount),
    number: (value: number) => number.format(value),
    compact: (value: number) => compact.format(value),
    /** A date (yyyy-mm-dd), or a date-time from the API: the day it was in Bahrain. */
    date: (iso: string) => shortDate.format(iso.length > 10 ? new Date(iso) : new Date(`${iso}T12:00:00+03:00`)),
    /** Message time: just the clock for today (Bahrain time), date and clock otherwise. */
    messageTime: (isoDateTime: string, today: string) => {
      const d = new Date(isoDateTime);
      const sameDay = d.toLocaleDateString("en-CA", { timeZone: "Asia/Bahrain" }) === today;
      return (sameDay ? clock : dateTime).format(d);
    },
    duration: (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    pick: (value: Localized) => value[locale],
  };
}

export type Formatters = ReturnType<typeof createFormatters>;
