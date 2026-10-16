import type { Currency, Pricing } from "@/lib/data/types";
import type { Formatters } from "@/lib/i18n/format";
import type { Translator } from "@/lib/i18n/messages";

/** The price as a creator would say it, like "from 8 BHD" or "3.5 BHD / month, with a 7-day free trial". */
export function describePrice(pricing: Pricing, currency: Currency, { t, tp }: Translator, f: Pick<Formatters, "money">): string {
  const money = (amount: number) => f.money(amount, currency);
  const say = "productForm.pricing.say" as const;
  switch (pricing.model) {
    case "one_time":
      return money(pricing.amount);
    case "from":
      return t(`${say}.from`, { amount: money(pricing.amount) });
    case "range":
      return t(`${say}.range`, { amount: money(pricing.amount), max: money(pricing.maxAmount) });
    case "subscription": {
      const price = t(`${say}.perPeriod`, { amount: money(pricing.amount), period: t(`productForm.pricing.per.${pricing.period}`) });
      return pricing.trialDays ? tp(`${say}.trial`, pricing.trialDays, { price }) : price;
    }
    case "free": {
      if (pricing.amount === undefined) return t(`${say}.free`);
      const plan = pricing.period ? t(`${say}.perPeriod`, { amount: money(pricing.amount), period: t(`productForm.pricing.per.${pricing.period}`) }) : money(pricing.amount);
      return t(`${say}.freePlan`, { price: plan });
    }
    case "per_unit":
      return t(`${say}.perUnit`, { amount: money(pricing.amount), unit: t(`productForm.pricing.perUnit.${pricing.unit}`) });
    case "hidden":
      return t(`${say}.hidden`);
  }
}
